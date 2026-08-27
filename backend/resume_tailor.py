"""
AI Resume Tailor — reframes a candidate's baseline resume against a target JD
and outputs an ATS-safe PDF.

Core rules (the trust moat):
  1. NEVER invent skills or experience the user does not already have.
  2. Only reframe language & bullet phrasing to bridge the JD's terminology.
  3. Output a strict single-column, standard-heading PDF for max ATS parseability.
"""

from __future__ import annotations

import io
import json
import re
import os
from typing import Optional, Any

from groq import Groq
from pydantic import BaseModel, Field, field_validator
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)


def _coerce_str_list(v: Any) -> list[str]:
    """
    Convert whatever the LLM gave us into a clean list[str].

    Llama-3.3 frequently returns list-ish fields as one of:
      - a proper list of strings              -> pass through
      - a comma-separated string              -> split on ','
      - a newline / bullet separated string   -> split on newlines
      - None                                  -> []
    """
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str):
        # Split on commas OR newlines OR common bullet chars
        parts = re.split(r"[,\n;•·]+|(?:^|\s)-\s+", v)
        return [p.strip(" -•·\t") for p in parts if p.strip(" -•·\t")]
    # Any other type -> try str conversion
    return [str(v).strip()] if str(v).strip() else []


# ---------- Structured schema returned by the LLM ---------------------------

class TailoredExperience(BaseModel):
    title: str = ""
    company: str = ""
    dates: str = ""
    bullets: list[str] = Field(default_factory=list)

    @field_validator("bullets", mode="before")
    @classmethod
    def _v_bullets(cls, v): return _coerce_str_list(v)

    @field_validator("title", "company", "dates", mode="before")
    @classmethod
    def _v_str(cls, v):
        return "" if v is None else str(v)


class TailoredEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    dates: str = ""
    details: str = ""

    @field_validator("degree", "institution", "dates", "details", mode="before")
    @classmethod
    def _v_str(cls, v):
        return "" if v is None else str(v)


class TailoredProject(BaseModel):
    title: str = ""
    tech_stack: str = ""
    bullets: list[str] = Field(default_factory=list)

    @field_validator("bullets", mode="before")
    @classmethod
    def _v_bullets(cls, v): return _coerce_str_list(v)

    @field_validator("title", "tech_stack", mode="before")
    @classmethod
    def _v_str(cls, v):
        # tech_stack occasionally comes as a list — flatten it
        if isinstance(v, list):
            return ", ".join(str(x) for x in v)
        return "" if v is None else str(v)


class TailoredResumeData(BaseModel):
    full_name: str = "Candidate"
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""

    summary: str = ""
    technical_skills: list[str] = Field(default_factory=list)
    tools_and_software: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    experience: list[TailoredExperience] = Field(default_factory=list)
    projects: list[TailoredProject] = Field(default_factory=list)
    education: list[TailoredEducation] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)

    # Coerce any string-y contact fields to str
    @field_validator("full_name", "email", "phone", "location", "linkedin", "github", "summary", mode="before")
    @classmethod
    def _v_str(cls, v):
        if isinstance(v, list):
            return ", ".join(str(x) for x in v)
        return "" if v is None else str(v)

    # Coerce list fields whether the LLM gave string or list
    @field_validator("technical_skills", "tools_and_software", "soft_skills", "certifications", mode="before")
    @classmethod
    def _v_list(cls, v):
        return _coerce_str_list(v)

    # Promote single dicts to lists
    @field_validator("experience", "projects", "education", mode="before")
    @classmethod
    def _v_promote(cls, v):
        if v is None:
            return []
        if isinstance(v, dict):
            return [v]
        return v


_SYSTEM_PROMPT = """You are TruthHire's Elite ATS Resume Optimization AI. Your objective is to reframe a candidate's baseline resume to maximize ATS parseability and alignment with a target Job Description (JD).

STRICT LAWS OF OPERATION:
1. ZERO HALLUCINATIONS: NEVER invent experience, companies, job titles, metrics, or degrees. You may only use facts present in the candidate's baseline resume.
2. KEYWORD INTEGRATION: Analyze the JD for critical keywords (hard skills, tools, methodologies). If the candidate's experience supports these keywords, seamlessly integrate them into their bullet points. 
3. PROFESSIONAL REFRAMING (STAR METHOD): Rewrite weak bullet points into strong, action-oriented, results-driven statements (e.g., "Spearheaded X using Y resulting in Z"). Remove all fluff.
4. SKILL SEGREGATION: Classify the candidate's existing skills exactly into: 'technical_skills' (languages/frameworks), 'tools_and_software' (platforms/databases), and 'soft_skills'.
5. JSON FORMAT ONLY: Output absolutely nothing but the valid JSON object requested. No conversational text.
"""


