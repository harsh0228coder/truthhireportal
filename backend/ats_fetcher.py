import os
import json
import html
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from groq import Groq

from backend.database import SessionLocal
from backend.models import Job

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ai_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Filter to focus on Major Indian IT Hubs
INDIAN_IT_HUBS = [
    "pune", "bangalore", "bengaluru", "hyderabad", "gurgaon", 
    "gurugram", "noida", "mumbai", "chennai", "remote", "india"
]

def extract_ats_metadata_ai(title: str, description: str) -> dict:
    """
    Enterprise-grade ATS extraction using Strict Constraint Parsing (Temperature = 0.0).
    """
    if not ai_client:
        return {
            "skills_required": "",
            "experience_level": "Mid-level (3-5y)",
            "employment_type": "Full-time",
            "location_type": "On-site"
        }

    prompt = f"""
    You are a strict Data Extraction Engine for a tech job portal. 
    Extract explicit metadata from the provided text and map it to our strict database schema.

    === INPUT DATA ===
    Job Title: {title}
    Job Description: {description[:4000]}

    === EXTRACTION RULES & MAPPING LOGIC ===

    1. EXPERIENCE LEVEL (Must be EXACTLY one of the following strings):
       ["Fresher (0-1y)", "Junior (1-3y)", "Mid-level (3-5y)", "Senior (5+y)"]
       - Rule A: Scan for explicit numbers (e.g., "3+ years", "5-7 years").
       - Rule B: If "5" or more years required, map to "Senior (5+y)".
       - Rule C: If "1 to 3" years, map to "Junior (1-3y)".
       - Rule D: If Title contains "Senior", "Lead", "Staff", or "Principal", map to "Senior (5+y)".
       - Fallback: "Mid-level (3-5y)".

    2. EMPLOYMENT TYPE (Must be EXACTLY one of the following strings):
       ["Full-time", "Part-time", "Contract", "Internship"]
       - Rule A: If text contains "contract", "freelance", or "C2H", map to "Contract".
       - Rule B: If text contains "intern", map to "Internship".
       - Fallback: "Full-time".

    3. LOCATION TYPE (Must be EXACTLY one of the following strings):
       ["On-site", "Remote", "Hybrid"]
       - Rule A: If title/text contains "remote", "work from home", or "WFH", map to "Remote".
       - Rule B: If text mentions office "2 days a week" or "hybrid", map to "Hybrid".
       - Fallback: "On-site".

    4. SKILLS REQUIRED (Comma-separated string):
       - Rule A: Extract MAXIMUM 6 HARD technical skills/frameworks (e.g., "React, Node.js, PostgreSQL, AWS").
       - Rule B: DO NOT extract soft skills (ignore "communication", "leadership", "agile").

    === OUTPUT JSON FORMAT ===
    Return ONLY pure JSON.
    {{
        "experience_level": "string",
        "employment_type": "string",
        "location_type": "string",
        "skills_required": "string"
    }}
    """

    try:
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict JSON data extraction engine."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        valid_exp = ["Fresher (0-1y)", "Junior (1-3y)", "Mid-level (3-5y)", "Senior (5+y)"]
        valid_emp = ["Full-time", "Part-time", "Contract", "Internship"]
        valid_loc = ["On-site", "Remote", "Hybrid"]
        
        return {
            "experience_level": result.get("experience_level") if result.get("experience_level") in valid_exp else "Mid-level (3-5y)",
            "employment_type": result.get("employment_type") if result.get("employment_type") in valid_emp else "Full-time",
            "location_type": result.get("location_type") if result.get("location_type") in valid_loc else "On-site",
            "skills_required": result.get("skills_required", "")
        }

    except Exception as e:
        print(f"⚠️ AI Metadata Extraction Error: {e}")
        return {
            "skills_required": "",
            "experience_level": "Mid-level (3-5y)",
            "employment_type": "Full-time",
            "location_type": "On-site"
        }

def is_indian_hub_job(location_str: str) -> bool:
    """Checks if the job location belongs to major Indian IT parks/hubs or is remote."""
    if not location_str:
        return True
    loc_lower = location_str.lower()
    return any(hub in loc_lower for hub in INDIAN_IT_HUBS)

