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


_SYSTEM_PROMPT = """You are TruthHire's ATS Resume Tailor. Your job is to reframe a candidate's EXISTING resume for a specific job description to maximize ATS parseability and keyword matching.

STRICT LAWS (breaking any of these produces a bad answer):
1. NO TECHNICAL HALLUCINATIONS: NEVER invent hard skills, tools, frameworks, or degrees the candidate does not have.
2. CATEGORIZE SKILLS: Segregate the candidate's existing skills into exactly three categories: Technical Skills (languages, frameworks), Tools & Software (e.g., AWS, Git, Jira), and Soft Skills/Methodologies (e.g., Agile, Leadership).
3. RETAIN ALL PROJECTS AND EXPERIENCE: You MUST extract and include ALL projects and work experiences present in the baseline resume. Do not drop any project just to save space.
4. BRIDGE THE VOCABULARY GAP: Rewrite bullet points and skill names to match the EXACT terminology used in the JD without lying.
5. Output ONLY valid JSON matching the exact schema. No prose, no markdown formatting outside the JSON.
"""


def _build_user_prompt(resume_text: str, jd_text: str, contact: dict) -> str:
    return f"""### Candidate's baseline resume (source of truth — you may only use facts from here)
{resume_text[:6000]}

### Candidate contact info (use exactly as provided, do not modify)
name: {contact.get('name', '')}
email: {contact.get('email', '')}
phone: {contact.get('phone', '')}
location: {contact.get('location', '')}
linkedin: {contact.get('linkedin', '')}
github: {contact.get('github', '')}

### Target job description
{jd_text[:4000]}

### TASK
Return a single JSON object with this exact schema:
{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "summary": "2-3 sentence professional summary tailored to this JD",
  "technical_skills": ["Languages, libraries, and frameworks from baseline"],
  "tools_and_software": ["Software, platforms, and tools from baseline"],
  "soft_skills": ["Interpersonal and methodology skills from baseline"],
  "experience": [
    {{"title": "role", "company": "company", "dates": "MMM YYYY - MMM YYYY", "bullets": ["4-5 bullets, action-verb first, JD-aligned language"]}}
  ],
  "projects": [
    {{"title": "name", "tech_stack": "comma separated", "bullets": ["2-3 bullets"]}}
  ],
  "education": [
    {{"degree": "e.g. B.Tech Computer Science", "institution": "University", "dates": "2020-2024", "details": "CGPA / honors if in baseline"}}
  ],
  "certifications": ["Cert name — Issuer — Year"]
}}
"""


def call_groq_tailor(
    client: Groq,
    resume_text: str,
    jd_text: str,
    contact: dict,
    model: str = "llama-3.3-70b-versatile",
) -> tuple[TailoredResumeData, int]:
    
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(resume_text, jd_text, contact)},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
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


# ---------- ATS-safe PDF renderer (Overleaf/LaTeX Style) ----------------

