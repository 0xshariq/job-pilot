# JobPilot

JobPilot is a full-stack AI-powered job hunting assistant for technical professionals. It helps job seekers discover relevant roles, understand how well each role matches their experience, research companies, generate polished resumes, and keep their job search organized in one place.

The goal is simple: reduce the repetitive research and preparation work that happens before applying, while keeping the final decision and application under the user's control.

## What JobPilot Does

JobPilot turns a user's profile and resume into a personalized job-search workflow:

1. The user creates a profile with their experience, skills, preferred industries, experience level, and target roles.
2. The user can upload a resume PDF and optionally extract profile information from it.
3. The user searches for jobs by title and location through the Adzuna API.
4. Gemini evaluates each job against the user's profile and returns a match score, explanation, matched skills, and missing skills.
5. The user opens a job's detail page to review the description, requirements, salary, source, and application link.
6. The user can research the company using Browserbase and Stagehand, which browse public company pages and produce a structured research dossier.
7. The user can generate a polished resume from their profile and download it as a PDF.
8. Dashboard statistics, recent activity, and analytics help the user monitor their search.

JobPilot does not automatically submit applications. It helps the user make better decisions and prepare faster, while the user remains in control of every application.

## Core Features

### Personalized profile and resume management

- Profile fields for contact information, location, current title, experience level, skills, industries, education, work history, and target roles.
- Resume PDF upload and download.
- Optional AI-powered resume extraction for automatically filling profile fields.
- AI-generated professional summaries and achievement-focused work experience bullets.
- PDF resume generation from the current profile.

### Job discovery

- Search jobs by title and location.
- Retrieve listings from Adzuna.
- Store discovered jobs in the user's job inventory.
- Preserve useful job information such as company, location, salary, description, source, and application URL.
- Show Adzuna attribution on job listings.

### Gemini-powered job matching

Gemini compares each job with the user's profile and returns:

- A match score from 0 to 100.
- A concise explanation of the match.
- Skills found in both the profile and job description.
- Skills or qualifications that may be missing.

The score is a decision-support signal, not a guarantee that a job is suitable. Users can still review every discovered job, including lower-scoring roles.

### Company research

The company research flow uses Browserbase and Stagehand to inspect publicly available company pages. It can look for information across the company homepage, about pages, engineering pages, blogs, and other relevant links.

The resulting dossier can include:

- Company overview.
- Products or business focus.
- Technology and engineering signals.
- Culture and working style indicators.
- Why the role may exist.
- Interview preparation points.
- Source URLs used during research.

If a company has limited public information, JobPilot falls back to the job description and available company context instead of failing silently.

### Dashboard and analytics

The dashboard provides a high-level view of the search, including:

- Total jobs found.
- Average match rate.
- Companies researched.
- Jobs found this week.
- Recent activity.
- Job discovery and match analytics powered by PostHog.

## Application Pages

| Route | Purpose |
| --- | --- |
| `/` | Product homepage and introduction |
| `/login` | Authentication entry point |
| `/dashboard` | Search overview, activity, statistics, and analytics |
| `/find-jobs` | Job search controls, filters, sorting, and pagination |
| `/find-jobs/[id]` | Full job details, match breakdown, company research, and apply link |
| `/profile` | Profile editing and resume management |

## How the System Works

### 1. Profile data

Profile data is stored per user in InsForge. It is the source of truth for matching and resume generation. AI workflows can extract or generate content when explicitly requested, but ordinary job discovery and company research do not overwrite the user's profile.

### 2. Job search

The Find Jobs page sends the user's search terms to the server. The server calls Adzuna, normalizes the returned listings, and stores the relevant job data in InsForge.

### 3. Match scoring

The server sends the candidate profile and a bounded set of job details to Gemini. Structured output validation ensures the response contains the expected fields. If an AI response is unavailable or invalid, the application returns a safe fallback instead of exposing a broken request to the user.

### 4. Company research

