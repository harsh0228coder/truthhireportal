from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, BackgroundTasks, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from groq import Groq
from pydantic import BaseModel, field_validator
import pdfplumber
import io
import os
import json
import hashlib
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Union, List, Optional, Any
from fastapi.staticfiles import StaticFiles
from database import SessionLocal, engine
from models import Job, Recruiter, User, Application, SavedJob, JobApplication, Admin, Project, Achievement, Certification, SkillGap, AIFeedback, Waitlist
import random
import string, requests
from bs4 import BeautifulSoup
import re
import models
import sys
from fastapi.responses import JSONResponse, HTMLResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
import asyncio
import aiosmtplib
from email.message import EmailMessage
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy import or_
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from supabase import create_client, Client

# --- CONFIGURATION ---
OTP_STORE = {} 
OTP_EXPIRY_SECONDS = 300  # 5 minutes

# --- CONFIGURATION (Add this near the top with other configs) ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") # Ensure this is the SERVICE_ROLE key

# Initialize Supabase Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Warning: Supabase client failed to initialize. Check env vars. Error: {e}")
    
load_dotenv()

GOOGLE_CLIENT_ID = "156178217038-72bv7qfb4o2an9b0o8qdsbq5uekecnu9.apps.googleusercontent.com"

SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_key_change_this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

from starlette.requests import Request

# Logging middleware removed for performance

os.makedirs("static/resumes", exist_ok=True)

# Allow Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ai_client = Groq(api_key=GROQ_API_KEY)

ANALYSIS_CACHE = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ADD THIS PYDANTIC MODEL ---
class GoogleAuthRequest(BaseModel):
    access_token: str