def render_ats_pdf(data: TailoredResumeData) -> bytes:
    """
    Renders a strict single-column PDF that visually mimics the classic 
    "Jake's Resume" Overleaf LaTeX template, highly optimized for ATS.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title=data.full_name or "Resume",
        author=data.full_name or "Candidate",
    )

    # -- Overleaf-style Fonts (Times-Roman) -------------------------------
    name_style = ParagraphStyle(
        "Name", fontName="Times-Bold", fontSize=22, alignment=1, spaceAfter=4 # alignment=1 is Center
    )
    contact_style = ParagraphStyle(
        "Contact", fontName="Times-Roman", fontSize=10.5, alignment=1, spaceAfter=12
    )
    # Section headers: Bold, left-aligned, with a bottom border (simulated via HR)
    section_style = ParagraphStyle(
        "Section", fontName="Times-Bold", fontSize=12, alignment=TA_LEFT,
        spaceBefore=8, spaceAfter=2, textTransform="uppercase"
    )
    body_style = ParagraphStyle(
        "Body", fontName="Times-Roman", fontSize=10.5, alignment=TA_LEFT, leading=13, spaceAfter=2
    )
    # The trick for left/right alignment on the same line in ReportLab
    # We use a table for headers, but for simple text we can just bold the left part.
    item_header_style = ParagraphStyle(
        "ItemHeader", fontName="Times-Bold", fontSize=11, alignment=TA_LEFT, leading=14, spaceBefore=4
    )
    item_sub_style = ParagraphStyle(
        "ItemSub", fontName="Times-Italic", fontSize=10.5, alignment=TA_LEFT, leading=12, spaceAfter=2
    )
    bullet_style = ParagraphStyle(
        "Bullet", fontName="Times-Roman", fontSize=10.5, alignment=TA_LEFT, leading=13, leftIndent=0
    )

    def _hr():
        # Creates a solid black line under section headers
        return Paragraph('<para><font color="#000000">' + ("_" * 92) + "</font></para>", 
                         ParagraphStyle("HR", fontName="Times-Roman", fontSize=10, leading=2, spaceAfter=6))

    def _section(title):
        return [Paragraph(title.upper(), section_style), _hr()]

    def _bullets(items):
        # Uses a classic dot bullet point
        return ListFlowable(
            [
                ListItem(
                    Paragraph(_esc(b), bullet_style),
                    leftIndent=12,
                    value="•", # Standard solid bullet
                )
                for b in items if b.strip()
            ],
            bulletType="bullet",
            start="•",
            bulletFontName="Times-Roman",
            bulletFontSize=10,
            leftIndent=10,
            bulletOffsetY=1,
        )

    story = []

    # -- Header (Centered Name & Contact) ----------------------------------
    story.append(Paragraph(_esc(data.full_name or "Candidate"), name_style))

    contact_bits = []
    if data.phone:    contact_bits.append(_esc(data.phone))
    if data.email:    contact_bits.append(f'<a href="mailto:{_esc(data.email)}" color="blue">{_esc(data.email)}</a>')
    if data.linkedin: contact_bits.append(f'<a href="{_esc(data.linkedin)}" color="blue">LinkedIn</a>')
    if data.github:   contact_bits.append(f'<a href="{_esc(data.github)}" color="blue">GitHub</a>')
    if data.location: contact_bits.append(_esc(data.location))
    
    if contact_bits:
        story.append(Paragraph(" | ".join(contact_bits), contact_style))

    # -- Education ---------------------------------------------------------
    # In academic/Overleaf templates, Education often comes first for freshers
    if data.education:
        story.extend(_section("Education"))
        for e in data.education:
            # Main Line: University (Left) -- We just print linearly for ATS safety
            head = f"<b>{_esc(e.institution)}</b>"
            if e.dates: head += f" | {_esc(e.dates)}"
            story.append(Paragraph(head, item_header_style))
            
            # Sub Line: Degree (Left)
            sub = f"<i>{_esc(e.degree)}</i>"
            if e.details: sub += f" — {_esc(e.details)}"
            story.append(Paragraph(sub, item_sub_style))

    # -- Skills ------------------------------------------------------------
    if data.technical_skills or data.tools_and_software or data.soft_skills:
        story.extend(_section("Technical Skills"))
        if data.technical_skills:
            story.append(Paragraph(f"<b>Languages & Frameworks:</b> {', '.join(_esc(s) for s in data.technical_skills)}", body_style))
        if data.tools_and_software:
            story.append(Paragraph(f"<b>Developer Tools:</b> {', '.join(_esc(s) for s in data.tools_and_software)}", body_style))
        if data.soft_skills:
            story.append(Paragraph(f"<b>Methodologies:</b> {', '.join(_esc(s) for s in data.soft_skills)}", body_style))
        story.append(Spacer(1, 4))

    # -- Experience --------------------------------------------------------
    if data.experience:
        story.extend(_section("Experience"))
        for exp in data.experience:
            head = f"<b>{_esc(exp.title)}</b>"
            if exp.dates: head += f" | {_esc(exp.dates)}"
            story.append(Paragraph(head, item_header_style))
            
            if exp.company:
                story.append(Paragraph(f"<i>{_esc(exp.company)}</i>", item_sub_style))
                
            if exp.bullets:
                story.append(_bullets(exp.bullets))
            story.append(Spacer(1, 4))

    # -- Projects ----------------------------------------------------------
    if data.projects:
        story.extend(_section("Projects"))
        for p in data.projects:
            head = f"<b>{_esc(p.title)}</b>"
            if p.tech_stack:
                head += f" | <i>{_esc(p.tech_stack)}</i>"
            story.append(Paragraph(head, item_header_style))
            
            if p.bullets:
                story.append(_bullets(p.bullets))
            story.append(Spacer(1, 4))

    # -- Certifications ----------------------------------------------------
    if data.certifications:
        story.extend(_section("Certifications"))
        story.append(_bullets([c for c in data.certifications if c]))

    doc.build(story)
    return buf.getvalue()

# ---------- Small helpers ---------------------------------------------------

_HTML_ESCAPE = {"&": "&amp;", "<": "&lt;", ">": "&gt;"}


def _esc(s: Optional[str]) -> str:
    if not s:
        return ""
    return "".join(_HTML_ESCAPE.get(c, c) for c in str(s))