def _build_user_prompt(resume_text: str, jd_text: str, contact: dict) -> str:
    return f"""### BASELINE RESUME (Source of Truth - Do not invent anything outside this)
{resume_text[:6000]}

### CANDIDATE CONTACT INFO (Do not alter)
name: {contact.get('name', '')}
email: {contact.get('email', '')}
phone: {contact.get('phone', '')}
location: {contact.get('location', '')}
linkedin: {contact.get('linkedin', '')}
github: {contact.get('github', '')}

### TARGET JOB DESCRIPTION (Optimize for these keywords)
{jd_text[:4000]}

### TASK
Generate a JSON object matching this exact schema:
{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "summary": "3-4 highly impactful sentences positioning the candidate perfectly for this specific role without lying.",
  "technical_skills": ["List of languages, libraries, frameworks the candidate knows that align with the JD"],
  "tools_and_software": ["List of software, databases, tools from baseline"],
  "soft_skills": ["List of interpersonal/methodology skills relevant to the JD"],
  "experience": [
    {{
        "title": "Exact Role from baseline", 
        "company": "Exact Company from baseline", 
        "dates": "Exact Dates", 
        "bullets": ["Strongly rewritten bullet 1 integrating JD keywords", "Rewritten bullet 2", "Rewritten bullet 3"]
    }}
  ],
  "projects": [
    {{
        "title": "Project Name", 
        "tech_stack": "Technologies used", 
        "bullets": ["Action-oriented bullet 1", "Action-oriented bullet 2"]
    }}
  ],
  "education": [
    {{
        "degree": "Degree Name", 
        "institution": "University Name", 
        "dates": "Dates", 
        "details": "Grades/Honors"
    }}
  ],
  "certifications": ["Cert 1", "Cert 2"]
}}
"""


def call_groq_tailor(
    client: Groq,
    resume_text: str,
    jd_text: str,
    contact: dict,
    model: str = os.getenv("GROQ_MODEL_ID", "qwen3.6-27b"),
) -> tuple[TailoredResumeData, int]:
    
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(resume_text, jd_text, contact)},
        ],
        temperature=0.1, # 🟢 FIX: Lowered from 0.2 to 0.1 to strictly prevent hallucinations
    )

    raw = resp.choices[0].message.content or "{}"
    tokens = getattr(resp, "usage", None)
    tokens_used = (tokens.total_tokens if tokens else 0) or 0

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            raise ValueError("Model did not return JSON")
        payload = json.loads(m.group(0))

    data = TailoredResumeData(**payload)

    # Enforce strict limits per category to keep the ATS parser heavily targeted
    data.technical_skills = data.technical_skills[:12]
    data.tools_and_software = data.tools_and_software[:10]
    data.soft_skills = data.soft_skills[:6]

    return data, tokens_used


# ---------- ATS-safe PDF renderer (ReportLab, single-column) ----------------

