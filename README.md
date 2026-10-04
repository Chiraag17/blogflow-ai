# BlogFlow AI — Autonomous Content Creation and Publishing Platform

**BlogFlow AI** is an AI-powered SaaS platform that automates the complete lifecycle of website blog creation: from website analysis and web topic research to content generation, SEO/quality auditing, human-in-the-loop editorial approval, and CMS publishing.

---

## 🌟 Architecture & Multi-Agent Intelligence (Part 2)

BlogFlow AI uses Google Gemini API and Tavily Search API organized into modular server-side agent services:

```
[Website Context Extraction]
          │
          ▼
┌─────────────────────────────────┐
│ Module 1: Website Analysis      │  ◄── Gemini analyzes HTML & brand voice
│ Establishes target persona & tone│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Module 2 & 3: Web Research Agent│  ◄── Tavily multi-source search
│ Multi-query deduplication & facts│  ◄── Gemini research synthesis
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Module 4: AI Blog Generation    │  ◄── Gemini generates outline, sections,
│ Drafts complete SEO-ready posts │      FAQs, meta tags, and full Markdown
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Module 5: SEO & Quality Agent   │  ◄── Grammar, readability, SEO audit,
│ Evaluates quality & fact claims │      and fact-checking consistency
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Module 6: AI Content Revision   │  ◄── 9 micro-actions: rewrite, expand,
│ Interactive diff & accept/reject│      shorten, change tone, improve hook
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 🛡️ Module 7: Human Approval      │  ◄── Mandatory human checkpoint
│ Approve, Request Changes, Reject│      (Direct publishing is blocked)
└────────────────┬────────────────┘
                 │
                 ▼ (Part 3 Phase)
┌─────────────────────────────────┐
│ WordPress CMS REST API Dispatch │  ◄── Only approved articles published
└─────────────────────────────────┘
```

---

## 📁 AI Service Architecture

The AI layer is structured into modular single-responsibility services:

```
services/
├── ai/
│   ├── gemini.service.ts          # Centralized Google Gen AI client with retry & JSON parsing
│   ├── prompt.service.ts          # Safe prompt templates with boundary tags (<research_data>)
│   └── output-validator.service.ts # XSS sanitization & structured JSON schema validation
├── research/
│   ├── tavily.service.ts          # Tavily search integration with URL deduplication
│   ├── research.service.ts        # 8-step Web Research Agent workflow & synthesis
│   ├── topic-discovery.service.ts # AI topic discovery based on website context
│   └── website-analysis.service.ts # SSRF-safe website content extractor & persona analysis
└── content/
    ├── blog-generation.service.ts # Multi-step blog generation with outline & schema FAQs
    ├── content-revision.service.ts # Targeted micro-revisions with before/after comparisons
    ├── quality-analysis.service.ts # Independent quality and fact-checking evaluation
    └── seo-analysis.service.ts    # Keyword density, SERP length limits, and heading structure
```

---

## ⚡ AI API Endpoints

- `POST /api/ai/analyze-website`: Extracts homepage content safely (SSRF-protected) and builds brand persona with Gemini.
- `POST /api/ai/discover-topics`: Formulates search queries, queries Tavily, and discovers structured blog topics.
- `POST /api/ai/research`: Executes multi-source web research with URL deduplication and synthesizes a verified research report.
- `POST /api/ai/generate-outline`: Generates a structured outline with section intents and key points.
- `POST /api/ai/generate-blog`: Multi-stage blog generation producing full Markdown, FAQs, and SEO metadata.
- `POST /api/ai/revise-content`: Targeted revisions (rewrite, expand, shorten, change tone, improve hook, optimize title/SEO).
- `POST /api/ai/analyze-quality`: Independent grammar, readability, SEO, content quality, and fact-checking audit.
- `POST /api/ai/analyze-seo`: Analyzes keyword density, H1/H2 hierarchy, meta title/description lengths, and internal links.
- `GET /api/ai/research/:id`: Retrieves saved research report by ID.
- `GET /api/ai/generation/:id`: Checks generation job status and progress.

---

## 🛡️ Security & Guardrails

1. **Server-Side API Calls**: All calls to Gemini and Tavily occur server-side in API routes and services. Keys are never transmitted to the browser.
2. **SSRF Defense**: `WebsiteAnalysisService` validates URLs and blocks requests to `localhost`, loopback IPs (`127.0.0.1`), private subnets (`10.x`, `192.168.x`, `172.x`), and internal domain names.
3. **Prompt Injection Defense**: Researched web data is isolated inside `<research_data>` tags and treated strictly as untrusted reference text.
4. **XSS Sanitization**: `OutputValidatorService` strips malicious tags (`<script>`, `<iframe>`, `javascript:`) before content is stored or rendered.
5. **Human Approval Mandate**: Direct publishing to CMS is strictly blocked until an article is vetted and approved by a human editor in the Approval Center.

---

## 🧪 Testing & Verification

Run the automated service and integration test suite:

```bash
node scripts/test-services.mjs
```

All 5 test suites verify:
- Output sanitization and XSS defense
- Tavily URL normalization and deduplication
- SEO keyword density and heading hierarchy metrics
- Unified Markdown assembly and word count/reading time calculations
- SSRF URL blocking for private and local hosts

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your API keys:
```bash
cp .env.example .env.local
```
Add your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
TAVILY_API_KEY=your_tavily_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

### 4. Build for Production
```bash
npm run build
npm run start
```
