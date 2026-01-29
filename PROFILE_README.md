# TruthHire Fresher Profile Page

## Overview
A comprehensive profile page designed specifically for freshers/students with AI-powered insights, skill gap tracking, and portfolio showcase.

## Key Features

### 1. Hero Section (Identity & Trust)
- Profile photo with name and headline
- College/University tag with batch year
- ✅ "Student Verified" badge (when college ID uploaded)
- Work status indicator (Open to Work/Internship/Hired)
- Contact information and social links

### 2. TruthHire Special (AI Insights)
- **Employability Score (0-100)**: Shows ranking among applicants
- **Skill Gap Tracker**: Identifies missing skills from recent applications
- **Safety Stats**: Tracks verified jobs applied and scams avoided
- Personalized recommendations for skill improvement

### 3. Resume Command Center
- Current resume display with upload date
- "See what AI sees" feature to preview parsed data
- Easy resume update functionality
- Support for multiple resume versions

### 4. Fresher Portfolio
- **Projects**: Showcase with tech stack, live links, and GitHub repos
- **Achievements/Hackathons**: Display awards and competition wins
- **Education**: College, degree, CGPA, and batch year
- **Certifications**: AWS, Coursera, and other credentials

### 5. Job Preferences
- Target roles selection
- Preferred locations (including remote)
- Expected stipend/salary range

## Setup Instructions

### 1. Update Database
Run the database migration script to add new tables and fields:

```bash
cd backend
python update_database.py
```

This will create:
- `projects` table
- `achievements` table
- `certifications` table
- `skill_gaps` table
- Update `users` table with new fields

### 2. Start Backend
```bash
cd backend
python main.py
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Access Profile
Navigate to `/profile` after logging in

## API Endpoints

### Profile Management
- `GET /users/{user_id}` - Get complete profile with all data
- `PUT /users/{user_id}/profile` - Update profile fields

### Projects
- `POST /users/{user_id}/projects` - Add new project
- `PUT /users/{user_id}/projects/{project_id}` - Update project
- `DELETE /projects/{project_id}` - Delete project

### Achievements
- `POST /users/{user_id}/achievements` - Add achievement
- `PUT /users/{user_id}/achievements/{achievement_id}` - Update achievement
- `DELETE /achievements/{achievement_id}` - Delete achievement

### Certifications
- `POST /users/{user_id}/certifications` - Add certification
- `PUT /users/{user_id}/certifications/{certification_id}` - Update certification
- `DELETE /certifications/{certification_id}` - Delete certification

## Data Structure

### User Profile Fields
```json
{
  "headline": "Python Developer & AI Enthusiast",
  "college": "IIT Pune",
  "batch_year": "2025",
  "degree": "B.Tech in Computer Science",
  "cgpa": "8.5",
  "is_student_verified": true,
  "work_status": "Open to Work",
  "bio": "Passionate about AI and full-stack development...",
  "github_url": "https://github.com/username",
  "linkedin_url": "https://linkedin.com/in/username",
  "portfolio_url": "https://portfolio.com",
  "skills": "[\"Python\", \"React\", \"Node.js\"]",
  "target_roles": "[\"Full Stack Developer\", \"Data Analyst\"]",
  "preferred_locations": "[\"Pune\", \"Bangalore\", \"Remote\"]",
  "expected_salary": "₹15k - ₹25k / month",
  "employability_score": 75,
  "verified_jobs_applied": 12,
  "scams_avoided": 3
}
```

### Project Structure
```json
{
  "title": "E-commerce App",
  "description": "Built a full-stack app handling 100+ users",
  "tech_stack": "React, Node.js, MongoDB",
  "live_link": "https://demo.com",
  "github_link": "https://github.com/user/project"
}
```

## Design Features

### Layout
- **2-Column Design**: Sticky left sidebar + scrollable right content
- **Left Sidebar**: Quick info, verified badge, AI score meter, contact
- **Right Main Area**: Detailed sections with cards

### Visual Elements
- Circular AI score meter with percentage
- Color-coded skill gap indicators
- Tech stack tags for projects
- Verified badges and status indicators
- Gradient backgrounds for special sections

### Color Scheme
- Primary: electric green (#00ff88)
- Secondary: Electric blue (#00d4ff)
- Background: Void black (#0a0a0a)
- Cards: Charcoal (#1a1a1a)
- Borders: Subtle gray (#2a2a2a)

## Future Enhancements

1. **Student Verification**: Upload college ID for verified badge
2. **Multiple Resume Versions**: Tech vs Non-Tech resumes
3. **Skill Gap Learning**: Direct links to courses
4. **AI Resume Parser**: Show extracted data preview
5. **Profile Completeness**: Progress bar showing profile completion
6. **Recommendations**: AI-suggested improvements
7. **Analytics Dashboard**: Application success rate, profile views

## Notes

- All fields are optional except basic info (name, email)
- AI insights update automatically based on applications
- Skill gaps are tracked from job applications
- Employability score calculated from match scores
- Profile is optimized for fresher/student audience
