from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON
from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base, engine
import bcrypt

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- LINKAGE (New) ---
    # If recruiter_id is NULL, it's an Admin/External Job
    recruiter_id = Column(Integer, ForeignKey("recruiters.id"), nullable=True)
    recruiter = relationship("Recruiter", back_populates="jobs")

    # --- CONTENT ---
    title = Column(String, index=True)
    company_name = Column(String, index=True)
    description = Column(Text)
    
    # --- DETAILS ---
    location = Column(String)
    location_type = Column(String, default="On-site") # Remote/On-site/Hybrid
    employment_type = Column(String)
    
    # --- LOGISTICS ---
    apply_link = Column(String, nullable=True) # External URL for Admin jobs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # --- RICH DATA ---
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    currency = Column(String, default="INR")
    salary_frequency = Column(String, default="Monthly")
    equity = Column(Boolean, default=False)
    
    experience_level = Column(String, nullable=True)
    skills_required = Column(String, nullable=True) 

    # --- SYSTEM & STATUS (Merged from DirectJob) ---
    is_verified = Column(Boolean, default=False)
    trust_score = Column(Integer, default=100) # AI Score
    status = Column(String, default="active") # active, pending_review, closed, inactive
    views = Column(Integer, default=0)
    rejection_reason = Column(Text, nullable=True)

class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    company_name = Column(String)
    official_email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # --- Relationship (New) ---
    jobs = relationship("Job", back_populates="recruiter")
    
    # --- Verification System ---
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="pending")
    linkedin_url = Column(String, nullable=True)
    signup_method = Column(String, default='email') 
    
    verification_docs = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    company_website = Column(String, nullable=True)
    company_description = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)

# --- DirectJob Table Removed ---

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Updated to point to 'jobs' table
    job_id = Column(Integer, ForeignKey('jobs.id')) 
    user_id = Column(Integer, ForeignKey('users.id'))
    job = relationship("Job")
    applicant_name = Column(String)
    applicant_email = Column(String)
    resume_text = Column(Text)
    match_score = Column(Integer, default=0)
    status = Column(String, default="applied") 
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    interview_attempts = Column(Integer, default=0)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    # Resume
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    resume_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    avg_match_score = Column(Float, default=0.0)
    
    # Fresher Profile Fields
    headline = Column(String, nullable=True)
    college = Column(String, nullable=True)
    batch_year = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    cgpa = Column(String, nullable=True)
    is_student_verified = Column(Boolean, default=False)
    work_status = Column(String, default="Open to Work")
    bio = Column(Text, nullable=True)
    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    skills = Column(Text, nullable=True) 
    target_roles = Column(Text, nullable=True) 
    preferred_locations = Column(Text, nullable=True) 
    expected_salary = Column(String, nullable=True)
    
    # Education & Experience
    education = Column(Text, nullable=True) 
    experiences = Column(Text, nullable=True) 
    summary = Column(Text, nullable=True) 
    
    total_experience = Column(Float, default=0.0) 
    current_salary = Column(String, nullable=True) 
    notice_period = Column(String, default="Immediate") 
    # AI Insights
    employability_score = Column(Integer, default=0)
    verified_jobs_applied = Column(Integer, default=0)
    scams_avoided = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Note: You can now technically remove 'Application' table if you migrate everything to JobApplication
# But I will leave it here if you still have legacy code relying on it.
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    job_id = Column(Integer, ForeignKey('jobs.id'))
    job_title = Column(String)
    company_name = Column(String)
    status = Column(String, default="pending")
    match_score = Column(Integer, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedJob(Base):
    __tablename__ = "saved_jobs"
    job = relationship("Job")
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    job_id = Column(Integer, ForeignKey('jobs.id'))
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    description = Column(Text)
    tech_stack = Column(String) 
    live_link = Column(String, nullable=True)
    github_link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    description = Column(Text, nullable=True)
    date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    issuer = Column(String)
    date = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    skill_name = Column(String)
    frequency = Column(Integer, default=1)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())

class AIFeedback(Base):
    __tablename__ = "ai_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(String)
    
    resume_text_snapshot = Column(Text) 
    job_desc_snapshot = Column(Text)
    
    ai_response_snapshot = Column(JSON) 
    
    rating = Column(String)
    feedback_tags = Column(String)
    
    created_at = Column(DateTime, default=datetime.now)

class Waitlist(Base):
    __tablename__ = "waitlist"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    category = Column(String)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
# Run this block to create tables
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Database tables updated successfully")