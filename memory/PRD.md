# TruthHire Portal — PRD

## Original Problem Statement
"Analyze our github repo... There is issue while uploading resume in profile page. Can you solve this problem and give me again."

Reported symptoms:
- Toast says "Failed to upload resume"
- Sometimes the resume uploads but never shows up on the profile

Failing environments: both **local** and **deployed** (Render backend + Vercel frontend).

## Architecture
- **Frontend**: Next.js 14 app (App Router), TypeScript, TailwindCSS. Deployed on Vercel.
- **Backend**: FastAPI (Python), SQLAlchemy ORM, PostgreSQL (Neon) in prod. Deployed on Render.
- **Storage**: Supabase Storage (bucket: `resumes`) for resume PDFs.
- **Auth**: JWT (custom) + Google OAuth.

## Bug Fix — Resume Upload (Jan 2026)

### Root causes identified in `backend/main.py`
1. **`load_dotenv()` was called AFTER Supabase client init.** `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` read as `None` in local dev → client creation failed → every upload returned 500.
2. **No `upsert` flag** in `supabase.storage.upload()` → re-uploads with a colliding random path threw `Duplicate` errors that surfaced as generic 500s.
3. **`get_public_url()` returns a URL with a trailing `?`** in `supabase-py` v2.x. The URL was saved to the DB and could break the "View Resume" link.
4. **Generic error message** ("Failed to upload resume to cloud storage") hid the actual Supabase error, making debugging on Render impossible.
5. **Filename edge cases**: no extension / uppercase / unsupported extension were not sanitized.
6. **No file-size validation** on backend — frontend claimed "Max 5MB" but backend accepted anything, causing large PDFs to be rejected at the Supabase edge with an opaque error.

### Fixes applied
`backend/main.py`
- Moved `load_dotenv()` to the top, before any `os.getenv()` calls.
- Guarded Supabase client init and set `supabase = None` on failure; endpoint returns a clear 500 if not configured.
- Added client-side + server-side 5 MB size cap.
- Added empty-file and missing-filename validation.
- Sanitized file extension (defaults to `pdf`, whitelist: pdf/doc/docx).
- Wider random range for unique filenames (8 hex digits).
- Added `"upsert": "true"` to `file_options` — re-uploads always succeed.
- Stripped trailing `?` from public URL before saving.
- Full traceback logged server-side; concise real error returned to client.
- `db.rollback()` on failure.

`app/profile/page.tsx`
- Client-side 5 MB validation before sending.
- Parses `detail`/`message` from server error JSON and shows it in the toast.
- Guards against server returning empty `url`.

### Verification (local, mocked Supabase)
7/7 tests passing:
1. Happy path — PDF uploads, DB updates, URL saved without trailing `?`.
2. User not found → 404.
3. Empty file → 400.
4. > 5 MB → 413.
5. Filename with no extension → defaults to `.pdf`, uploads OK.
6. DB row has correct `resume_filename` + `resume_uploaded_at`.
7. Supabase not configured → clear 500 error message.

## Deployment checklist for user
On **Render** (backend), confirm these env vars are set:
- `SUPABASE_URL` — from Supabase → Project Settings → API → Project URL
- `SUPABASE_SERVICE_KEY` — the **service_role** key (NOT anon key), same page
- `DATABASE_URL`, `GROQ_API_KEY`, `SECRET_KEY`, `RESEND_API_KEY`

In **Supabase** Storage, ensure:
- Bucket named exactly `resumes` exists
- Bucket is **Public** (or your `get_public_url` links won't work)
- File-size limit ≥ 5 MB

On **Vercel** (frontend), confirm:
- `NEXT_PUBLIC_API_URL` points to the backend (e.g. `https://truthhire-api.onrender.com`)

## Backlog / Future improvements
- P2: virus/malware scanning for uploaded PDFs (ClamAV or a hosted API).
- P2: DOCX support in the resume parser (already accepted for upload).
- P2: Migrate away from `random.randint` in filenames to `uuid4` (collision-proof).
- P2: Add integration test for resume upload in CI (mock Supabase).
- P2: Rate-limit `/users/{id}/resume` (currently unlimited).

## What's implemented (as of Jan 2026)
- Full profile page with resume upload + display (FIXED).
- Google OAuth + JWT auth flows.
- Recruiter portals + admin secure portal.
- Job feed, AI gap analysis (Groq), cold-outreach emails (Resend).
- **New brand identity applied site-wide** (Jan 2026):
  - Reusable `<Logo />` React component (`components/Logo.tsx`) with 3 variants: `icon`, `full`, `stacked`.
  - Inline SVG `<LogoMark />` (blue gradient pill + dot) — crisp at any size, no image request.
  - Favicon (`.ico` + PNG 16/32/192/512) + Apple touch icon.
  - OpenGraph / Twitter social preview card at `/brand/og-image.png`.
  - Updated `layout.tsx` metadata (icons + og:image).
  - Replaced legacy `<Shield /> TruthHire.` mark in: Navbar, Footer, /login, /signup, /recruiter/login, /recruiter/register.