# --- ADD THIS NEW ENDPOINT ---
@app.post("/users/google-auth")
def google_auth(
    data: GoogleAuthRequest, 
    background_tasks: BackgroundTasks,  # <--- Added this dependency
    db: Session = Depends(get_db)
):
    try:
        # 1. Verify Token with Google
        google_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {data.access_token}"}
        )
        
        if google_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google Token")
            
        google_data = google_res.json()
        email = google_data.get("email")
        name = google_data.get("name")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")

        # 2. Check if user exists
        user = db.query(User).filter(User.email == email).first()
        is_new_user = False
        
        if not user:
            # --- REGISTER NEW USER ---
            is_new_user = True
            
            # Generate a random strong password (since they use Google)
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=24))
            password_hash = bcrypt.hashpw(random_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user = User(
                name=name,
                email=email,
                password_hash=password_hash,
                is_student_verified=True # Google emails are verified by default
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # --- 📧 SEND WELCOME EMAIL ---
            # This runs in the background to keep the API fast
            print(f"🚀 Sending Google welcome email to {email}")
            background_tasks.add_task(send_welcome_email, email, name)

        # 3. --- LOGIN (Generate Token) ---
        access_token = create_access_token(data={"sub": str(user.id), "role": "student"})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "is_new_user": is_new_user 
        }

    except Exception as e:
        print(f"Google Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")
    

# --- 🧠 THE TRUTH ENGINE (Robust AI Analysis) ---
def clean_text_for_ai(text: str) -> str:
    """
    Cleans text to remove PDF artifacts, zero-width spaces, and messy formatting.
    This prevents the AI from getting confused by hidden characters.
    """
    if not text: return ""
    
    # 1. Replace newlines and tabs with spaces
    text = text.replace('\n', ' ').replace('\t', ' ')
    
    # 2. Remove non-printable characters (like \xa0, \x00)
    # This removes the "garbage" often found in PDF extractions
    text = re.sub(r'[^\x20-\x7E]', ' ', text)
    
    # 3. Collapse multiple spaces
    return " ".join(text.split())

# --- UPDATED: get_ai_gap_analysis with job_id support ---
def get_ai_gap_analysis(resume_text: str, job_description: str, candidate_id: str = "anon", job_id: str = "general") -> dict:
    # 1. Sanitize Inputs
    clean_resume = clean_text_for_ai(resume_text)
    clean_jd = clean_text_for_ai(job_description)

    # Basic Check
    if len(clean_resume) < 50:
        return { 
            "score": 0, 
            "matched_skills": [], 
            "missing_skills": ["Resume unreadable"], 
            "defense_strategies": {}, 
            "experience_analysis": "No data",
            "coach_message": "Please upload a clear PDF resume." 
        }

    # 2. CACHE CHECK (Now includes job_id to prevent collision between similar admin jobs)
    # v8 ensures old cache is invalidated
    key_src = (f"{candidate_id}||{job_id}||{clean_resume[:2000]}||{clean_jd[:2000]}||v8").encode('utf-8')
    key = hashlib.sha256(key_src).hexdigest()
    
    if key in ANALYSIS_CACHE: return ANALYSIS_CACHE[key]

    if not os.getenv("GROQ_API_KEY"):
        return { "score": 0, "matched_skills": [], "missing_skills": ["Config Error"], "defense_strategies": {}, "coach_message": "API Key missing." }

    try:
        # 3. THE UNIVERSAL RECRUITER PROMPT (Unchanged Logic)
        prompt = f"""
        Role: Expert Talent Acquisition Specialist (Domain Agnostic).
        Task: Perform a Gap Analysis and provide INTERVIEW DEFENSE STRATEGIES.

        ### STEP 1: ANALYZE THE JOB DOMAIN
        - Read the JD to understand if it is Technical (Coding), Non-Technical (Sales, Marketing), Operational (Admin, HR), or Data-focused.
        - Only look for skills RELEVANT to that specific domain.

        ### JOB DESCRIPTION
        {clean_jd[:3000]}

        ### RESUME TEXT
        {clean_resume[:3000]}

        ### STRICT INSTRUCTIONS (CRITICAL)
        1. **NO HALLUCINATIONS:** Only list skills EXPLICITLY mentioned in the JD.
        2. **Soft Skills Matter:** If non-technical, weigh Communication, Leadership higher.
        3. **Experience Check:** Compare "Required Years" vs "Actual Years".
        4. **DEFENSE STRATEGY:** For every MISSING skill, provide a **UNIQUE** 1-sentence strategic answer.

        ### OUTPUT JSON ONLY
        {{
            "score": <integer 0-100>,
            "matched_skills": ["Skill1 found"],
            "missing_skills": ["Skill2 missing"],
            "defense_strategies": {{
                "Skill2": "Strategy sentence..."
            }},
            "experience_verdict": "Matches seniority",
            "coach_message": "Constructive advice."
        }}
        """

        # 4. Call AI
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1, 
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        
        # 5. Robust JSON Parsing
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            if "{" in content:
                start = content.find("{")
                end = content.rfind("}") + 1
                result = json.loads(content[start:end])
            else:
                raise ValueError("No JSON found")

        # --- SELF-HEALING LOGIC ---
        missing = result.get("missing_skills", [])[:10]
        strategies = result.get("defense_strategies", {})
        cleaned_strategies = {}

        for skill in missing:
            found_strategy = None
            if skill in strategies:
                found_strategy = strategies[skill]
            else:
                for k, v in strategies.items():
                    if skill.lower() in k.lower():
                        found_strategy = v
                        break
            
            if found_strategy:
                cleaned_strategies[skill] = found_strategy
            else:
                cleaned_strategies[skill] = f"Although I haven't used {skill} commercially, my experience allows me to adapt fast."

        # 6. Format Final Result
        final_result = {
            "score": int(result.get("score", 0)),
            "matched_skills": result.get("matched_skills", [])[:10],
            "missing_skills": missing,
            "defense_strategies": cleaned_strategies,
            "coach_message": f"{result.get('experience_verdict', '')}. {result.get('coach_message', '')}".strip()
        }

        # Cache it
        ANALYSIS_CACHE[key] = final_result
        return final_result

    except Exception as e:
        print(f"⚠️ AI Analysis Failed: {e}")
        return {
            "score": 0, 
            "matched_skills": [], 
            "missing_skills": ["AI Service Error"], 
            "defense_strategies": {},
            "coach_message": "Analysis failed. Please try again later."
        }

# --- 🛡️ TRUTH ENGINE: JOB GUARD AI (Professional Grade) ---
def analyze_job_trust(title: str, description: str, salary_min: int = None, salary_max: int = None, currency: str = "INR", location_type: str = "On-site") -> dict:
    """
    Advanced AI analysis to detect scams, low-quality posts, and unrealistic offers.
    Now considers Salary Realism and Work Mode context.
    """
    
    # 1. Sanitize Input
    clean_text = clean_text_for_ai(description)
    salary_info = "Not Disclosed"
    if salary_min and salary_max:
        salary_info = f"{currency} {salary_min:,} - {salary_max:,}"
    
    # 2. Check API Key
    if not os.getenv("GROQ_API_KEY"):
        return {"trust_score": 85, "reason": "AI Config Missing", "verdict": "SAFE"} 

    try:
        # 3. The Professional Auditor Prompt
        prompt = f"""
        Role: Elite Job Board Compliance Auditor & Fraud Analyst.
        Task: Analyze this job posting for SCAMS, UNREALISTIC PROMISES, or LOW QUALITY content.

        ### JOB CONTEXT
        - Title: {title}
        - Salary Offered: {salary_info}
        - Work Mode: {location_type}
        - Description Snippet: {clean_text[:5000]}

        ### SCORING CRITERIA (0 - 100)
        
        **1. FATAL RED FLAGS (Score: 0-30 | Verdict: SCAM)**
        - Mentions "Telegram", "WhatsApp", or personal emails (gmail/yahoo) for contact.
        - Requests for money, security deposits, or "ID card fees".
        - "Easy money", "No experience needed" for high-paying roles.
        - MLM, Pyramid Schemes, or "Investment" roles disguising as jobs.
        - Unrealistic Salary: e.g., "Data Entry" paying ₹1,00,000/month or $50/hr for unskilled work.

        **2. WARNING SIGNS (Score: 40-70 | Verdict: SUSPICIOUS)**
        - Vague responsibilities (e.g., "Do whatever required").
        - Excessive grammar/spelling errors suggesting unprofessionalism.
        - All caps text or excessive emojis.
        - Title does not match the description (e.g., Title: "Manager", Desc: "Door-to-door sales").

        **3. PROFESSIONAL STANDARDS (Score: 71-100 | Verdict: SAFE)**
        - Clear "About", "Responsibilities", and "Requirements" sections.
        - Specific tech stack or hard skills listed.
        - Professional tone and formatting.
        - Salary is market-standard for the role title.

        ### INSTRUCTIONS
        - Be strict on Remote/Data Entry jobs (high scam risk).
        - Be lenient on Sales jobs mentioning "commissions" (normal industry practice).
        - If Salary is provided, cross-reference it with the Job Title for realism.

        ### OUTPUT JSON ONLY
        {{
            "trust_score": <int 0-100>,
            "flagged_issues": ["Specific Issue 1", "Specific Issue 2"],
            "verdict": "SAFE" or "SUSPICIOUS" or "SCAM"
        }}
        """

        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1, # Low temp for consistent, strict analysis
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        result = json.loads(content)
        
        return {
            "trust_score": int(result.get("trust_score", 60)),
            "reason": ", ".join(result.get("flagged_issues", [])),
            "verdict": result.get("verdict", "SUSPICIOUS")
        }

    except Exception as e:
        print(f"⚠️ Job Analysis Failed: {e}")
        # Fallback mechanism
        return {"trust_score": 80, "reason": "AI Service Unavailable", "verdict": "SAFE"}

class UrlRequest(BaseModel):
    url: str

@app.post("/fetch-job-content")
def fetch_job_content(data: UrlRequest):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "[https://www.google.com/](https://www.google.com/)"
        }
        
        response = requests.get(data.url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Site returned status {response.status_code}")

        soup = BeautifulSoup(response.text, "html.parser")
        
        for script in soup(["script", "style", "nav", "footer", "header", "iframe", "svg"]):
            script.extract()
            
        text = soup.get_text(separator=' ')
        
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = '\n'.join(chunk for chunk in chunks if chunk)
        
        if len(clean_text) < 100:
             raise HTTPException(status_code=400, detail="Content too short or blocked by site security.")

        return {"content": clean_text[:5000]}

    except Exception as e:
        print(f"Scrape Error: {e}")
        raise HTTPException(status_code=400, detail=f"Error scraping URL: {str(e)}")


# ===========================
# 📧 EMAIL FUNCTIONS
# ===========================

def send_admin_recruiter_alert(recruiter_name: str, recruiter_email: str, linkedin_url: str):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    # Change this to your actual admin email or set ADMIN_EMAIL in your .env file
    admin_email = os.getenv("ADMIN_EMAIL", "hrtruthhire@gmail.com") 

    headline = "⚠️ Action Required: Verify Recruiter"
    
    content_html = f"""
    <p>Hello Admin,</p>
    <p>A new recruiter has registered using a <strong>public email domain</strong> and has been placed in the verification queue.</p>
    
    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #9a3412; text-transform: uppercase;">Recruiter Details</p>
        <ul style="margin: 0; padding-left: 20px; color: #431407;">
            <li style="margin-bottom: 8px;"><strong>Name:</strong> {recruiter_name}</li>
            <li style="margin-bottom: 8px;"><strong>Email:</strong> {recruiter_email}</li>
            <li style="margin-bottom: 8px;"><strong>LinkedIn:</strong> <a href="{linkedin_url}" style="color: #ea580c;">View Profile</a></li>
            <li><strong>Status:</strong> <span style="background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;">PENDING</span></li>
        </ul>
    </div>
    
    <p>Please review their LinkedIn profile to verify their employment details.</p>
    """
    
    # You can update this link to point to your actual admin dashboard URL
    cta_link = "http://localhost:3000/admin/recruiters" 
    
    final_html = get_base_email_template(headline, content_html, "Open Admin Dashboard", cta_link)

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire System <{sender_email}>"
    msg['To'] = admin_email
    msg['Subject'] = f"New Verification Request: {recruiter_name}"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Admin alert sent regarding {recruiter_email}")
    except Exception as e:
        print(f"❌ Failed to send admin alert: {e}")

# --- UPDATED MAGIC LINK ENDPOINT ---
@app.get("/public/magic-status", response_class=HTMLResponse)
def magic_status_update(
    app_id: int, 
    status: str, 
    token: str, 
    background_tasks: BackgroundTasks, # <--- Added this to send email
    db: Session = Depends(get_db)
):
    # 1. Verify Application
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    
    if not app:
        return """<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px;"><h1 style="color: #dc2626;">Error</h1><p>Application not found or link expired.</p></body></html>"""
    
    # 2. Prevent Double Updates (Idempotency)
    # If status is already final (shortlisted/rejected), show "Already Updated" message
    if app.status in ['shortlisted', 'rejected']:
        color = "#3b82f6" # Blue
        title = "Status Already Updated"
        message = f"You have already marked <strong>{app.applicant_name}</strong> as <strong>{app.status.title()}</strong>."
        
        return f"""
        <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="background: white; padding: 40px; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <div style="width: 60px; height: 60px; background-color: {color}15; color: {color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 30px;">ℹ️</div>
                    <h1 style="margin: 0 0 10px; font-size: 24px; color: #111827;">{title}</h1>
                    <p style="margin: 0 0 30px; font-size: 16px; color: #6b7280;">{message}</p>
                    <p style="font-size: 12px; color: #9ca3af;">Candidate was already notified.</p>
                </div>
            </body>
        </html>
        """

    # 3. Update Status in DB
    new_status = status.lower()
    app.status = new_status
    db.commit()
    
    # 4. SEND EMAIL TO CANDIDATE (The Fix)
    try:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        hr_name = "Hiring Team"
        
        # Try to find recruiter name if available
        if job and job.recruiter_id:
            rec = db.query(Recruiter).filter(Recruiter.id == job.recruiter_id).first()
            if rec: hr_name = rec.name

        if job:
            background_tasks.add_task(
                send_candidate_update_email,
                candidate_email=app.applicant_email, 
                candidate_name=app.applicant_name, 
                job_title=job.title,
                company_name=job.company_name,
                hr_name=hr_name,
                status=new_status, 
                feedback=None # No feedback via quick magic link
            )
    except Exception as e:
        print(f"Failed to trigger student email from magic link: {e}")

    # 5. Success Page UI
    color = "#16a34a" if new_status == 'shortlisted' else "#dc2626"
    title = "Candidate Shortlisted! 🎉" if new_status == 'shortlisted' else "Candidate Rejected."
    message = f"You have successfully marked <strong>{app.applicant_name}</strong> as <strong>{new_status.title()}</strong>."
    
    return f"""
    <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <div style="width: 60px; height: 60px; background-color: {color}15; color: {color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 30px;">
                    {'✓' if new_status == 'shortlisted' else '✕'}
                </div>
                <h1 style="margin: 0 0 10px; font-size: 24px; color: #111827;">{title}</h1>
                <p style="margin: 0 0 30px; font-size: 16px; color: #6b7280;">{message}</p>
                <p style="font-size: 12px; color: #9ca3af;">Candidate has been notified via email.</p>
            </div>
        </body>
    </html>
    """

# --- UPDATED: send_application_email with Magic Links ---
def send_application_email(hr_email: str, job_title: str, candidate_data: dict, cover_note: str, resume_path: str = None, is_cold_outreach: bool = False, app_id: int = None):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    # 1. Prepare Data
    score = candidate_data.get('score', 0)
    score_color = "#16a34a" if score >= 75 else "#d97706"
    score_bg = "#f0fdf4" if score >= 75 else "#fffbeb"
    
    matched_list = candidate_data.get('matched', [])
    matched_str = ", ".join(matched_list) if matched_list else "General profile match."
    
    missing_list = candidate_data.get('missing', [])
    missing_str = ", ".join(missing_list) if missing_list else "No critical skills missing."

    headline = "Candidate Match Found" if is_cold_outreach else "New Application Received"
    
    # 2. Generate Magic Links (Strategy B)
    # REPLACE THIS with your actual domain when deploying
    base_url = "http://localhost:8000"  # OR "http://localhost:8000" for local testing
    dummy_token = "secure_token_123" # In production, generate a real hash
    
    magic_actions_html = ""
    if app_id:
        approve_link = f"{base_url}/public/magic-status?app_id={app_id}&status=shortlisted&token={dummy_token}"
        reject_link = f"{base_url}/public/magic-status?app_id={app_id}&status=rejected&token={dummy_token}"
        
        magic_actions_html = f"""
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Quick Actions (No Login Required)</p>
            <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="48%" style="padding-right: 2%;">
                        <a href="{approve_link}" style="display: block; background-color: #16a34a; color: #ffffff; text-align: center; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">✅ Shortlist</a>
                    </td>
                    <td width="48%" style="padding-left: 2%;">
                        <a href="{reject_link}" style="display: block; background-color: #ffffff; border: 1px solid #d1d5db; color: #dc2626; text-align: center; padding: 11px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">❌ Reject</a>
                    </td>
                </tr>
            </table>
        </div>
        """

    # 3. Build the Candidate Card HTML
    candidate_card = f"""
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background-color: #ffffff; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
                <td valign="middle">
                    <h3 style="margin: 0 0 4px; font-size: 18px; color: #111827; font-weight: 700;">{candidate_data['name']}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">{candidate_data['email']}</p>
                </td>
                <td valign="middle" align="right">
                    <span style="background-color: {score_bg}; color: {score_color}; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; border: 1px solid {score_color}30;">
                        {score}% Match
                    </span>
                </td>
            </tr>
        </table>
        
        <div style="border-top: 1px dashed #e5e7eb; padding-top: 16px; margin-bottom: 16px;">
            <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">✅ Verified Skills</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">{matched_str}</p>
            </div>
            
            <div>
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Missing / Unverified</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">{missing_str}</p>
            </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; border-left: 3px solid #e5e7eb;">
            <p style="margin: 0 0 4px; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase;">MESSAGE FROM CANDIDATE</p>
            <p style="margin: 0; font-style: italic; color: #4b5563; font-size: 14px; line-height: 1.5;">"{cover_note}"</p>
        </div>

        {magic_actions_html}
    </div>
    """

    body_content = f"""
    <p>Hello,</p>
    <p>We found a verified candidate for the <strong>{job_title}</strong> position.</p>
    
    {candidate_card}
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">The candidate's resume is attached to this email for your detailed review.</p>
    """

    # Generate Full HTML
    # Note: Replace localhost link with your actual recruiter dashboard link in production
    final_html = get_base_email_template(headline, body_content, "Login to View Full Profile", "http://localhost:3000/recruiter/login")

    msg = MIMEMultipart('mixed')
    msg['From'] = f"TruthHire Talent <{sender_email}>"
    msg['To'] = hr_email
    msg['Subject'] = f"Action Required: {candidate_data['name']} for {job_title}"
    
    # Attach HTML Body
    msg_body = MIMEMultipart('alternative')
    msg_body.attach(MIMEText(final_html, 'html'))
    msg.attach(msg_body)

    # Attach Resume
    if resume_path and os.path.exists(resume_path):
        try:
            with open(resume_path, "rb") as f:
                part = MIMEApplication(f.read(), _subtype="pdf")
                part.add_header('Content-Disposition', 'attachment', filename=os.path.basename(resume_path))
                msg.attach(part)
        except Exception as e:
            print(f"⚠️ Error attaching resume: {e}")

    # Send Email
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Application email sent to {hr_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")


def send_candidate_update_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str, hr_name: str, status: str, feedback: str = None):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    current_year = datetime.now().year
    
    # --- A. SHORTLISTED TEMPLATE (Green/Positive) ---
    if status == "shortlisted":
        subject = f"Great News: You've been shortlisted for {job_title}"
        accent_color = "#16A34A" # Green
        headline = "Congratulations! 🎉"
        email_content = f"""
        <p>Dear {candidate_name},</p>
        <p>We are pleased to inform you that your application for the <strong>{job_title}</strong> position at <strong>{company_name}</strong> has been shortlisted.</p>
        <p>Our hiring team was impressed with your profile and we would like to move forward to the next stage of our selection process.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #166534;">What happens next?</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #14532d;">
                Our team will contact you shortly (via email or phone) to schedule an interview or share an assignment. Please keep an eye on your inbox.
            </p>
        </div>
        
        <p>In the meantime, feel free and practice for your upcoming interview or assignment.</p>
        """
        cta_text = "View Application Status"
        cta_link = "http://localhost:3000/my-applications"

    # --- B. REJECTED TEMPLATE (Grey/Professional) ---
    else: # status == 'rejected'
        subject = f"Update on your application for {job_title}"
        accent_color = "#64748B" # Slate Grey
        headline = "Application Status"
        email_content = f"""
        <p>Dear {candidate_name},</p>
        <p>Thank you for giving us the opportunity to review your application for the <strong>{job_title}</strong> role at {company_name}.</p>
        <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We received many qualified applicants, making this a difficult decision.</p>
        <p>We will keep your resume in our talent pool and reach out if a role better suited to your skills opens up in the future.</p>
        """
        
        # Add Specific Feedback if provided by Recruiter
        if feedback:
            email_content += f"""
            <div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border-left: 4px solid {accent_color}; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Feedback from Hiring Team</p>
                <p style="margin: 0; font-style: italic; color: #334155; line-height: 1.6;">"{feedback}"</p>
            </div>
            """
            
        email_content += "<p>We wish you the very best in your job search.</p>"
        cta_text = "Browse Other Jobs"
        cta_link = "http://localhost:3000/jobs"

    # --- SHARED HTML WRAPPER ---
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <tr><td style="height: 6px; background-color: {accent_color};"></td></tr>
                        
                        <tr><td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                            <h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">{company_name}</h2>
                            <p style="margin: 8px 0 0; color: {accent_color}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{headline}</p>
                        </td></tr>
                        
                        <tr><td style="padding: 40px; color: #334155; font-size: 16px; line-height: 1.6;">
                            {email_content}
                            
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{cta_link}" style="display: inline-block; background-color: {accent_color}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">{cta_text}</a>
                            </div>
                        </td></tr>
                        
                        <tr><td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">{hr_name}</p>
                            <p style="margin: 0; color: #64748b; font-size: 14px;">Talent Acquisition Team</p>
                        </td></tr>
                        
                        <tr><td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                &copy; {current_year} {company_name} via TruthHire.
                            </p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = MIMEMultipart('alternative')
    msg['From'] = f"{company_name} <{sender_email}>"
    msg['To'] = candidate_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Candidate update email sent to {candidate_email} ({status})")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def get_email_template(title, content, preheader=""):
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
            table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
            img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
            @media screen and (max-width: 600px) {{
                .email-container {{ width: 100% !important; }}
                .mobile-padding {{ padding-left: 20px !important; padding-right: 20px !important; }}
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
        <div style="display: none; font-size: 1px; color: #f7f9fc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">{preheader}</div>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f9fc; padding: 40px 0;">
            <tr><td align="center">
                    <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eaecf0;">
                        <tr><td align="center" style="padding: 40px 0 30px 0; border-bottom: 1px solid #f0f2f5;">
                                <a href="http://localhost:3000" style="text-decoration: none;">
                                    <span style="font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">TruthHire<span style="color: #2563eb;">.</span></span>
                                </a>
                            </td></tr>
                        <tr><td class="mobile-padding" style="padding: 40px 50px;">{content}</td></tr>
                        <tr><td style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #f0f2f5; text-align: center;">
                                <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">TruthHire Inc.</p>
                                <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af; line-height: 1.5;">Hinjewadi Phase 1, Pune, MH, India.<br>Connecting Verified Talent with Verified Jobs.</p>
                                <div style="margin-top: 15px;">
                                    <a href="#" style="color: #2563eb; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
                                    <a href="#" style="color: #2563eb; text-decoration: none; font-size: 12px; margin: 0 10px;">Support</a>
                                </div>
                            </td></tr>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr><td align="center" style="padding-top: 20px;"><p style="font-size: 12px; color: #9ca3af;">Sent with ❤️ to verify your career journey.</p></td></tr>
                    </table>
                </td></tr>
        </table>
    </body>
    </html>
    """

def send_welcome_email(email: str, name: str):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    content_html = f"""
    <p>Hi {name},</p>
    <p>Your account has been successfully created. You now have access to India's first AI-powered platform designed to eliminate ghost jobs.</p>
    
    <div class="info-box">
        <p style="margin: 0 0 12px; font-weight: 600; color: #1f2937;">Your Next Steps:</p>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Complete your profile to rank higher.</li>
            <li style="margin-bottom: 8px;">Upload your resume for AI gap analysis.</li>
            <li>Apply to "Verified" jobs with one click.</li>
        </ol>
    </div>
    
    <p>"The best way to predict the future is to create it." Let's get you hired.</p>
    """

    final_html = get_base_email_template(f"Welcome, {name}! 🎉", content_html, "Log In to Dashboard", "http://localhost:3000/login")

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Team <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = "Welcome to the TruthHire Community"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error: {e}")

def send_otp_email(email: str, otp: str, name: str = "User"):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    content_html = f"""
    <p>Hi {name},</p>
    <p>You requested to sign in to your TruthHire account. Use the verification code below to complete your login:</p>
    
    <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">{otp}</p>
        </div>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">⚠️ Security Notice</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #b45309;">This code expires in 5 minutes. Never share this code with anyone.</p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">If you didn't request this code, please ignore this email or contact our support team.</p>
    """

    final_html = get_base_email_template("Your Login Code", content_html)

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Security <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = f"Your TruthHire Login Code: {otp}"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ OTP sent to {email}")
    except Exception as e:
        print(f"❌ Failed to send OTP: {e}")

def send_recruiter_otp_email(email: str, otp: str, name: str = "Recruiter"):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    headline = "Verify Your Corporate Account"
    
    content_html = f"""
    <p>Hi {name},</p>
    <p>You are setting up a recruiter account on <strong>TruthHire</strong>. To verify your corporate identity, please use the code below.</p>
    
    <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 20px 40px; border-radius: 8px;">
            <p style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 6px; font-family: monospace;">{otp}</p>
        </div>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1e40af;">🛡️ Security Check</p>
        <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
            We use this step to ensure only verified employees from <strong>{email.split('@')[1]}</strong> can post jobs on TruthHire.
        </p>
    </div>
    
    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
        If you didn't request this code, please ignore this email. This code expires in 5 minutes.
    </p>
    """

    final_html = get_base_email_template(headline, content_html)

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Verification <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = f"{otp} is your verification code"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Recruiter OTP sent to {email}")
    except Exception as e:
        print(f"❌ CRITICAL EMAIL ERROR (OTP): {e}") # Check your terminal for this error

def send_login_success_email(email: str, name: str):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    content_html = f"""
    <p>Hi {name},</p>
    <p>Your account was successfully accessed. Welcome back to TruthHire!</p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600;">✓ Login Successful</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">Time: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">If this wasn't you, please secure your account immediately by changing your password.</p>
    """

    final_html = get_base_email_template("Login Successful", content_html, "Go to Dashboard", "http://localhost:3000/dashboard")

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Security <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = "Login Successful - TruthHire"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error: {e}")

def send_candidate_confirmation_email(candidate_email: str, candidate_name: str, job_title: str, company_name: str):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire <{sender_email}>"
    msg['To'] = candidate_email
    msg['Subject'] = f"Application sent: {job_title}"

    # Current Year for Footer
    year = datetime.now().year
    company_initial = company_name[0].upper() if company_name else "C"

    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #1f2937; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ padding: 24px; border-bottom: 1px solid #e5e7eb; text-align: left; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; text-decoration: none; }}
            .logo span {{ color: #2563eb; }}
            .content {{ padding: 40px 24px; }}
            .job-card {{ border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; background-color: #ffffff; display: flex; align-items: center; }}
            .company-logo {{ width: 48px; height: 48px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #6b7280; margin-right: 16px; }}
            .btn {{ display: inline-block; background-color: #2563eb; color: #111827; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 24px; }}
            .footer {{ background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
            .link {{ color: #2563eb; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="http://localhost:3000" class="logo">TruthHire<span>.</span></a>
            </div>

            <div class="content">
                <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">Application submitted!</h1>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Good news, {candidate_name}. Your application for <strong>{job_title}</strong> was successfully sent to the hiring team at <strong>{company_name}</strong>.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td style="padding: 20px; background-color: #ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="60" valign="middle">
                                        <div style="width: 48px; height: 48px; background-color: #f3f4f6; border-radius: 8px; color: #6b7280; font-size: 20px; font-weight: bold; line-height: 48px; text-align: center;">
                                            {company_initial}
                                        </div>
                                    </td>
                                    <td valign="middle">
                                        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #111827;">{job_title}</h3>
                                        <p style="margin: 0; font-size: 14px; color: #6b7280;">{company_name}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">
                                <span style="color: #10b981; font-weight: 600;">✓ Sent</span> via TruthHire Easy Apply
                            </p>
                        </td>
                    </tr>
                </table>

                <p style="margin: 0; font-size: 14px; color: #4b5563;">
                    We will notify you if the recruiter views your application or shortlists you. Good luck!
                </p>

                <div style="text-align: center;">
                    <a href="http://localhost:3000/jobs" class="btn">Browse Similar Jobs</a>
                </div>
            </div>

            <div class="footer">
                <p style="margin-bottom: 12px;">
                    &copy; {year} TruthHire Inc. &middot; Pune, Maharashtra, India
                </p>
                <p>
                    You received this email because you applied to a job on TruthHire.
                    <br>
                    <a href="#" class="link">Job Seeker Support</a> &middot; <a href="#" class="link">Privacy Policy</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")

def send_waitlist_confirmation_email(email: str, category: str, position: int):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    headline = f"You are #{position} on the list!"
    
    content_html = f"""
    <p>Hi there,</p>
    <p>Thanks for your interest in <strong>{category}</strong> jobs on TruthHire.</p>
    <p>You have been added to our priority waitlist. We are currently verifying top employers in this sector to ensure you only see legitimate, high-quality opportunities.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 24px; font-weight: 800; color: #166534;">#{position}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #15803d; font-weight: 600;">Your Priority Queue Position</p>
    </div>
    
    <p>We will notify you as soon as the first batch of verified jobs goes live.</p>
    """

    final_html = get_base_email_template(headline, content_html)

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Waitlist <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = f"You're #{position} on the list! ({category} Jobs)"
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Waitlist email sent to {email}")
    except Exception as e:
        print(f"❌ Failed to send waitlist email: {e}")
        

# ===========================
# 📧 UNIFIED EMAIL TEMPLATE SYSTEM
# ===========================

def get_base_email_template(headline, content_html, cta_text=None, cta_link=None):
    """
    Unified Design System based on the provided reference.
    Used by all email functions to ensure 100% consistency.
    """
    
    # CTA Button Logic
    cta_section = ""
    if cta_text and cta_link:
        cta_section = f"""
        <div style="text-align: center; margin-top: 32px;">
            <a href="{cta_link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                {cta_text}
            </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #1f2937; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ padding: 24px; border-bottom: 1px solid #e5e7eb; text-align: left; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; text-decoration: none; }}
            .logo span {{ color: #2563eb; }}
            .content {{ padding: 40px 24px; }}
            .footer {{ background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
            .link {{ color: #2563eb; text-decoration: none; }}
            h1 {{ margin: 0 0 16px; font-size: 24px; color: #111827; font-weight: 700; }}
            p {{ margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563; }}
            ul {{ margin: 0 0 24px; padding-left: 20px; }}
            li {{ margin-bottom: 8px; font-size: 15px; color: #4b5563; line-height: 1.5; }}
            .info-box {{ background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="http://localhost:3000" class="logo">TruthHire<span>.</span></a>
            </div>

            <div class="content">
                <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">{headline}</h1>
                
                {content_html}
                
                {cta_section}
            </div>

            <div class="footer">
                <p style="margin-bottom: 12px;">
                    &copy; {datetime.now().year} TruthHire Inc. &middot; Pune, Maharashtra, India
                </p>
                <p>
                    <a href="#" class="link">Support</a> &middot; <a href="#" class="link">Privacy Policy</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def send_recruiter_status_email(email: str, name: str, status: str):
    sender_email = "hrtruthhire@gmail.com"
    sender_password = os.getenv("MAIL_PASSWORD")
    
    subject = ""
    headline = ""
    content_html = ""
    cta_text = None
    cta_link = None

    if status == "pending":
        subject = "Action Required: Account Verification Pending"
        headline = "Verification in Progress ⏳"
        content_html = f"""
        <p>Hi {name},</p>
        <p>Thank you for joining TruthHire. Since you signed up using a public email domain (Gmail/Yahoo), your account has been placed in our <strong>Trust & Safety Queue</strong>.</p>
        
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #9a3412;">What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #7c2d12;">
                <li style="margin-bottom: 8px;">Our team will review your LinkedIn profile to verify your employment.</li>
                <li style="margin-bottom: 8px;">This process typically takes <strong>2-4 hours</strong> during business days.</li>
                <li>You will receive an email immediately once approved.</li>
            </ul>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">While you wait, you can still log in and draft job posts, but they will not go live until verified.</p>
        """
        cta_text = "Login to Dashboard"
        cta_link = "http://localhost:3000/recruiter/login"

    elif status == "verified":
        subject = "Welcome! Your Recruiter Account is Verified"
        headline = "You are Verified! ✅"
        content_html = f"""
        <p>Hi {name},</p>
        <p>Great news! Your identity has been verified. You now have full access to TruthHire's recruitment suite.</p>
        
        <div style="margin: 24px 0;">
            <p style="margin-bottom: 8px;"><strong>🚀 You can now:</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 6px;">Post unlimited "Verified" jobs.</li>
                <li style="margin-bottom: 6px;">Access candidate contact details.</li>
                <li>Use AI to rank applicants automatically.</li>
            </ul>
        </div>
        """
        cta_text = "Post Your First Job"
        cta_link = "http://localhost:3000/recruiter/dashboard"

    elif status == "rejected":
        subject = "Update on your TruthHire Account"
        headline = "Verification Unsuccessful"
        content_html = f"""
        <p>Hi {name},</p>
        <p>We verified your profile but could not confirm your employment details based on the information provided.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #991b1b;">Why?</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #b91c1c;">
                We require a LinkedIn profile that clearly matches the company name used during signup to prevent fraud.
            </p>
        </div>
        
        <p>If you believe this is a mistake, please reply to this email with your official ID card or an offer letter.</p>
        """

    final_html = get_base_email_template(headline, content_html, cta_text, cta_link)

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TruthHire Team <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = subject
    msg.attach(MIMEText(final_html, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Status email sent to {email}")
    except Exception as e:
        print(f"❌ CRITICAL EMAIL ERROR (Status): {e}")

class FeedbackRequest(BaseModel):
    job_id: str
    resume_text: str
    job_desc: str
    ai_response: dict
    rating: str  # 'up' or 'down'
    tags: Optional[List[str]] = []

@app.post("/feedback/ai-analysis")
def submit_ai_feedback(
    data: FeedbackRequest, 
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_feedback = AIFeedback(
        user_id=user_id,
        job_id=data.job_id,
        resume_text_snapshot=data.resume_text,
        job_desc_snapshot=data.job_desc,
        ai_response_snapshot=data.ai_response,
        rating=data.rating,
        feedback_tags=",".join(data.tags) if data.tags else ""
    )
    
    db.add(new_feedback)
    db.commit()
    
    return {"message": "Feedback recorded. Thank you for making TruthHire smarter!"}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        if role == "student":
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        elif role == "recruiter":
            recruiter = db.query(Recruiter).filter(Recruiter.id == int(user_id)).first()
            if not recruiter:
                raise HTTPException(status_code=401, detail="Recruiter not found")
            return recruiter
        else:
            raise HTTPException(status_code=401, detail="Invalid role")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
# --- CUSTOM RECRUITER DEPENDENCY ---
def get_current_recruiter_custom(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        # Verify JWT Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        recruiter_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if role != "recruiter" or not recruiter_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        recruiter = db.query(Recruiter).filter(Recruiter.id == int(recruiter_id)).first()
        if not recruiter:
            raise HTTPException(status_code=401, detail="Recruiter account not found")
            
        return recruiter
        
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
class RecruiterLogin(BaseModel):
    email: str
    password: str

@app.post("/recruiters/login")
def login_recruiter(data: RecruiterLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Find Recruiter by Email
    recruiter = db.query(Recruiter).filter(Recruiter.official_email == data.email).first()
    
    # 2. Validate Password
    if not recruiter:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if not bcrypt.checkpw(data.password.encode('utf-8'), recruiter.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # 3. Check Verification Status
    if recruiter.verification_status == "rejected":
        raise HTTPException(status_code=403, detail="Your account has been suspended.")
    
    # 4. Block login if account is pending verification
    if recruiter.verification_status == "pending":
        raise HTTPException(
            status_code=403, 
            detail="Your account is pending verification. Please check your email for updates."
        )

    # 5. Check if official domain - require OTP
    email_clean = data.email.strip().lower()
    domain = email_clean.split('@')[1]
    
    public_domains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'icloud.com', 'rediffmail.com', 'protonmail.com',
        'gamil.com', 'yaho.com'
    ]
    
    if domain not in public_domains:
        # Official domain - send OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        OTP_STORE[email_clean] = {
            'otp': otp,
            'expires_at': datetime.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
            'recruiter_id': recruiter.id,
            'name': recruiter.name,
            'company_name': recruiter.company_name,
            'is_verified': recruiter.is_verified,
            'type': 'recruiter_login'
        }
        
        background_tasks.add_task(send_recruiter_otp_email, email_clean, otp, recruiter.name)
        
        return {
            "message": "OTP sent to your email",
            "email": email_clean,
            "requires_otp": True
        }

    # 6. Generate Custom JWT Token (for public domain verified accounts)
    access_token = create_access_token(data={"sub": str(recruiter.id), "role": "recruiter"})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "recruiter_id": recruiter.id,
        "name": recruiter.name,
        "company_name": recruiter.company_name,
        "is_verified": recruiter.is_verified
    }


@app.get("/recruiters/me")
def get_current_recruiter(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        recruiter_id = payload.get("sub")
        role = payload.get("role")
        
        if role != "recruiter" or not recruiter_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        recruiter = db.query(Recruiter).filter(Recruiter.id == int(recruiter_id)).first()
        if not recruiter:
            raise HTTPException(status_code=401, detail="Recruiter not found")
            
        return {
            "id": recruiter.id,
            "name": recruiter.name,
            "company_name": recruiter.company_name,
            "email": recruiter.official_email,
            "verification_status": recruiter.verification_status,
            "is_verified": recruiter.is_verified
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/candidate/me")
def get_current_candidate(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if role != "student" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Fetch related data
        projects = db.query(Project).filter(Project.user_id == user.id).all()

        # --- 🆕 FETCH SKILL GAPS (Top 5) ---
        skill_gaps = db.query(SkillGap).filter(SkillGap.user_id == user.id)\
            .order_by(SkillGap.frequency.desc()).limit(5).all()
        # -----------------------------------
        
        # Build resume URL
        resume_url = None
        if user.resume_filename:
            resume_url = f"http://localhost:8000/static/resumes/{user.resume_filename}"
            
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "location": user.location,
            "headline": user.headline,
            "bio": user.bio,
            "github_url": user.github_url,
            "linkedin_url": user.linkedin_url,
            "portfolio_url": user.portfolio_url,
            "skills": user.skills,
            "education": user.education,
            "experiences": user.experiences,
            "total_experience": user.total_experience,
            "current_salary": user.current_salary,
            "expected_salary": user.expected_salary,
            "notice_period": user.notice_period,
            "resume_filename": user.resume_filename,
            "resume_url": resume_url,
            "resume_text": user.resume_text,
            "profile_image": getattr(user, 'profile_image', None),
            
            # --- 🆕 RETURN SKILL GAPS ---
            "skill_gaps": [{"skill_name": s.skill_name, "frequency": s.frequency} for s in skill_gaps],
            
            "projects": [{"id": p.id, "title": p.title, "description": p.description, "tech_stack": p.tech_stack, "live_link": p.live_link, "github_link": p.github_link} for p in projects]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/candidate/applications")
def get_my_applications(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if role != "student" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = int(user_id)
        
        job_apps = db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
        results = []
        
        for app in job_apps:
            job_data = {
                "id": "0", 
                "title": "Unknown Job", 
                "company": "Unknown", 
                "location": "Remote", 
                "salary": "Not disclosed"
            }
            
            r_job = db.query(Job).filter(Job.id == app.job_id).first()
            if r_job:
                salary = None
                if r_job.salary_min and r_job.salary_max:
                    salary = f"{r_job.currency} {r_job.salary_min:,} - {r_job.salary_max:,}"
                elif r_job.salary_min:
                    salary = f"{r_job.currency} {r_job.salary_min:,}"
                
                job_data = {
                    "id": str(r_job.id), 
                    "title": r_job.title, 
                    "company": r_job.company_name,
                    "location": r_job.location,
                    "salary": salary or "Salary not disclosed"
                }

            results.append({
                "id": app.id,
                "status": app.status,
                "match_score": app.match_score,
                "applied_at": str(app.applied_at),
                "interview_attempts": app.interview_attempts or 0,
                "job": job_data
            })
            
        return sorted(results, key=lambda x: x['applied_at'], reverse=True)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Error fetching apps: {e}")
        raise HTTPException(status_code=500, detail="Server Error")
    
class RecruiterRegister(BaseModel):
    name: str
    company_name: str
    official_email: str
    password: str
    linkedin_url: Optional[str] = None

class VerificationUpdate(BaseModel):
    status: str


# ==========================================
# 📧 DAILY JOB ALERT SYSTEM (Glassdoor Style)
# ==========================================

def generate_daily_jobs_email(user_name, jobs):
    """
    Generates a LinkedIn/Indeed-style Professional Job Alert Email.
    Features: Card layout, Skill badges, clear CTAs, and responsive design.
    """
    job_cards_html = ""
    
    for job in jobs:
        # Data Preparation
        title = job.get('title')
        company = job.get('company')
        location = job.get('location')
        salary = job.get('salary', 'Not disclosed')
        job_id = job.get('id')
        
        # Skill Badges (Max 3)
        skills_raw = job.get('skills', '').split(',')
        skill_badges = ""
        for s in skills_raw[:3]:
            if s.strip():
                skill_badges += f'<span style="display:inline-block; background-color:#f0f9ff; color:#0369a1; font-size:11px; padding:3px 8px; border-radius:4px; margin-right:5px; border:1px solid #bae6fd;">{s.strip().title()}</span>'
        
        # Links
        apply_link = f"http://localhost:3000/jobs/{job_id}" 
        company_initial = company[0].upper() if company else "C"

        job_cards_html += f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:16px; border-collapse:separate;">
            <tr>
                <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="50" valign="top" style="padding-right:15px;">
                                <div style="width:40px; height:40px; background-color:#f3f4f6; border-radius:6px; color:#6b7280; font-size:18px; font-weight:bold; line-height:40px; text-align:center;">
                                    {company_initial}
                                </div>
                            </td>
                            <td valign="top">
                                <h3 style="margin:0 0 4px 0; font-size:16px; font-weight:600; line-height:1.3;">
                                    <a href="{apply_link}" style="color:#2563eb; text-decoration:none;">{title}</a>
                                </h3>
                                <p style="margin:0 0 8px 0; font-size:13px; color:#374151;">
                                    <strong>{company}</strong> &bull; <span style="color:#6b7280;">{location}</span>
                                </p>
                                
                                <div style="margin-bottom:12px;">
                                    <span style="display:inline-block; font-size:12px; color:#4b5563; background-color:#f9fafb; padding:2px 6px; border-radius:4px; border:1px solid #e5e7eb; margin-right:5px;">
                                        💰 {salary}
                                    </span>
                                </div>
                                <div style="margin-bottom:15px;">
                                    {skill_badges}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding-top:10px; border-top:1px dashed #e5e7eb; text-align:right;">
                                <a href="{apply_link}" style="display:inline-block; background-color:#2563eb; color:#ffffff; font-size:13px; font-weight:600; padding:8px 20px; border-radius:4px; text-decoration:none;">View Job</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        """

    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Job Alerts</title>
        <style type="text/css">
            body {{ margin: 0; padding: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; }}
            a {{ color: #2563eb; text-decoration: none; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ text-align: center; padding: 20px 0; }}
            .footer {{ text-align: center; padding: 20px 0; font-size: 12px; color: #9ca3af; }}
            .btn-primary {{ background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; }}
        </style>
    </head>
    <body style="background-color: #f3f4f6;">
        <div class="container">
            
            <div class="header">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <span style="font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">TruthHire<span style="color: #2563eb;">.</span></span>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; text-align: center;">
                <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">Jobs for you, {user_name}</h2>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    We found <strong>{len(jobs)} new jobs</strong> matching your preferences based on your profile and activity.
                </p>
            </div>

            {job_cards_html}

            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/jobs" style="background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                    See all matching jobs
                </a>
            </div>

            <div class="footer">
                <p style="margin-bottom: 10px;">
                    <strong>Why am I getting this?</strong><br>
                    You have job alerts enabled for your profile on TruthHire.
                </p>
                <p>
                    <a href="#" style="color: #6b7280; text-decoration: underline;">Update Preferences</a> &bull; 
                    <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                </p>
                <p style="margin-top: 20px;">&copy; 2026 TruthHire Inc. Pune, India.</p>
            </div>

        </div>
    </body>
    </html>
    """
    return html_body

async def send_email_async(smtp_client, recipient, subject, html_content):
    message = MIMEText(html_content, 'html')
    message['From'] = f"TruthHire Job Alerts <{os.getenv('MAIL_USER')}>"
    message['To'] = recipient
    message['Subject'] = subject

    try:
        await smtp_client.send_message(message)
        return True
    except Exception as e:
        print(f"❌ Failed to send to {recipient}: {e}")
        return False
    
# Daily job alerts disabled - enable only when needed

# ===========================
# 🚀 API ENDPOINTS
# ===========================

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = ""
        
        if file.filename.lower().endswith('.pdf'):
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text(x_tolerance=2) 
                        if extracted: text += extracted + "\n"
            except Exception:
                pass
            
            if len(text.strip()) < 50:
                try:
                    import pypdf
                    pdf = pypdf.PdfReader(io.BytesIO(content))
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted: text += extracted + "\n"
                except ImportError:
                    print("⚠️ Install pypdf: pip install pypdf")
                except Exception:
                    pass
        else:
            text = content.decode('utf-8', errors='ignore')

        text = " ".join(text.split()) 
        return {"text": text[:15000]}
    except Exception as e:
        return {"error": str(e), "text": ""}

class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str
    job_id: Optional[str] = "unknown" # New Field to track unique jobs
    user_id: Optional[str] = "anon"   # New Field to track unique candidates

@app.post("/analyze-gap")
async def analyze_gap(
    request: AnalyzeRequest, 
    db: Session = Depends(get_db) # <--- Added DB connection for rate limiting
):
    # 1. --- RATE LIMITING (Simple Safety) ---
    # Prevents a single user from spamming the AI and increasing costs
    if request.user_id and request.user_id != "anon":
        try:
            # Check usage: We use 'JobApplication' count as a proxy for daily activity
            # to avoid creating new database tables right now.
            usage_count = db.query(JobApplication).filter(
                JobApplication.user_id == int(request.user_id),
                JobApplication.applied_at >= datetime.utcnow() - timedelta(days=1)
            ).count()

            # Limit to 20 actions per day (Generous for a human)
            if usage_count > 20: 
                raise HTTPException(
                    status_code=429, 
                    detail="Daily limit reached. To ensure fair usage, please try again tomorrow."
                )
        except ValueError:
            pass # Ignore if user_id is not a valid number

    # 2. --- RUN AI ANALYSIS ---
    analysis = get_ai_gap_analysis(
        request.resume_text, 
        request.job_description, 
        candidate_id=request.user_id, 
        job_id=request.job_id
    )
    
    match_score = int(analysis.get("score", 40))
    match_score = max(15, min(95, match_score))

    return {
        "match_score": match_score,
        "is_eligible": match_score > 60,
        "matched_skills": analysis.get("matched_skills", []),
        "missing_skills": analysis.get("missing_skills", []),
        "coach_message": analysis.get("coach_message", "Update your resume.")
    }

    
class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class OTPVerify(BaseModel):
    email: str
    otp: str

@app.post("/users/signup")
def signup_user(data: UserSignup, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    OTP_STORE[data.email] = {
        'otp': otp,
        'expires_at': datetime.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
        'name': data.name,
        'password_hash': password_hash,
        'type': 'signup'
    }
    
    # Send OTP email
    background_tasks.add_task(send_otp_email, data.email, otp, data.name)
    
    return {
        "message": "OTP sent to your email",
        "email": data.email,
        "requires_otp": True
    }

@app.post("/users/verify-signup-otp")
def verify_signup_otp(data: OTPVerify, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if data.email not in OTP_STORE:
        raise HTTPException(status_code=400, detail="OTP expired or invalid")
    
    stored = OTP_STORE[data.email]
    
    if stored.get('type') != 'signup':
        raise HTTPException(status_code=400, detail="Invalid OTP type")
    
    if datetime.now() > stored['expires_at']:
        del OTP_STORE[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user
    new_user = User(
        name=stored['name'],
        email=data.email,
        password_hash=stored['password_hash']
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(new_user.id), "role": "student"})
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, data.email, stored['name'])
    
    # Clean up OTP
    del OTP_STORE[data.email]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }

@app.post("/users/login")
def login_user(data: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not bcrypt.checkpw(data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Generate OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    OTP_STORE[data.email] = {
        'otp': otp,
        'expires_at': datetime.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
        'user_id': user.id,
        'name': user.name
    }
    
    # Send OTP email
    background_tasks.add_task(send_otp_email, data.email, otp, user.name)
    
    return {
        "message": "OTP sent to your email",
        "email": data.email,
        "requires_otp": True
    }

class OTPVerify(BaseModel):
    email: str
    otp: str

@app.post("/users/verify-otp")
def verify_otp(data: OTPVerify, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if data.email not in OTP_STORE:
        raise HTTPException(status_code=400, detail="OTP expired or invalid")
    
    stored = OTP_STORE[data.email]
    
    if datetime.now() > stored['expires_at']:
        del OTP_STORE[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # OTP verified, generate token
    access_token = create_access_token(data={"sub": str(stored['user_id']), "role": "student"})
    
    # Send success email
    background_tasks.add_task(send_login_success_email, data.email, stored['name'])
    
    # Clean up OTP
    del OTP_STORE[data.email]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": stored['user_id'],
        "name": stored['name'],
        "email": data.email
    }

@app.post("/recruiters/verify-signup-otp")
def verify_recruiter_signup_otp(data: OTPVerify, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Validate OTP
    if data.email not in OTP_STORE:
        raise HTTPException(status_code=400, detail="OTP expired or invalid")
    
    stored = OTP_STORE[data.email]
    
    if stored.get('type') != 'recruiter_signup':
        raise HTTPException(status_code=400, detail="Invalid OTP type")
    
    if datetime.now() > stored['expires_at']:
        del OTP_STORE[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # 2. Determine Account Status based on Domain
    if stored.get('is_public_domain'):
        # Public Email -> Verified Email ✅ but Pending Account ⏳
        verification_status = "pending"
        is_verified = False
        email_action = "pending" # Send "Pending Review" email
        
        # Send Alert to Admin
        background_tasks.add_task(send_admin_recruiter_alert, stored['name'], data.email, stored.get('linkedin_url'))
    else:
        # Corporate Email -> Fully Verified ✅
        verification_status = "verified"
        is_verified = True
        email_action = "verified" # Send "Welcome" email
    
    # 3. Create Account
    recruiter = Recruiter(
        name=stored['name'],
        company_name=stored['company_name'],
        official_email=data.email,
        password_hash=stored['password_hash'],
        is_verified=is_verified,
        verification_status=verification_status,
        linkedin_url=stored.get('linkedin_url')
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    
    # 4. Generate Token
    access_token = create_access_token(data={"sub": str(recruiter.id), "role": "recruiter"})
    
    # 5. Send Status Email
    background_tasks.add_task(send_recruiter_status_email, data.email, stored['name'], email_action)
    
    # Clean up OTP
    del OTP_STORE[data.email]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "recruiter_id": recruiter.id,
        "name": recruiter.name,
        "company_name": recruiter.company_name,
        "is_verified": recruiter.is_verified,
        "status": recruiter.verification_status # Send status to frontend
    }

@app.post("/recruiters/verify-login-otp")
def verify_recruiter_login_otp(data: OTPVerify, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if data.email not in OTP_STORE:
        raise HTTPException(status_code=400, detail="OTP expired or invalid")
    
    stored = OTP_STORE[data.email]
    
    if stored.get('type') != 'recruiter_login':
        raise HTTPException(status_code=400, detail="Invalid OTP type")
    
    if datetime.now() > stored['expires_at']:
        del OTP_STORE[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Generate token
    access_token = create_access_token(data={"sub": str(stored['recruiter_id']), "role": "recruiter"})
    
    # Clean up OTP
    del OTP_STORE[data.email]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "recruiter_id": stored['recruiter_id'],
        "name": stored['name'],
        "company_name": stored['company_name'],
        "is_verified": stored['is_verified']
    }


# UPDATE THE MAIN @app.get("/jobs") FUNCTION
from sqlalchemy import or_ # <--- MAKE SURE TO ADD THIS IMPORT AT THE TOP

# ... (rest of your imports)
@app.get("/jobs")
def get_jobs(
    limit: int = 30,
    skip: int = 0,
    q: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Unified Query on 'Job' table
    query = db.query(Job).filter(Job.status == 'active')

    # 2. Search Filter
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Job.title.ilike(search),
                Job.company_name.ilike(search),
                Job.description.ilike(search)
            )
        )

    # 3. Department Filter
    if department:
        query = query.filter(Job.title.ilike(f"%{department}%"))

    # 4. Execute
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    # 5. Format
    results = []
    for job in jobs:
        results.append({
            "id": str(job.id),
            "title": job.title,
            "company_name": job.company_name,
            "description": job.description,
            "location": job.location,
            "location_type": job.location_type,
            "employment_type": job.employment_type,
            "is_verified": job.is_verified,
            "trust_score": job.trust_score,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "salary_frequency": job.salary_frequency,
            "equity": job.equity,
            "experience_level": job.experience_level,
            "skills_required": job.skills_required,
            "created_at": str(job.created_at) if job.created_at else "",
            "source": "Recruiter" if job.recruiter_id else "Admin"
        })
    
    return results

@app.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # 1. Fetch Recruiter Details (If it's a recruiter job)
    recruiter_name = "TruthHire Team"
    company_website = None
    
    if job.recruiter_id:
        recruiter = db.query(Recruiter).filter(Recruiter.id == job.recruiter_id).first()
        if recruiter:
            recruiter_name = recruiter.name
            company_website = getattr(recruiter, "company_website", None)

    # 2. Activity Status
    activity_status = "Active"
    if job.status == 'active' and job.created_at:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if (now - job.created_at).days > 14:
            interaction_count = db.query(JobApplication).filter(
                JobApplication.job_id == job.id, 
                JobApplication.status != 'applied'
            ).count()
            if interaction_count == 0:
                activity_status = "Inactive"
            else:
                activity_status = "Hiring Actively"

    # 3. Track View
    job.views = (job.views or 0) + 1
    db.commit()

    return {
        "id": str(job.id),
        "title": job.title,
        "company_name": job.company_name,
        "description": job.description,
        "location": job.location,
        "location_type": job.location_type,
        "employment_type": job.employment_type,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "salary_frequency": job.salary_frequency,
        "equity": job.equity,
        "experience_level": job.experience_level,
        "skills_required": job.skills_required,
        "created_at": job.created_at,
        "trust_score": job.trust_score,
        "views": job.views,
        "is_verified": job.is_verified,
        "apply_link": job.apply_link,
        
        "recruiter_name": recruiter_name,
        "company_website": company_website,
        "activity_status": activity_status,
        "source": "Recruiter" if job.recruiter_id else "Admin"
    }



@app.post("/jobs/{job_id}/view")
def record_job_view(job_id: str, db: Session = Depends(get_db)):
    try:
        job = db.query(Job).filter(Job.id == int(job_id)).first()
        if job:
            job.views = (job.views or 0) + 1
            db.commit()
            return {"message": "View counted", "total_views": job.views}
    except Exception:
        pass
    return {"message": "View ignored"}
        

@app.get("/jobs/{job_id}/check-applied")
def check_if_applied(
    job_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if role != "student" or not user_id: return {"has_applied": False}
            
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user: return {"has_applied": False}
            
        existing = db.query(JobApplication).filter(
            JobApplication.job_id == job_id,
            JobApplication.user_id == user.id
        ).first()
        
        return {"has_applied": existing is not None}
    except jwt.JWTError:
        return {"has_applied": False}

class ApplyToJob(BaseModel):
    job_id: int
    cover_note: str = None

@app.post("/jobs/apply")
async def apply_to_job(
    data: ApplyToJob,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if role != "student" or not user_id: raise HTTPException(403, "Only candidates can apply")
        student = db.query(User).filter(User.id == int(user_id)).first()
        if not student: raise HTTPException(404, "User not found")
    except: raise HTTPException(401, "Invalid token")

    job = db.query(Job).filter(Job.id == data.job_id).first()
    if not job: raise HTTPException(404, "Job not found")

    existing = db.query(JobApplication).filter(JobApplication.job_id == job.id, JobApplication.user_id == student.id).first()
    if existing: raise HTTPException(400, "Already applied")

    # 1. Run AI Analysis
    analysis = get_ai_gap_analysis(student.resume_text or "", job.description, candidate_id=str(student.id), job_id=str(job.id))
    match_score = int(analysis.get("score", 40))

    # 2. Save Skill Gaps
    missing_skills = analysis.get("missing_skills", [])
    
    for skill in missing_skills:
        skill_clean = skill.strip().title()[:50] 
        if len(skill_clean) > 2: 
            gap = db.query(SkillGap).filter(SkillGap.user_id == student.id, SkillGap.skill_name == skill_clean).first()
            if gap:
                gap.frequency += 1
                gap.last_seen = datetime.now() 
            else:
                new_gap = SkillGap(user_id=student.id, skill_name=skill_clean, frequency=1)
                db.add(new_gap)
    
    # 3. Create Application
    new_app = JobApplication(
        job_id=job.id,
        user_id=student.id,
        applicant_name=student.name,
        applicant_email=student.email,
        resume_text=student.resume_text,
        status="applied",
        match_score=match_score
    )
    db.add(new_app)
    
    # 4. Commit & Refresh
    db.commit()
    db.refresh(new_app) 

    # 5. Update Average Score
    all_apps = db.query(JobApplication).filter(JobApplication.user_id == student.id).all()
    if all_apps:
        total = sum([a.match_score for a in all_apps if a.match_score])
        student.avg_match_score = round(total / len(all_apps), 1)
        db.commit()
    
    # 6. Emails (Strategy B: Smart Routing)
    recruiter_email = None
    
    if job.recruiter_id:
        # Case A: Recruiter Posted Job
        rec = db.query(Recruiter).filter(Recruiter.id == job.recruiter_id).first()
        if rec: recruiter_email = rec.official_email
    else:
        # Case B: Admin Posted Job (Check apply_link or fallback)
        if job.apply_link and "@" in job.apply_link and not job.apply_link.startswith("http"):
            recruiter_email = job.apply_link.replace("mailto:", "").strip()
        else:
            recruiter_email = os.getenv("ADMIN_EMAIL", "hrtruthhire@gmail.com")
    
    # 🟢 FIX: Construct Resume Path
    resume_path = None
    if student.resume_filename:
        # Assumes resumes are stored in 'static/resumes/' folder
        resume_path = f"static/resumes/{student.resume_filename}"

    if recruiter_email:
        candidate_data = {
            'name': student.name, 'email': student.email, 'score': match_score,
            'matched': analysis.get('matched_skills', []), 'missing': analysis.get('missing_skills', [])
        }
        
        background_tasks.add_task(
            send_application_email, 
            recruiter_email, 
            job.title, 
            candidate_data, 
            data.cover_note or "",
            resume_path,  # <--- 🟢 PASSED HERE (Was missing before)
            False,        # is_cold_outreach
            new_app.id    # app_id
        )
    
    # Confirmation to Student
    background_tasks.add_task(send_candidate_confirmation_email, student.email, student.name, job.title, job.company_name)
    
    return {"message": "Applied successfully", "match_score": match_score}

# ==========================================
# 💾 SAVED JOBS ENDPOINTS (NEW)
# ==========================================

@app.post("/jobs/{job_id}/save")
def save_job(job_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        role = payload.get("role")
        if role != "student": raise HTTPException(403, "Only students can save jobs")
    except:
        raise HTTPException(401, "Invalid token")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: raise HTTPException(404, "Job not found")

    existing = db.query(SavedJob).filter(SavedJob.user_id == user_id, SavedJob.job_id == job_id).first()
    if existing:
        return {"message": "Job already saved"}

    new_save = SavedJob(user_id=user_id, job_id=job_id)
    db.add(new_save)
    db.commit()
    return {"message": "Job saved"}

@app.delete("/jobs/{job_id}/unsave")
def unsave_job(job_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(401, "Invalid token")

    saved = db.query(SavedJob).filter(SavedJob.user_id == user_id, SavedJob.job_id == job_id).first()
    if saved:
        db.delete(saved)
        db.commit()
    return {"message": "Job removed from saved"}

@app.get("/users/me/saved-ids")
def get_saved_job_ids(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(401, "Invalid token")
    
    # Return list of IDs only for quick frontend check
    saved_jobs = db.query(SavedJob.job_id).filter(SavedJob.user_id == user_id).all()
    return [s[0] for s in saved_jobs]

    
class UserUpdate(BaseModel):
    name: str = None
    phone: str = None
    location: str = None

@app.get("/users/{user_id}/dashboard")
def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. OPTIMIZED: Fetch Applications + Job Details in ONE query
    recent_apps = db.query(JobApplication)\
        .options(joinedload(JobApplication.job))\
        .filter(JobApplication.user_id == user_id)\
        .order_by(JobApplication.applied_at.desc())\
        .limit(5)\
        .all()

    formatted_apps = []
    for app in recent_apps:
        # No more DB queries inside this loop! Data is already loaded.
        job_data = {
            "id": 0, "title": "Unknown", "company": "Unknown", 
            "location": "Remote", "salary": "Not Disclosed"
        }
        
        if app.job:
            job_data = {
                "id": app.job.id,
                "title": app.job.title,
                "company": app.job.company_name,
                "location": app.job.location,
                "salary": "Not Disclosed" # Formatting logic can be added here if needed
            }
        
        formatted_apps.append({
            "id": app.id,
            "status": app.status,
            "match_score": app.match_score,
            "applied_at": str(app.applied_at),
            "job": job_data
        })

    # 2. OPTIMIZED: Fetch Saved Jobs + Job Details in ONE query
    saved = db.query(SavedJob)\
        .options(joinedload(SavedJob.job))\
        .filter(SavedJob.user_id == user_id)\
        .all()

    formatted_saved = []
    for s in saved:
        if s.job:
            formatted_saved.append({
                "id": s.id,
                "saved_at": str(s.saved_at),
                "job": {
                    "id": s.job.id,
                    "title": s.job.title,
                    "company": s.job.company_name,
                    "location": s.job.location,
                    "salary": None
                }
            })

    # 3. Fetch Skill Gaps (Already optimized)
    skill_gaps = db.query(SkillGap)\
        .filter(SkillGap.user_id == user_id)\
        .order_by(SkillGap.frequency.desc())\
        .limit(10)\
        .all()

    return {
        "applications": formatted_apps,
        "saved_jobs": formatted_saved,
        "skill_gaps": [{"skill_name": sg.skill_name, "frequency": sg.frequency} for sg in skill_gaps],
        "avg_match_score": user.avg_match_score or 0
    }

@app.get("/users/{user_id}/resume-text")
def get_resume_text(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.resume_text:
        raise HTTPException(status_code=404, detail="No resume text available")
    return {"text": user.resume_text}

@app.get("/users/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    applications = db.query(Application).filter(Application.user_id == user_id).order_by(Application.applied_at.desc()).all()
    job_applications = db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
    saved_jobs = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    achievements = db.query(Achievement).filter(Achievement.user_id == user_id).all()
    certifications = db.query(Certification).filter(Certification.user_id == user_id).all()
    skill_gaps = db.query(SkillGap).filter(SkillGap.user_id == user_id).order_by(SkillGap.frequency.desc()).limit(5).all()
    
    all_apps = list(applications) + list(job_applications)
    match_scores = [app.match_score for app in all_apps if hasattr(app, 'match_score') and app.match_score and app.match_score > 0]
    employability_score = round(sum(match_scores) / len(match_scores)) if match_scores else user.employability_score or 0
    
    resume_url = None
    if user.resume_filename:
        resume_url = f"http://localhost:8000/static/resumes/{user.resume_filename}"

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "location": user.location,
        "headline": user.headline,
        "college": user.college,
        "batch_year": user.batch_year,
        "degree": user.degree,
        "cgpa": user.cgpa,
        "is_student_verified": user.is_student_verified,
        "work_status": user.work_status,
        "bio": user.bio,
        "github_url": user.github_url,
        "linkedin_url": user.linkedin_url,
        "portfolio_url": user.portfolio_url,
        "skills": user.skills,
        "target_roles": user.target_roles,
        "preferred_locations": user.preferred_locations,
        
        "resume_text": user.resume_text,
        # -------------------------------------------------------

        "expected_salary": user.expected_salary,
        "total_experience": user.total_experience, 
        "current_salary": user.current_salary,
        "notice_period": user.notice_period,

        "employability_score": employability_score,
        "verified_jobs_applied": user.verified_jobs_applied or len([a for a in all_apps if hasattr(a, 'match_score')]),
        "scams_avoided": user.scams_avoided,
        "resume_filename": user.resume_filename,
        "resume_url": resume_url, 
        "resume_uploaded_at": user.resume_uploaded_at,
        "avg_match_score": user.avg_match_score,
        "applications": [{"id": a.id, "job_title": a.job_title, "company_name": a.company_name, "status": a.status, "match_score": a.match_score, "applied_at": a.applied_at} for a in applications],
        "saved_jobs_count": len(saved_jobs),
        "projects": [{"id": p.id, "title": p.title, "description": p.description, "tech_stack": p.tech_stack, "live_link": p.live_link, "github_link": p.github_link} for p in projects],
        "achievements": [{"id": a.id, "title": a.title, "description": a.description, "date": a.date} for a in achievements],
        "certifications": [{"id": c.id, "title": c.title, "issuer": c.issuer, "date": c.date, "credential_url": c.credential_url} for c in certifications],
        "skill_gaps": [{"skill_name": s.skill_name, "frequency": s.frequency} for s in skill_gaps],
        "education": user.education,
        "experiences": user.experiences
    }

class ProfileUpdate(BaseModel):
    name: str = None # <--- ADD THIS
    headline: str = None
    college: str = None
    batch_year: str = None
    degree: str = None
    cgpa: str = None
    work_status: str = None
    bio: str = None
    github_url: str = None
    linkedin_url: str = None
    portfolio_url: str = None
    skills: Union[str, List[str]] = None
    target_roles: Union[str, List[str]] = None
    preferred_locations: Union[str, List[str]] = None
    expected_salary: str = None
    phone: str = None
    location: str = None
    first_name: str = None
    last_name: str = None
    user_id: str = None
    education: Union[List[dict], dict, str] = None 
    experiences: Union[List[dict], str] = None
    summary: str = None
    total_experience: float = None
    current_salary: str = None
    notice_period: str = None
    class Config:
        extra = 'allow'
         
@app.put("/users/{user_id}/profile")
def update_full_profile(user_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # --- FIX: Handle Full Name Directly ---
    if data.name:
        user.name = data.name
    elif data.first_name and data.last_name:
        user.name = f"{data.first_name} {data.last_name}"
    elif data.first_name:
        user.name = data.first_name
        
    if data.headline is not None: user.headline = data.headline
    if data.location is not None: user.location = data.location
    if data.phone is not None: user.phone = data.phone
    if data.bio is not None: user.bio = data.bio 
    if data.expected_salary is not None: user.expected_salary = data.expected_salary
    if data.work_status is not None: user.work_status = data.work_status
    
    if data.linkedin_url is not None: user.linkedin_url = data.linkedin_url
    if data.portfolio_url is not None: user.portfolio_url = data.portfolio_url
    if data.github_url is not None: user.github_url = data.github_url
    if data.total_experience is not None: user.total_experience = data.total_experience
    if data.current_salary is not None: user.current_salary = data.current_salary
    if data.notice_period is not None: user.notice_period = data.notice_period
    if data.skills is not None:
        user.skills = json.dumps(data.skills) if isinstance(data.skills, list) else data.skills
    
    if data.education is not None:
        user.education = json.dumps(data.education)
        # Legacy support
        edu_entry = data.education
        if isinstance(edu_entry, list) and len(edu_entry) > 0:
            edu_entry = edu_entry[0]
        if isinstance(edu_entry, dict):
            if 'school' in edu_entry or 'college' in edu_entry: 
                user.college = edu_entry.get('school') or edu_entry.get('college')
            if 'degree' in edu_entry: 
                user.degree = edu_entry.get('degree')
            if 'year' in edu_entry or 'graduation_year' in edu_entry: 
                user.batch_year = str(edu_entry.get('year') or edu_entry.get('graduation_year'))
    
    if data.experiences is not None:
        user.experiences = json.dumps(data.experiences)
        
    db.commit()
    return {"message": "Profile updated successfully"}

class ProjectSchema(BaseModel):
    title: str
    description: str
    tech_stack: str = None
    live_link: str = None
    github_link: str = None

@app.post("/users/{user_id}/projects")
def add_project(user_id: int, data: ProjectSchema, db: Session = Depends(get_db)):
    proj = Project(user_id=user_id, **data.dict())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@app.put("/users/{user_id}/projects/{project_id}")
def update_project(user_id: int, project_id: int, data: ProjectSchema, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not proj: raise HTTPException(404, "Project not found")
    for k, v in data.dict().items():
        setattr(proj, k, v)
    db.commit()
    db.refresh(proj) # Refresh to get updated data
    return proj

@app.delete("/users/{user_id}/projects/{project_id}")
def delete_project(user_id: int, project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not proj: raise HTTPException(404, "Project not found")
    db.delete(proj)
    db.commit()
    return {"message": "Project deleted"}

@app.post("/users/{user_id}/resume")
async def upload_resume(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Verify User Exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Read File Content into Memory
    content = await file.read()
    
    # --- AI Text Extraction Logic (Unchanged) ---
    text = ""
    try:
        if file.filename.lower().endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text(x_tolerance=1)
                        if extracted: text += extracted + " "
            except: pass
            
            # Fallback
            if len(text) < 50:
                try:
                    import pypdf
                    pdf = pypdf.PdfReader(io.BytesIO(content))
                    for page in pdf.pages:
                        t = page.extract_text()
                        if t: text += t + " "
                except: pass
        else:
            text = content.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"AI Extraction Warning: {e}")
    # --------------------------------------------

    # 3. UPLOAD TO SUPABASE (Replaces local save)
    try:
        # Create a unique filename: resumes/user_123_random.pdf
        # We add random numbers to avoid caching issues when updating resumes
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"user_{user_id}_{random.randint(1000, 9999)}.{file_extension}"
        
        # Upload using the Supabase Client
        # Note: We upload 'content' (bytes) directly
        res = supabase.storage.from_("resumes").upload(
            path=unique_filename,
            file=content,
            file_options={"content-type": file.content_type}
        )

        # Get the Public URL
        public_url = supabase.storage.from_("resumes").get_public_url(unique_filename)

        # 4. Save to Database
        # Important: We now save the FULL URL, not just the filename
        user.resume_filename = public_url 
        user.resume_text = clean_text_for_ai(text)[:10000]
        user.resume_uploaded_at = datetime.now()
        db.commit()
        
        return {
            "message": "Resume uploaded successfully", 
            "filename": unique_filename,
            "url": public_url
        }

    except Exception as e:
        print(f"Supabase Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload resume to cloud storage")
    
# --- ADD THIS NEW ENDPOINT ---
@app.post("/users/{user_id}/profile-image")
async def upload_profile_image(
    user_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # 1. Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # 3. Create directory if not exists
        os.makedirs("static/profile_images", exist_ok=True)
        
        # 4. Generate unique filename (prevents caching issues)
        file_extension = file.filename.split(".")[-1]
        safe_filename = f"profile_{user_id}_{random.randint(1000, 9999)}.{file_extension}"
        file_path = f"static/profile_images/{safe_filename}"
        
        # 5. Save the file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 6. Update Database
        user.profile_image = safe_filename
        db.commit()
        
        return {"filename": safe_filename, "message": "Profile image updated"}

    except Exception as e:
        print(f"Image Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

class RecruiterRegister(BaseModel):
    name: str
    company_name: str
    official_email: str
    password: str
    linkedin_url: Optional[str] = None

class RecruiterLogin(BaseModel):
    email: str
    password: str

@app.post("/recruiters/register")
def register_recruiter(data: RecruiterRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Check if email exists
    existing = db.query(Recruiter).filter(Recruiter.official_email == data.official_email).first()
    if existing: 
        raise HTTPException(status_code=400, detail="Email already registered")
    
    email_clean = data.official_email.strip().lower()
    domain = email_clean.split('@')[1]
    
    public_domains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'icloud.com', 'rediffmail.com', 'protonmail.com',
        'gamil.com', 'yaho.com'
    ]
    
    is_public = domain in public_domains

    # 2. LinkedIn Requirement for Public Domains
    if is_public and (not data.linkedin_url or len(data.linkedin_url.strip()) < 10):
        raise HTTPException(
            status_code=400, 
            detail="LinkedIn profile is required for verification when using public email domains."
        )

    # 3. Generate OTP & Store Data (DON'T CREATE ACCOUNT YET)
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    OTP_STORE[email_clean] = {
        'otp': otp,
        'expires_at': datetime.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
        'name': data.name,
        'company_name': data.company_name,
        'password_hash': password_hash,
        'linkedin_url': data.linkedin_url,
        'type': 'recruiter_signup',
        'is_public_domain': is_public # Store this flag for the next step
    }
    
    # 4. Send OTP Email
    background_tasks.add_task(send_recruiter_otp_email, email_clean, otp, data.name)
    
    # 5. Return Success with OTP Requirement
    return {
        "message": "OTP sent to your email",
        "email": email_clean,
        "requires_otp": True
    }

@app.get("/recruiters/{recruiter_id}")
def get_recruiter(recruiter_id: int, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if not recruiter: raise HTTPException(status_code=404, detail="Recruiter not found")
    return {"id": recruiter.id, "name": recruiter.name, "company_name": recruiter.company_name}

class JobPost(BaseModel):
    title: str
    employment_type: str
    location_type: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "INR"
    salary_frequency: str = "Monthly"
    equity: bool = False
    description: str
    skills_required: str
    experience_level: str

    
@app.post("/recruiters/post-job")
async def post_job(
    data: JobPost,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        recruiter_id = payload.get("sub")
        if not recruiter_id: raise HTTPException(status_code=401, detail="Invalid token")
        
        recruiter = db.query(Recruiter).filter(Recruiter.id == int(recruiter_id)).first()
        if not recruiter: raise HTTPException(status_code=401, detail="Recruiter not found")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if recruiter.verification_status == 'pending':
        raise HTTPException(status_code=403, detail="Account pending verification.")
    
    # Trust Score
    analysis = analyze_job_trust(data.title, data.description, data.salary_min, data.salary_max, data.currency, data.location_type)
    trust_score = analysis['trust_score']
    if data.salary_min and data.salary_max: trust_score = min(100, trust_score + 10)
    
    if trust_score < 50:
        raise HTTPException(status_code=400, detail=f"Job Blocked: {analysis['verdict']}")

    status_val = "active" if trust_score >= 75 else "pending_review"
    
    # Create Unified Job
    new_job = Job(
        recruiter_id=recruiter.id,
        company_name=recruiter.company_name,
        title=data.title,
        description=data.description,
        location=data.location,
        location_type=data.location_type,
        employment_type=data.employment_type,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        currency=data.currency,
        salary_frequency=data.salary_frequency,
        equity=data.equity,
        experience_level=data.experience_level,
        skills_required=data.skills_required,
        
        trust_score=trust_score,
        status=status_val,
        is_verified=recruiter.is_verified,
        views=0
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return {"job_id": new_job.id, "status": status_val, "trust_score": trust_score}

class AnswerAnalysisRequest(BaseModel):
    question: str
    user_answer: str
    job_role: str

@app.post("/interview/analyze-answer")
async def analyze_interview_answer(data: AnswerAnalysisRequest):
    if not os.getenv("GROQ_API_KEY"):
        return {
            "rating": 5,
            "feedback": "AI not configured. Good attempt!",
            "improved_answer": "Configure API key to see improvements."
        }

    prompt = f"""
    Role: Strict Interview Coach.
    Task: Evaluate a candidate's answer.
    
    CONTEXT:
    - Role: {data.job_role}
    - Question: "{data.question}"
    - Candidate Answer: "{data.user_answer}"
    
    INSTRUCTIONS:
    1. Rate the answer from 1-10 based on clarity, relevance, and depth.
    2. Provide constructive feedback (what was good, what was missing).
    3. Provide a "Model Answer" (how a top candidate would say it).
    
    OUTPUT JSON ONLY:
    {{
        "rating": <int 1-10>,
        "feedback": "<string>",
        "model_answer": "<string>"
    }}
    """

    try:
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.delete("/recruiters/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: raise HTTPException(404, "Job not found")
    
    db.query(JobApplication).filter(JobApplication.job_id == job.id).delete()
    db.query(SavedJob).filter(SavedJob.job_id == job.id).delete()
    
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

@app.put("/recruiters/jobs/{job_id}/status")
def update_job_status(job_id: int, status: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = status
    db.commit()
    return {"message": f"Job status updated to {status}"}


@app.get("/recruiters/{recruiter_id}/jobs")
def get_recruiter_jobs(recruiter_id: int, db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).order_by(Job.created_at.desc()).all()
    results = []
    for job in jobs:
        app_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
        results.append({
            "id": job.id,
            "title": job.title,
            "location": job.location,
            "status": job.status,
            "applications": app_count,
            "views": job.views or 0, # <--- 🟢 ADDED THIS LINE
            "created_at": job.created_at
        })
    return results

@app.get("/recruiters/jobs/{job_id}/applicants")
def get_job_applicants(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: return []

    results = db.query(JobApplication, User)\
        .join(User, JobApplication.user_id == User.id)\
        .filter(JobApplication.job_id == job_id)\
        .order_by(JobApplication.match_score.desc()).all()
    
    applicants = []
    for app, user in results:
        ai_analysis = get_ai_gap_analysis(user.resume_text or "", job.description, candidate_id=str(user.id), job_id=str(job.id))
        
        applicants.append({
            "id": app.id,
            "applicant_name": user.name,
            "applicant_email": user.email,
            "headline": user.headline or "No headline",
            "phone": user.phone or "Hidden",
            "resume_url": f"http://localhost:8000/static/resumes/{user.resume_filename}" if user.resume_filename else None,
            "applied_at": app.applied_at,
            "status": app.status,
            "metrics": {
                "experience": f"{user.total_experience} Yrs",
                "notice_period": user.notice_period,
                "current_salary": user.current_salary,
                "location": user.location
            },
            "match_score": app.match_score,
            "analysis": {
                "matched_skills": ai_analysis.get("matched_skills", []),
                "missing_skills": ai_analysis.get("missing_skills", []),
                "verdict": ai_analysis.get("coach_message", "")
            }
        })
    return applicants

class StatusUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None 

@app.put("/recruiters/applicants/{applicant_id}/status")
def update_applicant_status(
    applicant_id: int, 
    data: StatusUpdate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    try:
        # 1. Fetch Applicant
        applicant = db.query(JobApplication).filter(JobApplication.id == applicant_id).first()
        if not applicant: 
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # 2. Update Status in DB
        applicant.status = data.status.lower() 
        db.commit() 
        
        # 3. Trigger Email Notification
        try:
            job = db.query(Job).filter(Job.id == applicant.job_id).first()
            
            if job and job.recruiter_id:
                recruiter = db.query(Recruiter).filter(Recruiter.id == job.recruiter_id).first()
                if recruiter:
                    # Send the unified update email
                    background_tasks.add_task(
                        send_candidate_update_email,
                        candidate_email=applicant.applicant_email, 
                        candidate_name=applicant.applicant_name, 
                        job_title=job.title,
                        company_name=job.company_name,
                        hr_name=recruiter.name,
                        status=applicant.status, 
                        feedback=data.feedback
                    )
        except Exception as e:
            print(f"Email Trigger Error: {e}") # Non-blocking error

        return {"message": f"Status updated to {data.status}"}

    except Exception as e:
        db.rollback()
        print(f"Database Update Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.get("/recruiters/{recruiter_id}/analytics")
def get_analytics(recruiter_id: int, db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
    total_apps = sum([db.query(JobApplication).filter(JobApplication.job_id == job.id).count() for job in jobs])
    return {
        "total_jobs": len(jobs),
        "active_jobs": len([j for j in jobs if j.status == "active"]),
        "total_applications": total_apps,
        "total_views": sum([j.views for j in jobs])
    }

# 1. Pydantic Model for Profile Update
class RecruiterProfileUpdate(BaseModel):
    name: str
    company_name: str
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None

# 2. Get Full Recruiter Profile
@app.get("/recruiters/{recruiter_id}/profile")
def get_recruiter_profile(recruiter_id: int, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if not recruiter: 
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    # REMOVED: logo_url logic

    return {
        "id": recruiter.id,
        "name": recruiter.name,
        "email": recruiter.official_email,
        "company_name": recruiter.company_name,
        "company_website": getattr(recruiter, "company_website", ""),
        "company_description": getattr(recruiter, "company_description", ""),
        "company_size": getattr(recruiter, "company_size", ""),
        "location": getattr(recruiter, "location", ""),
        "industry": getattr(recruiter, "industry", ""),
        "is_verified": recruiter.is_verified
        # REMOVED: "logo_url": logo_url
    }

@app.put("/recruiters/{recruiter_id}/profile")
def update_recruiter_profile(recruiter_id: int, data: RecruiterProfileUpdate, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if not recruiter: 
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    recruiter.name = data.name
    recruiter.company_name = data.company_name
    
    # Dynamically set attributes if they exist in your DB model
    # Important: You must add these columns to your 'recruiters' table in models.py
    if hasattr(recruiter, "company_website"): recruiter.company_website = data.company_website
    if hasattr(recruiter, "company_description"): recruiter.company_description = data.company_description
    if hasattr(recruiter, "company_size"): recruiter.company_size = data.company_size
    if hasattr(recruiter, "location"): recruiter.location = data.location
    if hasattr(recruiter, "industry"): recruiter.industry = data.industry

    db.commit()
    return {"message": "Profile updated successfully"}


@app.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    return None

@app.get("/users/{user_id}/applications-detailed")
def get_user_applications_detailed(user_id: int, db: Session = Depends(get_db)):
    job_apps = db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
    results = []
    
    for app in job_apps:
        job_data = {
            "id": 0, 
            "title": "Unknown Job", 
            "company": "Unknown", 
            "location": "Remote", 
            "salary": "Not disclosed"
        }
        
        r_job = db.query(Job).filter(Job.id == app.job_id).first()
        if r_job:
            salary = None
            if r_job.salary_min and r_job.salary_max:
                salary = f"{r_job.currency} {r_job.salary_min:,} - {r_job.salary_max:,}"
            
            job_data = {
                "id": str(r_job.id), 
                "title": r_job.title, 
                "company": r_job.company_name,
                "location": r_job.location,
                "salary": salary or "Not disclosed"
            }

        results.append({
            "id": app.id,
            "status": app.status,
            "match_score": app.match_score,
            "applied_at": str(app.applied_at),
            "interview_attempts": app.interview_attempts or 0,
            "job": job_data
        })
        
    return sorted(results, key=lambda x: x['applied_at'], reverse=True)

class AdminLogin(BaseModel):
    username: str
    password: str

@app.post("/admin/create")
def create_admin(data: AdminLogin, db: Session = Depends(get_db)):
    existing = db.query(Admin).filter(Admin.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin username already exists")
    
    hashed_pw = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_admin = Admin(
        username=data.username,
        email=f"{data.username}@truthhire.com",
        password_hash=hashed_pw
    )
    db.add(new_admin)
    db.commit()
    return {"message": "Admin account created successfully"}

@app.post("/admin/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == data.username).first()
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(data.password.encode('utf-8'), admin.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "admin_id": admin.id,
        "username": admin.username,
        "role": "super_admin"
    }

@app.get("/admin/stats")
def get_admin_analytics(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_recruiters = db.query(Recruiter).count()
    total_jobs = db.query(Job).count()
    
    return {
        "total_users": total_users,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs
    }

class AdminJobPost(BaseModel):
    title: str
    company_name: str
    description: str
    location: str
    employment_type: str
    apply_link: str = None
    location_type: str = "On-site"
    # NEW FIELDS ADDED
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "INR"
    salary_frequency: str = "Monthly"
    experience_level: str = None
    skills_required: str = None
    equity: bool = False

@app.get("/admin/jobs")
def get_all_jobs_admin(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    results = []
    for job in jobs:
        results.append({
            "id": str(job.id),
            "title": job.title,
            "company_name": job.company_name,
            "location": job.location,
            "employment_type": job.employment_type,
            "source": "Recruiter" if job.recruiter_id else "Admin",
            "created_at": str(job.created_at),
            "is_direct": job.recruiter_id is not None
        })
    return results

@app.post("/admin/jobs")
def create_job_admin(data: AdminJobPost, db: Session = Depends(get_db)):
    new_job = Job(
        title=data.title,
        company_name=data.company_name,
        recruiter_id=None, # Explicitly NULL for Admin Jobs
        description=data.description,
        location=data.location,
        employment_type=data.employment_type,
        location_type=data.location_type,
        apply_link=data.apply_link,
        
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        currency=data.currency,
        salary_frequency=data.salary_frequency,
        equity=data.equity,
        experience_level=data.experience_level,
        skills_required=data.skills_required,
        
        is_verified=True,
        trust_score=100,
        status="active"
    )
    db.add(new_job)
    db.commit()
    return {"message": "Job posted successfully", "job_id": new_job.id}

class VerificationUpdate(BaseModel):
    status: str

# --- UPDATE THIS FUNCTION IN main.py ---

class JDGeneratorRequest(BaseModel):
    title: str
    company: str
    experience: str
    work_mode: str
    employment_type: str
    skills: Optional[str] = None  # <--- ADDED THIS FIELD

@app.post("/admin/generate-description")
async def generate_job_description_ai(data: JDGeneratorRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="AI Configuration Missing")

    # --- SMART CONTEXT GENERATION ---
    context_notes = ""
    if "Remote" in data.work_mode:
        context_notes += "This is a Remote role. Emphasize asynchronous communication, self-discipline, and remote collaboration tools.\n"
    elif "Hybrid" in data.work_mode:
        context_notes += "This is a Hybrid role. Mention the balance between office collaboration and work-from-home flexibility.\n"
    
    if "Contract" in data.employment_type:
        context_notes += "This is a Contract position. Focus on immediate impact, deliverables, and project timelines.\n"
    elif "Internship" in data.employment_type:
        context_notes += "This is an Internship. Focus on learning opportunities, mentorship, and skill growth.\n"

    # --- SKILL INTEGRATION ---
    skills_instruction = ""
    if data.skills and len(data.skills) > 2:
        skills_instruction = f"MUST include these specific technical skills in the Requirements section: {data.skills}."

    prompt = f"""
    Role: Senior Talent Acquisition Specialist for {data.company}.
    Task: Write a highly professional Job Description for a '{data.title}'.
    
    JOB CONTEXT:
    - Experience Level: {data.experience}
    - Work Mode: {data.work_mode}
    - Employment Type: {data.employment_type}
    
    CUSTOM INSTRUCTIONS:
    {context_notes}
    {skills_instruction}
    
    GUIDELINES:
    1. **About the Role**: Write 2-3 engaging sentences. Mention the company culture and why this role matters. Explicitly mention it is a {data.work_mode} {data.employment_type} role.
    2. **Responsibilities**: Write 5-7 bullet points. Use strong action verbs (e.g., "Architect," "Deploy," "Spearhead"). Tailor complexity to {data.experience}.
    3. **Requirements**: Write 5-7 bullet points. {skills_instruction} Add soft skills relevant to the work mode.
    4. **Benefits**: Write 3-4 bullet points. Include standard Indian market benefits (Health Insurance, Leave) PLUS specific benefits for {data.work_mode}.
    5. **Formatting**: Start every bullet point with a hyphen (-) and ensure it is on a NEW LINE.
    
    OUTPUT JSON FORMAT ONLY:
    {{
        "about_role": "string",
        "responsibilities": "string (bullet points with newlines)",
        "requirements": "string (bullet points with newlines)",
        "benefits": "string (bullet points with newlines)"
    }}
    """

    try:
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"JD Gen Error: {e}")
        raise HTTPException(status_code=500, detail="AI Generation Failed")
    

@app.put("/admin/jobs/{job_id}")
def update_job_admin(job_id: int, data: AdminJobPost, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.title = data.title
    job.company_name = data.company_name
    job.description = data.description
    job.location = data.location
    job.employment_type = data.employment_type
    job.apply_link = data.apply_link
    
    db.commit()
    return {"message": "Job updated successfully"}

@app.delete("/admin/jobs/{job_id}")
def delete_job_admin(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: raise HTTPException(404, "Job not found")
    
    db.query(JobApplication).filter(JobApplication.job_id == job.id).delete()
    db.query(SavedJob).filter(SavedJob.job_id == job.id).delete()
    
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

@app.get("/admin/users")
def get_all_users_admin(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "created_at": str(u.created_at),
            "match_score": u.avg_match_score
        })
    return results

@app.delete("/admin/users/{user_id}")
def delete_user_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.query(JobApplication).filter(JobApplication.user_id == user_id).delete()
    db.query(SavedJob).filter(SavedJob.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@app.get("/admin/recruiters")
def get_all_recruiters_admin(db: Session = Depends(get_db)):
    recruiters = db.query(Recruiter).order_by(Recruiter.created_at.desc()).all()
    results = []
    for r in recruiters:
        job_count = db.query(Job).filter(Job.recruiter_id == r.id).count()
        results.append({
            "id": r.id,
            "name": r.name,
            "company_name": r.company_name,
            "official_email": r.official_email,
            "verification_status": r.verification_status,
            "linkedin_url": r.linkedin_url,
            "job_count": job_count,
            "created_at": str(r.created_at)
        })
    return results

@app.delete("/admin/recruiters/{recruiter_id}")
def delete_recruiter_admin(recruiter_id: int, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    db.query(Job).filter(Job.recruiter_id == recruiter_id).delete()
    
    db.delete(recruiter)
    db.commit()
    return {"message": "Recruiter deleted"}

@app.post("/applications/{application_id}/generate-prep")
def generate_interview_prep(
    application_id: int, 
    type: str = Query("technical", enum=["hr", "technical", "mixed"]), 
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job_title = "Role"
    company_name = "Company"
    job_desc = ""
    skills = "General Skills"

    r_job = db.query(Job).filter(Job.id == app.job_id).first()
    if r_job:
        job_title = r_job.title
        company_name = r_job.company_name
        job_desc = r_job.description
        skills = r_job.skills_required or "General Skills"

    if type == "hr":
        role_persona = f"Friendly HR Manager at {company_name}"
        themes = ["Introduction", "Work Style", "Motivation", "Basic Strengths", "Availability"]
        selected_theme = random.choice(themes)
        
        instruction_text = """
        1. **Goal:** Get to know the candidate in a low-stress environment.
        2. **Difficulty:** EASY / CONVERSATIONAL. Do NOT ask trick questions.
        3. **Focus:** Ask standard questions like 'Tell me about yourself' or 'Why this role?'.
        4. **Structure:** Keep questions short and encouraging.
        """
        
    elif type == "technical":
        role_persona = f"Supportive Technical Mentor at {company_name}"
        themes = ["Basic Definitions", "Code Logic", "Simple Problem Solving", f"Basics of {skills.split(',')[0] if skills else 'Skills'}", "Tools & Workflow"]
        selected_theme = random.choice(themes)
        
        instruction_text = """
        1. **Goal:** Assess fundamental knowledge and potential.
        2. **Difficulty:** **BEGINNER / JUNIOR LEVEL**. 
        3. **Focus:** Ask about basic concepts, definitions, or simple "how would you" scenarios.
        4. **Avoid:** Complex system design, obscure algorithms, or senior-level architecture questions.
        5. **Structure:** Start with a very easy "warm-up" technical question.
        """
        
    else: 
        role_persona = f"Hiring Manager at {company_name}"
        selected_theme = "General Skills"
        instruction_text = "Ask 2 simple Behavioral questions and 3 basic Technical questions suitable for a junior role."

    if not os.getenv("GROQ_API_KEY"):
         return {
            "elevator_pitch": f"I am {app.applicant_name}, eager to join {company_name}.",
            "topics": ["General Interview"],
            "interview_flow": [{"question": "Tell me about yourself.", "hint": "Keep it professional."}]
        }

    prompt = f"""
    Role: {role_persona}.
    Task: Conduct a **{type.upper()}** Interview Round for the '{job_title}' role.
    
    CONTEXT:
    - Job Description Snippet: {job_desc[:800]}...
    - Core Skills: {skills}
    - Candidate Name: {app.applicant_name}
    - Interview Focus: {selected_theme}
    
    INSTRUCTIONS:
    {instruction_text}
    
    OUTPUT JSON FORMAT ONLY:
    {{
        "elevator_pitch": "A simple, easy-to-say 2-sentence intro for the candidate.",
        "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
        "interview_flow": [
            {{
                "question": "Easy warm-up question.",
                "hint": "Tip for a simple answer."
            }},
            {{
                "question": "Basic question 2.",
                "hint": "Tip."
            }},
            {{
                "question": "Basic question 3.",
                "hint": "Tip."
            }},
            {{
                "question": "Basic question 4.",
                "hint": "Tip."
            }},
            {{
                "question": "Slightly harder final question.",
                "hint": "Tip."
            }}
        ]
    }}
    """

    try:
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6, 
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"AI Prep Error: {e}")
        return {
            "elevator_pitch": "Error generating AI pitch.",
            "topics": ["Error"],
            "interview_flow": [{"question": "Please try again.", "hint": "Server busy."}]
        }
    
@app.post("/applications/{application_id}/complete-prep")
def complete_interview_prep(application_id: int, db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.interview_attempts = (app.interview_attempts or 0) + 1
    
    db.commit()
    return {
        "message": "Session recorded", 
        "total_attempts": app.interview_attempts
    }




@app.put("/admin/recruiters/{recruiter_id}/verify")
def verify_recruiter(recruiter_id: int, data: VerificationUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    recruiter.verification_status = data.status
    
    if data.status == "verified":
        recruiter.is_verified = True
    elif data.status == "rejected":
        recruiter.is_verified = False
    
    db.commit()
    
    # Send email notification
    background_tasks.add_task(send_recruiter_status_email, recruiter.official_email, recruiter.name, data.status)
    
    return {"message": f"Recruiter {data.status} successfully"}

# ===========================
# 🆕 WAITLIST ENDPOINT
# ===========================

class WaitlistRequest(BaseModel):
    email: str
    category: str

@app.post("/waitlist/join")
def join_waitlist(data: WaitlistRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if already exists
    existing = db.query(Waitlist).filter(Waitlist.email == data.email, Waitlist.category == data.category).first()
    
    if existing:
        # 🟢 RETURN A SPECIFIC STATUS FOR "ALREADY EXISTS"
        return JSONResponse(
            status_code=200, 
            content={"status": "exists", "message": "You are already on the waitlist."}
        )

    # 1. Save to DB
    new_entry = Waitlist(email=data.email, category=data.category)
    db.add(new_entry)
    db.commit()
    
    # 2. CALC REAL POSITION
    position = db.query(Waitlist).filter(Waitlist.category == data.category).count()
    
    # 3. Send Email
    background_tasks.add_task(send_waitlist_confirmation_email, data.email, data.category, position)
    
    return {"status": "success", "message": "Added to waitlist"}