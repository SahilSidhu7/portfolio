# Portfolio Redesign — Design Spec

Date: 2026-07-04
Goal: make sahilsidhu.pro impress recruiters — showcase projects, skills, certifications with a distinctive, polished visual design.

## Context

Current site: React 19 + Vite + Tailwind v4, dark purple theme, sections Navbar / Hero / AboutIntro / Skills / Certificates (image coverflow) / Projects / About-footer. Deployed behind Cloudflare with an embedded self-built RAG chatbot widget (pchat.webappster.store/static/embed.js) — a differentiator, keep it.

Problems:
- Generic template look (default purple glow cards, stock layout rhythm).
- Certificates shown as raw scanned images in a carousel — scores (AI-900 863/1000, AZ-900 957/1000, DP-900 790/1000, FSO Grade 5/5) invisible, which is the strongest signal.
- Two newest, most impressive projects (linkedin-showcase, job-hunt: TDD, 37 tests, live scraping) missing.
- Hero says only "software engineer" — no positioning, no proof points.
- Default system font; no typographic identity.

## Decisions

- **Stack unchanged**: React 19 + Vite + Tailwind v4. No new npm deps. Fonts via Google Fonts `<link>` in index.html.
- **Visual direction** (per frontend-design skill): refined dark theme, distinctive display typeface for headings, restrained accent, real typographic hierarchy, less glow-everywhere.
- **Content**:
  - Hero: "AI & Full-Stack Developer" positioning, one-line proof (ships end-to-end AI systems), stat row (3× Microsoft certified, FSO 5/5 Helsinki, 7 projects), CTAs: Resume / GitHub / LinkedIn.
  - Projects: 7 cards — 5 existing GitHub-linked + linkedin-showcase + job-hunt (no public repo yet → card without repo button, marked "in development"). Each: what it does, tech, outcome line.
  - Certifications: credential **cards with scores** (the headline), scanned image opens in modal on click. Microsoft ×3 + Full Stack Open series (5 parts) + DeepLearning.AI.
  - Skills: 4 groups matching resume — Languages / Frontend / Backend & AI / Cloud & DevOps.
  - About: student @ Chitkara (2028), what he builds, currently building Cricket AI Assistant.
  - Footer contact: email, GitHub, LinkedIn, resume.
- **Chatbot embed stays** in index.html; call it out in copy ("chat with my AI about this site").

## Components (all rewritten in place)

`index.css` (theme tokens + fonts), `Navbar.jsx`, `Hero.jsx`, `AboutIntro.jsx`, `skills.jsx`, `Projects.jsx`, `Certificates.jsx`, `About.jsx` (footer). `index.html` gets font links + meta description.

## Testing / verification

No test framework in repo (static content site) — verification = `npm run build` passes + visual check in browser at desktop and mobile widths.

## Out of scope

Deployment (user's Cloudflare setup), pushing linkedin-showcase/job-hunt repos, blog, analytics.