def process_ats_import_background(company_name: str, ats_type: str, board_token: str):
    """Background task to pull, filter, normalize, and save ATS jobs."""
    db: Session = SessionLocal()
    
    try:
        jobs_added = 0
        ats = ats_type.lower()
        
        if ats == "greenhouse":
            api_url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"
        elif ats == "lever":
            api_url = f"https://api.lever.co/v0/postings/{board_token}"
        elif ats == "workable":
            api_url = f"https://www.workable.com/api/accounts/{board_token}/jobs"
        else:
            print("❌ Invalid ATS Type provided.")
            return

        res = requests.get(api_url, timeout=15)
        if res.status_code != 200:
            print(f"❌ Failed to fetch from {api_url} - Status {res.status_code}")
            return
            
        raw_data = res.json()
        job_list = []

        # Parse formats according to ATS response structures
        if ats == "greenhouse":
            items = raw_data.get("jobs", [])
            for item in items:
                job_list.append({
                    "title": item.get("title"),
                    "url": item.get("absolute_url"),
                    "location": item.get("location", {}).get("name", "India"),
                    "description": BeautifulSoup(html.unescape(item.get("content", "")), "html.parser").get_text(separator="\n").strip()
                })
        elif ats == "lever":
            for item in raw_data:
                job_list.append({
                    "title": item.get("text"),
                    "url": item.get("hostedUrl"),
                    "location": item.get("categories", {}).get("location", "India"),
                    "description": item.get("descriptionPlain", "")
                })

        # Process jobs
        for job_info in job_list:
            title = job_info.get("title")
            apply_link = job_info.get("url")
            location = job_info.get("location", "India")
            description = job_info.get("description", "")

            if not apply_link or not description or len(description) < 100:
                continue

            # 1. Indian Hub Location Filter
            if not is_indian_hub_job(location):
                continue

            # 2. Duplicate Check
            existing = db.query(Job).filter(Job.apply_link == apply_link).first()
            if existing:
                continue

            # 3. AI Normalization
            ai_meta = extract_ats_metadata_ai(title, description)

            # 4. Save to Database
            new_job = Job(
                title=title,
                company_name=company_name,
                recruiter_id=None,
                description=description,
                location=location,
                location_type=ai_meta["location_type"],
                employment_type=ai_meta["employment_type"],
                apply_link=apply_link,
                experience_level=ai_meta["experience_level"],
                skills_required=ai_meta["skills_required"],
                currency="INR",
                salary_frequency="Monthly",
                equity=False,
                is_verified=True,
                trust_score=100,
                status="active"
            )
            db.add(new_job)
            db.commit()
            jobs_added += 1

        print(f"✅ Auto-Imported {jobs_added} new verified jobs for {company_name} ({ats_type})")

    except Exception as e:
        print(f"❌ Error importing ATS jobs for {company_name}: {e}")
        db.rollback()
    finally:
        db.close()

def is_fresher_role(title: str, description: str) -> bool:
    """Scans the title and description for keywords indicating an entry-level role."""
    fresher_keywords = [
        "fresher", "0-1", "0-2", "trainee", "intern", "internship", 
        "junior", "jr", "associate", "entry level", "graduate", "bootcamp"
    ]
    
    combined_text = f"{title} {description}".lower()
    
    # If the title explicitly says Senior, Lead, or Principal, reject it immediately
    senior_keywords = ["senior", "sr", "lead", "principal", "manager", "director", "architect"]
    if any(keyword in title.lower() for keyword in senior_keywords):
        return False
        
    return any(keyword in combined_text for keyword in fresher_keywords)