When the user requests research, the server creates a Browserbase session and uses Stagehand to navigate public pages. Extracted content is then synthesized by Gemini into a structured dossier that is stored with the job record.

### 5. Resume generation

The user's profile is passed to Gemini with instructions to create a professional summary and rewrite work history into concise achievement-oriented bullets. The structured result is rendered into a downloadable PDF.

## Technology Stack

- **Next.js 16** with the App Router, server actions, and route handlers.
- **React 19** and **TypeScript**.
- **Tailwind CSS** and **shadcn/ui** for the interface.
- **Gemini** through the Vercel AI SDK and Google provider for structured generation and job matching.
- **InsForge** for authentication, PostgreSQL-backed data, and storage.
- **Adzuna** for job discovery.
- **Browserbase** for managed browser sessions.
- **Stagehand** for AI-assisted browser navigation and extraction.
- **PostHog** for product analytics and event tracking.
- **Zod** for validating AI-generated structured data.

## Environment Variables

Create a local environment file and configure the values for your own services. Do not commit secrets to the repository.

```env
NEXT_PUBLIC_INSFORGE_URL=
NEXT_PUBLIC_INSFORGE_ANON_KEY=

GOOGLE_GENERATIVE_AI_API_KEY=

ADZUNA_APP_ID=
ADZUNA_APP_KEY=

BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=

NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
```

## Local Development

### Prerequisites

- Node.js 20 or newer.
- pnpm, npm, or the package manager specified by the repository manifest.
- An InsForge project.
- Adzuna credentials for job search.
- A Google Gemini API key.
- Browserbase credentials for company research.
- PostHog credentials if analytics are enabled.

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Useful checks

```bash
pnpm lint
pnpm build
```

## Product Principles

- **User-controlled applications:** JobPilot supports research and preparation; it does not submit applications without an explicit user action.
- **Profile ownership:** AI workflows should not unexpectedly rewrite the user's canonical profile.
- **Explainable matching:** A score should be accompanied by reasons, matched skills, and missing skills.
- **Graceful degradation:** Missing company pages or temporary AI failures should produce useful fallbacks where possible.
- **Server-side secrets:** API credentials and provider keys must remain on the server.
- **Validated AI output:** Model responses should be treated as untrusted input and validated before persistence or rendering.

## Future Features

Potential future improvements include:

- Cover letter generation for a selected job.
- Job-specific resume tailoring with side-by-side change review.
- Saved searches and scheduled job discovery.
- Email or push notifications for strong matches.
- Job status tracking such as saved, applied, interviewing, offer, and rejected.
- Notes, reminders, and follow-up dates for each application.
- Duplicate detection across repeated searches.
- More job providers in addition to Adzuna.
- Improved salary normalization and location parsing.
- User-configurable matching preferences and scoring weights.
- Better research freshness indicators and source confidence labels.
- Company comparison views for shortlisted roles.
- Accessibility and mobile experience improvements.
- Exportable search reports and application history.
- Optional integrations with calendars, email, and external applicant tracking systems.
- Team or career-coach workspaces with explicit sharing permissions.

## Scope and Limitations

JobPilot currently focuses on discovery, matching, company research, resume preparation, and organization. It does not currently provide guaranteed job recommendations, scrape private accounts, bypass application protections, or submit applications automatically.

AI-generated scores and research are suggestions and may contain mistakes. Users should verify important details such as salary, location, eligibility, responsibilities, and application requirements on the original job or company website.

## Project Structure

```text
src/
├── actions/              Server actions for profile and application workflows
├── agent/                Company research and browser-agent logic
├── app/                  App Router pages and API routes
├── components/           Reusable UI components
├── lib/                  Auth, database, analytics, Adzuna, and Gemini helpers
└── types/                Shared TypeScript types
```

## Contributing

When adding a feature, keep provider credentials server-side, validate external and AI responses, scope database queries to the authenticated user, and update the relevant product documentation. Run lint and build checks before opening a pull request.

## License

This project is provided for development and learning purposes. Add the license that matches your intended distribution model before publishing or redistributing the code.