def render_ats_pdf(data: TailoredResumeData) -> bytes:
    """
    Renders a strict single-column, standard-heading PDF that Workday/Taleo/Greenhouse
    and other ATS platforms can parse cleanly.

    Rules followed:
      - Single column, no tables/text-boxes
      - Standard section headings: Summary, Skills, Experience, Projects, Education, Certifications
      - Helvetica (universally embedded, treated as Arial by ATS parsers)
      - Plain bullets, no icons, no columns, no images
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        title=data.full_name or "Resume",
        author=data.full_name or "Candidate",
    )

    # -- Styles ------------------------------------------------------------
    name_style = ParagraphStyle(
        "Name", fontName="Helvetica-Bold", fontSize=18, alignment=TA_LEFT, spaceAfter=2, leading=22
    )
    contact_style = ParagraphStyle(
        "Contact", fontName="Helvetica", fontSize=10, alignment=TA_LEFT, spaceAfter=10, leading=13, textColor="#333333"
    )
    section_style = ParagraphStyle(
        "Section", fontName="Helvetica-Bold", fontSize=11.5, alignment=TA_LEFT,
        spaceBefore=10, spaceAfter=4, leading=14, textColor="#111111",
    )
    body_style = ParagraphStyle(
        "Body", fontName="Helvetica", fontSize=10, alignment=TA_LEFT, leading=13.5, spaceAfter=3
    )
    body_bold = ParagraphStyle(
        "BodyBold", fontName="Helvetica-Bold", fontSize=10.5, alignment=TA_LEFT, leading=14
    )
    body_italic = ParagraphStyle(
        "BodyIt", fontName="Helvetica-Oblique", fontSize=9.5, alignment=TA_LEFT, leading=12, textColor="#555555"
    )
    bullet_style = ParagraphStyle(
        "Bullet", fontName="Helvetica", fontSize=10, alignment=TA_LEFT, leading=13.5, leftIndent=0
    )

    def _hr():
        return Paragraph('<para><font color="#cccccc">' + ("_" * 200) + "</font></para>", body_style)

    def _section(title):
        return Paragraph(title.upper(), section_style)

    def _bullets(items):
        # Use ASCII hyphen bullets — every ATS parser (Workday, Taleo, Greenhouse,
        # Lever, Ashby) decodes these cleanly. Symbol-font bullets can be lost.
        return ListFlowable(
            [
                ListItem(
                    Paragraph(_esc(b), bullet_style),
                    leftIndent=12,
                    value="-",
                )
                for b in items if b.strip()
            ],
            bulletType="bullet",
            start="-",
            bulletFontName="Helvetica",
            bulletFontSize=10,
            leftIndent=14,
            bulletOffsetY=0,
        )

    story = []

    # -- Header ------------------------------------------------------------
    story.append(Paragraph(_esc(data.full_name or "Candidate"), name_style))

    contact_bits = []
    if data.email:    contact_bits.append(_esc(data.email))
    if data.phone:    contact_bits.append(_esc(data.phone))
    if data.location: contact_bits.append(_esc(data.location))
    if data.linkedin: contact_bits.append(_esc(data.linkedin))
    if data.github:   contact_bits.append(_esc(data.github))
    if contact_bits:
        story.append(Paragraph(" &nbsp;|&nbsp; ".join(contact_bits), contact_style))

    # -- Summary -----------------------------------------------------------
    if data.summary:
        story.append(_section("Summary"))
        story.append(Paragraph(_esc(data.summary), body_style))

    # -- Skills ------------------------------------------------------------
    if data.technical_skills or data.tools_and_software or data.soft_skills:
        story.append(_section("Skills & Technologies"))
        if data.technical_skills:
            story.append(Paragraph(f"<b>Technical Skills:</b> {', '.join(_esc(s) for s in data.technical_skills)}", body_style))
        if data.tools_and_software:
            story.append(Paragraph(f"<b>Tools & Software:</b> {', '.join(_esc(s) for s in data.tools_and_software)}", body_style))
        if data.soft_skills:
            story.append(Paragraph(f"<b>Soft Skills:</b> {', '.join(_esc(s) for s in data.soft_skills)}", body_style))
        story.append(Spacer(1, 4))

    # -- Experience --------------------------------------------------------
    if data.experience:
        story.append(_section("Experience"))
        for exp in data.experience:
            line = f"<b>{_esc(exp.title)}</b>"
            if exp.company:
                line += f" — {_esc(exp.company)}"
            story.append(Paragraph(line, body_bold))
            if exp.dates:
                story.append(Paragraph(_esc(exp.dates), body_italic))
            if exp.bullets:
                story.append(_bullets(exp.bullets))
            story.append(Spacer(1, 4))

    # -- Projects ----------------------------------------------------------
    if data.projects:
        story.append(_section("Projects"))
        for p in data.projects:
            head = f"<b>{_esc(p.title)}</b>"
            if p.tech_stack:
                head += f" <font color='#555555'>({_esc(p.tech_stack)})</font>"
            story.append(Paragraph(head, body_bold))
            if p.bullets:
                story.append(_bullets(p.bullets))
            story.append(Spacer(1, 4))

    # -- Education ---------------------------------------------------------
    if data.education:
        story.append(_section("Education"))
        for e in data.education:
            head = f"<b>{_esc(e.degree)}</b>"
            if e.institution:
                head += f" — {_esc(e.institution)}"
            story.append(Paragraph(head, body_bold))
            if e.dates or e.details:
                sub = " - ".join(x for x in [e.dates, e.details] if x)
                story.append(Paragraph(_esc(sub), body_italic))
            story.append(Spacer(1, 2))

    # -- Certifications ----------------------------------------------------
    if data.certifications:
        story.append(_section("Certifications"))
        story.append(_bullets([c for c in data.certifications if c]))

    doc.build(story)
    return buf.getvalue()


# ---------- Small helpers ---------------------------------------------------

_HTML_ESCAPE = {"&": "&amp;", "<": "&lt;", ">": "&gt;"}


def _esc(s: Optional[str]) -> str:
    if not s:
        return ""
    return "".join(_HTML_ESCAPE.get(c, c) for c in str(s))