def process_ats_import_background(company_name: str, ats_type: str, board_token: str, target_freshers_only: bool = False):
    """
    Upgraded Background task that supports BreezyHR and SmartRecruiters,
    with an optional filter to exclusively pull fresher/junior roles.
    """
    db: Session = SessionLocal()
    
    try:
        jobs_added = 0
        ats = ats_type.lower()
        
        # 1. Expand API Endpoint Support
        if ats == "greenhouse":
            api_url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"
        elif ats == "lever":
            api_url = f"https://api.lever.co/v0/postings/{board_token}"
        elif ats == "workable":
            api_url = f"https://www.workable.com/api/accounts/{board_token}/jobs"
        elif ats == "breezyhr":
            # BreezyHR Public JSON API
            api_url = f"https://{board_token}.breezy.hr/json"
        elif ats == "smartrecruiters":
            # SmartRecruiters Public Postings API
            api_url = f"https://api.smartrecruiters.com/v1/companies/{board_token}/postings"
        else:
            print(f"❌ Invalid ATS Type provided: {ats}")
            return

        res = requests.get(api_url, timeout=15)
        if res.status_code != 200:
            print(f"❌ Failed to fetch from {api_url} - Status {res.status_code}")
            return
            
        raw_data = res.json()
        job_list = []

        # 2. Parse ATS Responses
        if ats == "greenhouse":
            items = raw_data.get("jobs", [])
            for item in items:
                job_list.append({
                    "title": item.get("title"),
                    "url": item.get("absolute_url"),
                    "location": item.get("location", {}).get("name", "India"),
                    "description": BeautifulSoup(html.unescape(item.get("content", "")), "html.parser").get_text(separator="\n").strip()
                })
                
        elif ats == "lever":
            for item in raw_data:
                job_list.append({
                    "title": item.get("text"),
                    "url": item.get("hostedUrl"),
                    "location": item.get("categories", {}).get("location", "India"),
                    "description": item.get("descriptionPlain", "")
                })
                
        elif ats == "workable":
            items = raw_data.get("jobs", [])
            for item in items:
                job_list.append({
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "location": f"{item.get('city', '')}, {item.get('country', 'India')}",
                    "description": BeautifulSoup(html.unescape(item.get("description", "")), "html.parser").get_text(separator="\n").strip()
                })
                
        elif ats == "breezyhr":
            for item in raw_data:
                # Breezy wraps location in a dict
                loc_dict = item.get("location", {})
                loc_str = f"{loc_dict.get('city', '')}, {loc_dict.get('country', 'India')}"
                job_list.append({
                    "title": item.get("name"),
                    "url": item.get("url"),
                    "location": loc_str,
                    # Breezy descriptions usually need an extra API call, but we grab the summary if available
                    "description": item.get("summary", item.get("name")) 
                })
                
        elif ats == "smartrecruiters":
            items = raw_data.get("content", [])
            for item in items:
                loc_dict = item.get("location", {})
                loc_str = f"{loc_dict.get('city', '')}, {loc_dict.get('country', 'India')}"
                job_list.append({
                    "title": item.get("name"),
                    "url": f"https://jobs.smartrecruiters.com/{board_token}/{item.get('id')}",
                    "location": loc_str,
                    "description": item.get("name") # Requires secondary fetch for full desc, placeholder used
                })

        # 3. Process and Filter Jobs
        for job_info in job_list:
            title = job_info.get("title")
            apply_link = job_info.get("url")
            location = job_info.get("location", "India")
            description = job_info.get("description", "")

            if not apply_link or not title:
                continue

            # FILTER: Target Freshers Only 
            if target_freshers_only and not is_fresher_role(title, description):
                continue

            # FILTER: Target Indian Hubs Only
            if not is_indian_hub_job(location):
                continue

            # Duplicate Check
            existing = db.query(Job).filter(Job.apply_link == apply_link).first()
            if existing:
                continue

            # AI Normalization
            ai_meta = extract_ats_metadata_ai(title, description)

            # Save to Database
            new_job = Job(
                title=title,
                company_name=company_name,
                recruiter_id=None,
                description=description,
                location=location,
                location_type=ai_meta["location_type"],
                employment_type=ai_meta["employment_type"],
                apply_link=apply_link,
                experience_level=ai_meta["experience_level"],
                skills_required=ai_meta["skills_required"],
                currency="INR",
                salary_frequency="Monthly",
                equity=False,
                is_verified=True,
                trust_score=100,
                status="active"
            )
            db.add(new_job)
            db.commit()
            jobs_added += 1

        print(f"✅ Auto-Imported {jobs_added} verified jobs for {company_name} ({ats_type})")

    except Exception as e:
        print(f"❌ Error importing ATS jobs for {company_name}: {e}")
        db.rollback()
    finally:
        db.close()