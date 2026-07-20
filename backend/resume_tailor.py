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
    skills: list[str] = Field(default_factory=list)
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

    # Coerce list fields (skills, certifications) whether the LLM gave string or list
    @field_validator("skills", "certifications", mode="before")
    @classmethod
    def _v_list(cls, v):
        return _coerce_str_list(v)

    # If experience / projects / education arrive as a dict (LLM sometimes wraps a single
    # item as an object instead of a list), promote it to a single-element list.
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
1. NO TECHNICAL HALLUCINATIONS: NEVER invent hard skills, tools, frameworks, or degrees the candidate does not have. (e.g., If JD wants "Kubernetes", do not add it unless it's in their baseline).
2. BRIDGE THE VOCABULARY GAP: You MUST rewrite bullet points and skill names to match the EXACT terminology used in the JD. If baseline says "data cleaning" and JD wants "Data Manipulation", rewrite it to "Data Manipulation".
3. EXTRACT INFERRED SKILLS: Add soft skills or broader conceptual skills (e.g., "Agile", "Cross-functional Collaboration", "Backend Development") to the skills list if the candidate's experience proves they possess them.
4. Prioritize bullets and skills that overlap with the target JD. Drop unrelated fluff. Every bullet must start with a strong action verb.
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
  "full_name": string,
  "email": string,
  "phone": string,
  "location": string,
  "linkedin": string,
  "github": string,
  "summary": "2-3 sentence professional summary tailored to this JD, using only facts from the baseline resume",
  "skills": ["8-15 comma-separated skills, prioritized by JD relevance, ALL must appear in the baseline resume"],
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
    """
    Runs the LLM once and returns the parsed, validated TailoredResumeData
    plus tokens_used (int).
    """
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

    # The prompt now controls semantic bridging without raw string-matching destruction.
    # We enforce a maximum limit of 15 skills to keep the ATS parser heavily targeted.
    data.skills = data.skills[:15]

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
    if data.skills:
        story.append(_section("Skills"))
        story.append(Paragraph(", ".join(_esc(s) for s in data.skills), body_style))

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
