# DealScope - Product Specification & Architecture Document

**Version:** 1.0
**Date:** February 2026
**Status:** Pre-Development

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas](#2-user-personas)
3. [Feature Specification](#3-feature-specification)
4. [Screen-by-Screen UX Flow](#4-screen-by-screen-ux-flow)
5. [Data Sources & APIs](#5-data-sources--apis)
6. [System Architecture](#6-system-architecture)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Scenario Engine](#9-scenario-engine)
10. [PDF Report Engine](#10-pdf-report-engine)
11. [Pricing & Monetization](#11-pricing--monetization)
12. [Security & Compliance](#12-security--compliance)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [Development Roadmap](#14-development-roadmap)
15. [Future Expansion](#15-future-expansion)

---

## 1. Product Vision

### 1.1 Problem Statement

Commercial real estate investors currently rely on:
- Manual spreadsheet analysis (error-prone, time-consuming)
- Expensive institutional tools ($500-$2,000/month) designed for large firms
- Fragmented data across dozens of county, state, and federal sources
- No unified tool that fetches data, runs scenarios, AND generates professional reports

### 1.2 Solution

DealScope is a commercial-grade property analysis platform that:
- **Guides** investors through deal analysis with step-by-step input screens
- **Fetches** data automatically from public and commercial sources
- **Analyzes** deals with institutional-quality financial modeling
- **Compares** multiple properties and scenarios side-by-side
- **Exports** professional PDF reports for lenders, partners, and personal records

### 1.3 Key Differentiators

| Competitor | Price | Gap DealScope Fills |
|-----------|-------|---------------------|
| Excel/Google Sheets | Free | No auto-data, no guided flow, error-prone formulas |
| DealCheck | $15-50/mo | Limited data fetch, no multi-scenario, basic reports |
| RealNex | $99-299/mo | Complex UI, enterprise-focused, no mobile |
| Argus | $500-2000/mo | Institutional only, overkill for small/mid investors |
| CoStar | $500+/mo | Data-only, no analysis engine, no deal modeling |

**DealScope target:** $0 (free tier) to $29-49/month (Pro) with 80% of institutional capability.

### 1.4 Product Principles

1. **Data-first**: Auto-fetch everything possible; never make the user Google for data
2. **Guided, not gated**: Step-by-step wizard, not a blank spreadsheet
3. **Scenario-obsessed**: Every deal should be modeled 3+ ways before a decision
4. **Mobile-native**: Full analysis capability on phone (agents in the field)
5. **Report-ready**: Every analysis exportable as a lender-grade PDF in one tap

---

## 2. User Personas

### 2.1 Primary: Independent Investor ("Solo Operator")

- **Profile**: Owns 1-10 properties, self-manages or uses small PM company
- **Budget**: $0-50/month for tools
- **Pain**: Manually building spreadsheets for every deal, missing comps, slow turnaround
- **Goal**: Analyze a deal in 15 minutes, not 2 hours
- **Usage**: 2-10 deals/month, mostly multifamily and small retail

### 2.2 Secondary: Real Estate Agent/Broker ("Deal Sourcer")

- **Profile**: Sources deals for investor clients, needs to present analysis quickly
- **Budget**: $20-50/month (business expense)
- **Pain**: Creating professional reports for clients, justifying offer prices
- **Goal**: Impress clients with data-backed analysis, close more deals
- **Usage**: 5-20 deals/month, needs branded PDF reports

### 2.3 Tertiary: Syndication Lead ("Capital Raiser")

- **Profile**: Raises capital from passive investors, needs institutional-grade underwriting
- **Budget**: $50-100/month
- **Pain**: Investor decks require detailed proformas, sensitivity analysis, IRR projections
- **Goal**: Generate investor-ready packages with 5-year projections
- **Usage**: 1-5 serious analyses/month, heavy scenario modeling

---

## 3. Feature Specification

### 3.1 MVP Features (Phase 1)

#### 3.1.1 Deal Input Wizard

Step-by-step guided input with smart defaults and validation.

**Step 1: Property Basics**
- Address (auto-complete via Google Places API)
- Property type: Multifamily (MVP), Retail, Office, Industrial (future)
- Number of units
- Total building sqft
- Lot size
- Year built
- Asking price
- MLS # (optional)
- Property photos (upload or URL)

**Step 2: Auto-Data Fetch**
After address entry, auto-fetch and display:
- Property tax (county assessor)
- Assessed value / market value
- Last sale date and price
- Zoning information
- Flood zone status
- Neighborhood demographics (Census)
- Area median income
- Nearby employment anchors
- School ratings
- Walk score / transit score

User can accept, override, or supplement any auto-fetched value.

**Step 3: Unit Mix & Rent Roll**
- Per-unit entry: unit #, beds, baths, sqft, current rent, market rent, lease expiration, status (occupied/vacant)
- Bulk entry mode: "10 units, all 1-bed/1-bath at $615/month"
- Auto-fetch rent comps for the area (by bed/bath count)
- Other income: laundry, parking, storage, utility pass-through, pet fees, application fees

**Step 4: Operating Expenses**
Guided line-by-line with smart defaults based on property type, age, and location:

| Expense Category | Default Estimation Method |
|-----------------|--------------------------|
| Property Tax | Auto-fetched from county records |
| Insurance | $400-600/unit/year (adjustable by age, location) |
| Utilities (landlord-paid) | Based on heating type, climate zone, unit count |
| Water/Sewer | $300-500/unit/year (regional adjustment) |
| Trash/Recycling | $200-350/unit/year |
| Property Management | 8-12% of EGI (slider) |
| Repairs & Maintenance | $500-1,000/unit/year (age-adjusted) |
| CapEx Reserves | $250-500/unit/year |
| Landscaping | $50-150/unit/year |
| Legal/Accounting | $500-2,000/year flat |
| Advertising/Marketing | $500-1,500/year flat |
| Common Area Electric | $100-200/unit/year |

Each line shows: auto-estimate, user override, and the basis for the estimate.

"Quick Mode": Enter total expenses as a % of gross income (50% rule, etc.)
"Detailed Mode": Line-by-line entry with smart defaults

**Step 5: Financing**
Multiple financing structures in one analysis:

| Structure | Fields |
|-----------|--------|
| Conventional | Down %, rate, term, amortization, closing costs, points |
| Seller Financing | Down %, rate, term, balloon date, amortization |
| Cash Purchase | Total cash, closing costs |
| FHA/Agency (future) | LTV, DSCR requirements, rate, MIP |
| Assumable Loan | Existing balance, rate, remaining term + supplemental |
| BRRRR | Purchase + rehab costs, ARV, refi terms |

Default: auto-populate current 30-year commercial rate from FRED API.

**Step 6: Value-Add Assumptions (Optional)**
- Rent increase timeline: month-by-month or annual
- Renovation budget per unit
- Utility pass-through implementation
- Vacancy improvement timeline
- Expense reduction targets

**Step 7: Results Dashboard**
One-page summary showing:
- Purchase metrics: price/unit, price/sqft, GRM
- Income: current vs. stabilized
- Expenses: low/mid/high ranges
- NOI & Cap Rate: current and stabilized
- Financing: monthly debt service, cash flow, DSCR
- Returns: Cash-on-Cash, CoC (stabilized), Equity Multiple, IRR (5-year)
- Comparison to market benchmarks

#### 3.1.2 Scenario Engine

Run multiple scenarios on any deal:

**Quick Scenarios (one-click):**
- "What if I pay $X instead of $Y?" (price sensitivity)
- "What if rates are 0.5% higher/lower?"
- "What if vacancy is 10% instead of 5%?"
- "What if rents grow 3% per year?"

**Advanced Scenarios:**
- Full override of any input variable
- Side-by-side comparison (up to 4 scenarios)
- Sensitivity matrix: vary 2 inputs simultaneously (e.g., price vs. rate)

**Seller Financing vs. Conventional:**
- Compare monthly cash flow, total interest paid, equity build
- Balloon payment analysis with refi assumptions

#### 3.1.3 PDF Report Generator

Professional branded report including:
- Cover page with property photo and key metrics
- Property summary table
- Rent comparables with source citations
- Expense build-up (low/mid/high)
- NOI & cap rate analysis (current + stabilized)
- Financing analysis
- Cash flow projections (1-year and 5-year)
- Scenario comparison (if multiple scenarios run)
- Strengths & risks (auto-generated based on data)
- Appendix: data sources and methodology

White-label option (Pro tier): custom logo, company name, contact info.

#### 3.1.4 Deal Dashboard

- List all saved analyses
- Sort by: date, cap rate, cash-on-cash, price, location
- Tag/folder system for organization
- Quick comparison: select 2-4 deals for side-by-side metrics
- Deal status: Analyzing, Offered, Under Contract, Closed, Passed

#### 3.1.5 User Accounts & Auth

- Email/password registration
- Google Sign-In
- Apple Sign-In
- Profile: name, company, phone, logo (for reports)
- Usage tracking for freemium limits

### 3.2 Phase 2 Features

- **Market Heat Maps**: Visualize cap rates, rent growth, price/unit by zip code
- **Deal Alerts**: Set criteria, get notified when matching listings appear
- **Team Collaboration**: Share analyses with partners, add notes/comments
- **Lender Matching**: Connect with lenders based on deal type and size
- **Historical Tracking**: Track actual performance vs. projections post-purchase
- **Portfolio Dashboard**: Aggregate view of all owned properties
- **AI Insights**: GPT-powered natural language deal summary and risk flags
- **Rent Comp Engine**: Deep comp analysis with adjustment methodology

### 3.3 Phase 3 Features (Asset Type Expansion)

- **Retail**: NNN lease analysis, tenant credit analysis, CAM reconciliation
- **Office**: Lease rollover analysis, tenant improvement allowances, free rent
- **Industrial/Warehouse**: Clear height, dock doors, specialized expense modeling
- **Mixed-Use**: Blended analysis across residential + commercial components
- **Self-Storage**: Per-unit revenue modeling, occupancy ramp
- **Mobile Home Parks**: Lot rent vs. park-owned home analysis

---

## 4. Screen-by-Screen UX Flow

### 4.1 Onboarding Flow

```
Splash Screen
  |
Sign Up / Sign In (Email, Google, Apple)
  |
Welcome Screen: "What type of investor are you?"
  [ ] Individual investor
  [ ] Real estate agent/broker
  [ ] Syndicator / fund manager
  |
Quick Tour (3 swipeable screens)
  1. "Enter any address and we'll fetch the data"
  2. "Run scenarios to find the right price"
  3. "Export professional reports in one tap"
  |
Dashboard (empty state with CTA: "Analyze Your First Deal")
```

### 4.2 New Analysis Flow

```
[+] New Analysis
  |
Step 1: PROPERTY INFO
  - Address field (Google Places autocomplete)
  - Property type selector: [Multifamily] [Retail] [Office] [Industrial]
  - Quick fields: Units, Asking Price
  - [Auto-Fetch Data] button
  |
Step 2: AUTO-FETCH RESULTS
  - Shows fetched data with green checkmarks
  - "Found" items: tax, assessed value, last sale, zoning, demographics
  - "Not found" items with manual entry fields
  - User confirms or overrides each value
  |
Step 3: RENT ROLL
  - Toggle: [Quick Entry] vs [Detailed Entry]
  - Quick: "X units at $Y/month, Z% occupied"
  - Detailed: Per-unit table with beds/baths/rent/status
  - Auto-fetched rent comps shown alongside for reference
  - Other income section (pass-through, laundry, parking, etc.)
  |
Step 4: EXPENSES
  - Toggle: [Quick Mode (% of income)] vs [Detailed Mode]
  - Quick: Single slider 35%-70% with NOI preview
  - Detailed: Line-by-line with auto-estimates and override fields
  - Each line shows: [Auto-estimate] [Your Value] [Basis/Source]
  - Running NOI total at bottom
  |
Step 5: FINANCING
  - Financing type tabs: [Conventional] [Seller Finance] [Cash] [Custom]
  - Auto-populated current rate from FRED
  - Down payment %, rate, term, amortization
  - Closing costs estimate
  - [Add Another Financing Scenario] button
  |
Step 6: RESULTS
  - Key metrics cards at top: Cap Rate | CoC Return | Monthly CF | DSCR
  - Income breakdown (pie chart)
  - Expense breakdown (bar chart)
  - Cash flow waterfall: Gross -> Vacancy -> Expenses -> NOI -> Debt -> Cash Flow
  - 5-year projection table
  - [Run Scenario] [Export PDF] [Save Deal] buttons
  |
Step 7: SCENARIOS (optional)
  - "What-if" sliders: price, rate, vacancy, rent growth, expense ratio
  - Side-by-side comparison cards
  - Sensitivity matrix (price vs. rate grid)
```

### 4.3 Dashboard

```
DASHBOARD
  |
  +-- Active Analyses (cards with key metrics)
  |     - Property photo/map thumbnail
  |     - Address, units, price
  |     - Cap rate, CoC, monthly cash flow
  |     - Status badge: [Analyzing] [Offered] [Under Contract] [Passed]
  |     - Last updated date
  |
  +-- Quick Actions
  |     [+ New Analysis] [Compare Deals] [Export All]
  |
  +-- Filters
  |     By: status, property type, location, date range
  |
  +-- Sort
        By: date, cap rate, CoC, price, cash flow
```

### 4.4 Deal Comparison Screen

```
COMPARE DEALS (2-4 properties side by side)
  |
  +-- Property photos and addresses
  +-- Key Metrics Row: Price, $/Unit, Cap Rate, CoC, DSCR, Monthly CF
  +-- Income Comparison
  +-- Expense Comparison
  +-- Financing Comparison
  +-- 5-Year IRR Comparison
  +-- [Winner Badge] auto-highlighted on best metric per row
  +-- [Export Comparison PDF]
```

### 4.5 Settings Screen

```
SETTINGS
  |
  +-- Profile (name, email, company, logo upload)
  +-- Subscription (current plan, upgrade CTA)
  +-- Default Assumptions
  |     - Default expense ratio
  |     - Default vacancy rate
  |     - Default CapEx reserve $/unit
  |     - Default management fee %
  |     - Preferred financing terms
  +-- Report Branding (Pro)
  |     - Company logo
  |     - Company name, address, phone
  |     - Custom colors
  +-- Data Preferences
  |     - Preferred comp sources
  |     - Auto-fetch on/off
  +-- Notifications
  +-- Support / Feedback
```

---

## 5. Data Sources & APIs

### 5.1 Free Sources (MVP)

| Data Type | Source | Method | Rate Limit |
|-----------|--------|--------|-----------|
| **Property Tax & Assessed Value** | County Assessor Websites | Web scraping (per county) | Varies |
| **Interest Rates** | FRED API (Federal Reserve) | REST API (free key) | 120 req/min |
| **Demographics** | Census Bureau API | REST API (free key) | 500 req/day |
| **Fair Market Rents** | HUD FMR API | REST API (free) | Unlimited |
| **Employment Data** | BLS API | REST API (free key) | 500 req/day |
| **CPI / Inflation** | FRED API | REST API (free key) | 120 req/min |
| **Geocoding** | Google Maps (free tier) | REST API | 40K req/month free |
| **Address Autocomplete** | Google Places API | REST API | $2.83/1K requests |
| **Flood Zones** | FEMA NFHL API | REST API (free) | Unlimited |
| **Zoning** | Municipal GIS Portals | Web scraping (per city) | Varies |
| **School Ratings** | GreatSchools API | REST API (free tier) | 200 req/day |
| **Walk Score** | Walk Score API | REST API (free <5K/day) | 5,000 req/day |
| **Rent Estimates** | HUD FMR + Census | Calculated from public data | N/A |
| **Property Sales History** | County Recorder | Web scraping | Varies |

### 5.2 Paid Sources (Phase 2)

| Data Type | Source | Cost | Value Add |
|-----------|--------|------|-----------|
| **Property Details + AVM** | ATTOM Data | ~$200-500/mo | Instant property details, automated valuation |
| **Rent Comps** | Rentometer API | ~$50-100/mo | Accurate rent comps by bed/bath/location |
| **Sales Comps** | ATTOM / DataTree | ~$200-500/mo | Recent sales with $/unit, cap rates |
| **Building Permits** | ATTOM | Included | Renovation history, red flags |
| **Crime Data** | CrimeMapping API | ~$50/mo | Risk scoring for neighborhoods |
| **Market Analytics** | CoStar (enterprise) | $500+/mo | Institutional-grade market data |
| **Property Photos** | Google Street View | ~$7/1K requests | Auto-fetch property images |

### 5.3 County Scraping Strategy

County assessor data is the richest free source but requires per-county scrapers.

**MVP Strategy (Top 50 Markets):**
1. Build a scraper framework with pluggable county adapters
2. Prioritize top 50 MSAs by investment volume
3. Each adapter handles: property search, tax data, assessed value, sales history
4. Cache results for 30 days (data doesn't change frequently)
5. Fallback to user manual entry when county isn't supported

**Scaling Strategy:**
- Track which counties users request most
- Build adapters demand-driven
- Eventually replace with ATTOM API for nationwide coverage

### 5.4 Data Freshness

| Data Type | Refresh Frequency | Cache Duration |
|-----------|-------------------|----------------|
| Property Tax | Annual (county reassessment cycle) | 90 days |
| Interest Rates | Daily | 1 day |
| Rent Comps | Monthly | 30 days |
| Demographics | Annual (Census ACS) | 180 days |
| Fair Market Rents | Annual (HUD release) | 365 days |
| Employment | Monthly (BLS release) | 30 days |

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
+--------------------------------------------------+
|                   CLIENTS                         |
|                                                   |
|  +----------+  +----------+  +----------------+  |
|  | iOS App  |  | Android  |  | Web App        |  |
|  | (Expo)   |  | (Expo)   |  | (Next.js/Expo) |  |
|  +----+-----+  +----+-----+  +-------+--------+  |
|       |              |                |            |
+--------------------------------------------------+
        |              |                |
        v              v                v
+--------------------------------------------------+
|              API GATEWAY (AWS)                    |
|         Rate limiting, auth, routing              |
+--------------------------------------------------+
        |
        v
+--------------------------------------------------+
|              BACKEND SERVICES (AWS Lambda)        |
|                                                   |
|  +-------------+  +-------------+  +-----------+ |
|  | Auth        |  | Analysis    |  | Data      | |
|  | Service     |  | Service     |  | Fetch     | |
|  | (Cognito)   |  | (CRUD +     |  | Service   | |
|  |             |  |  Calc)      |  | (Scrapers)| |
|  +-------------+  +-------------+  +-----------+ |
|                                                   |
|  +-------------+  +-------------+  +-----------+ |
|  | PDF         |  | Scenario    |  | Billing   | |
|  | Generator   |  | Engine      |  | Service   | |
|  | Service     |  |             |  | (Stripe)  | |
|  +-------------+  +-------------+  +-----------+ |
+--------------------------------------------------+
        |
        v
+--------------------------------------------------+
|              DATA LAYER                           |
|                                                   |
|  +-------------+  +-------------+  +-----------+ |
|  | DynamoDB    |  | S3          |  | ElastiCache| |
|  | (Users,     |  | (PDFs,      |  | (Redis -   | |
|  |  Analyses,  |  |  Photos,    |  |  Data      | |
|  |  Scenarios) |  |  Exports)   |  |  Cache)    | |
|  +-------------+  +-------------+  +-----------+ |
+--------------------------------------------------+
        |
        v
+--------------------------------------------------+
|              EXTERNAL DATA SOURCES                |
|                                                   |
|  County Assessors | FRED | Census | HUD | BLS    |
|  Google Maps | FEMA | Walk Score | GreatSchools   |
|  (Phase 2: ATTOM | Rentometer | CoStar)          |
+--------------------------------------------------+
```

### 6.2 Technology Stack Detail

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile** | Expo (React Native) | One codebase for iOS + Android + Web |
| **Web** | Next.js 14+ (App Router) | SSR for marketing pages, shared components with mobile |
| **State Management** | Zustand + React Query | Lightweight, excellent for async data fetching |
| **UI Components** | Tamagui or NativeWind | Cross-platform styling (mobile + web) |
| **Charts** | Victory Native / Recharts | Cross-platform charting for financial data |
| **Auth** | AWS Cognito | Built-in Email + Google + Apple, JWT tokens |
| **API** | AWS API Gateway + Lambda | Serverless, pay-per-use, auto-scaling |
| **Backend Language** | TypeScript (Node.js) | Same language as frontend, shared types |
| **Database** | DynamoDB | Serverless, single-table design, scales to zero |
| **File Storage** | S3 | PDFs, property photos, report assets |
| **Caching** | ElastiCache (Redis) | Cache fetched data (tax, rents, demographics) |
| **PDF Generation** | Puppeteer on Lambda | HTML-to-PDF with full styling control |
| **Payments** | Stripe | Industry standard, supports subscriptions |
| **Email** | AWS SES | Transactional emails (receipts, reports, alerts) |
| **Monitoring** | CloudWatch + Sentry | Error tracking, performance monitoring |
| **CI/CD** | GitHub Actions | Automated testing, build, deploy |
| **IaC** | AWS CDK (TypeScript) | Infrastructure as code, reproducible environments |

### 6.3 Monorepo Structure

```
dealscope/
+-- apps/
|   +-- mobile/              # Expo app (iOS + Android + Web)
|   |   +-- app/             # File-based routing (Expo Router)
|   |   |   +-- (auth)/      # Auth screens (login, signup)
|   |   |   +-- (tabs)/      # Main tab navigation
|   |   |   |   +-- dashboard/
|   |   |   |   +-- analyze/
|   |   |   |   +-- compare/
|   |   |   |   +-- settings/
|   |   |   +-- analysis/     # Analysis wizard screens
|   |   |       +-- [id]/
|   |   |       +-- new/
|   |   +-- components/       # Shared UI components
|   |   +-- hooks/            # Custom hooks
|   |   +-- stores/           # Zustand stores
|   |   +-- utils/            # Helpers, formatters
|   |
|   +-- web/                  # Next.js marketing site
|       +-- app/              # Landing page, pricing, docs
|       +-- components/
|
+-- packages/
|   +-- core/                 # Shared business logic
|   |   +-- calculations/     # NOI, cap rate, IRR, cash flow
|   |   +-- types/            # TypeScript interfaces
|   |   +-- validation/       # Input validation schemas
|   |   +-- constants/        # Default values, expense benchmarks
|   |
|   +-- api-client/           # Typed API client (shared by apps)
|   +-- ui/                   # Shared UI component library
|
+-- services/
|   +-- api/                  # Lambda functions
|   |   +-- analysis/         # CRUD for analyses
|   |   +-- data-fetch/       # External data fetching
|   |   +-- scenarios/        # Scenario engine
|   |   +-- pdf/              # PDF generation
|   |   +-- billing/          # Stripe webhooks
|   |
|   +-- scrapers/             # County assessor scrapers
|   |   +-- framework/        # Base scraper class
|   |   +-- adapters/         # Per-county adapters
|   |   |   +-- montgomery-oh/
|   |   |   +-- franklin-oh/
|   |   |   +-- hamilton-oh/
|   |   |   +-- ... (top 50 counties)
|   |
|   +-- infra/                # AWS CDK infrastructure
|       +-- stacks/
|           +-- auth.ts
|           +-- api.ts
|           +-- database.ts
|           +-- storage.ts
|
+-- docs/                     # Documentation
+-- package.json              # Monorepo root (pnpm workspaces)
+-- turbo.json                # Turborepo config
```

---

## 7. Database Schema

### 7.1 DynamoDB Single-Table Design

**Table: `dealscope-main`**

| Entity | PK | SK | Attributes |
|--------|-----|-----|-----------|
| User | `USER#<userId>` | `PROFILE` | email, name, company, logo, plan, analysisCount, createdAt |
| Analysis | `USER#<userId>` | `ANALYSIS#<analysisId>` | property, rentRoll, expenses, financing, results, status, createdAt, updatedAt |
| Scenario | `USER#<userId>` | `SCENARIO#<analysisId>#<scenarioId>` | name, overrides, results, createdAt |
| DataCache | `CACHE#<type>#<location>` | `<cacheKey>` | data, fetchedAt, expiresAt, source |
| Subscription | `USER#<userId>` | `SUBSCRIPTION` | stripeCustomerId, plan, status, currentPeriodEnd |

**GSI-1: By Analysis Status**
- PK: `USER#<userId>`, SK: `STATUS#<status>#<createdAt>`
- Purpose: Query analyses by status (Analyzing, Offered, etc.)

**GSI-2: By Location**
- PK: `STATE#<state>`, SK: `CITY#<city>#<analysisId>`
- Purpose: Aggregate analytics, market-level queries

### 7.2 Core Data Models

```typescript
// Property basics
interface Property {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    lat: number;
    lng: number;
  };
  type: 'multifamily' | 'retail' | 'office' | 'industrial' | 'mixed';
  units: number;
  buildingSqft: number;
  lotSqft: number;
  yearBuilt: number;
  askingPrice: number;
  mlsNumber?: string;
  photos: string[];  // S3 URLs
  heating: string;
  cooling: string;
  roofAge?: number;
  renovatedUnits?: number;
  parkingSpaces?: number;
}

// Individual unit in rent roll
interface Unit {
  unitNumber: string;
  beds: number;
  baths: number;
  sqft: number;
  currentRent: number;
  marketRent: number;
  leaseExpiration?: string;  // ISO date
  status: 'occupied' | 'vacant' | 'down';
  tenantType?: 'market' | 'section8' | 'corporate';
}

// Rent roll summary
interface RentRoll {
  units: Unit[];
  occupancyRate: number;        // calculated
  grossPotentialRent: number;   // calculated
  vacancyLoss: number;          // calculated
  effectiveRentalIncome: number;// calculated
  otherIncome: {
    utilityPassThrough: { perUnit: number; unitsParticipating: number; };
    laundry: number;
    parking: number;
    storage: number;
    petFees: number;
    other: number;
  };
  effectiveGrossIncome: number; // calculated
}

// Operating expenses
interface Expenses {
  mode: 'quick' | 'detailed';
  quickPercentage?: number;  // % of EGI (quick mode)
  detailed?: {
    propertyTax: { amount: number; source: 'auto' | 'manual'; };
    insurance: { amount: number; source: 'auto' | 'manual'; };
    utilities: {
      gas: { amount: number; source: 'auto' | 'manual'; };
      water: { amount: number; source: 'auto' | 'manual'; };
      sewer: { amount: number; source: 'auto' | 'manual'; };
      trash: { amount: number; source: 'auto' | 'manual'; };
      electric: { amount: number; source: 'auto' | 'manual'; };
    };
    management: { percentage: number; amount: number; };
    maintenance: { amount: number; perUnit: number; };
    capex: { amount: number; perUnit: number; };
    landscaping: { amount: number; };
    legal: { amount: number; };
    advertising: { amount: number; };
    other: { description: string; amount: number; }[];
  };
  totalExpenses: number;       // calculated
  expenseRatio: number;        // calculated (% of EGI)
  lowEstimate: number;         // calculated (-15%)
  highEstimate: number;        // calculated (+15%)
}

// Financing terms
interface Financing {
  type: 'conventional' | 'seller' | 'cash' | 'fha' | 'assumable' | 'brrrr';
  purchasePrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;   // calculated
  loanAmount: number;          // calculated
  interestRate: number;
  loanTerm: number;            // years
  amortization: number;        // years
  balloonDate?: number;        // years (seller finance)
  closingCosts: number;
  points: number;
  monthlyPayment: number;      // calculated (P&I)
  annualDebtService: number;   // calculated
  // Seller finance specific
  sellerCarryback?: {
    amount: number;
    rate: number;
    term: number;
    balloon: number;
  };
}

// Calculated results
interface AnalysisResults {
  // Purchase metrics
  pricePerUnit: number;
  pricePerSqft: number;
  grossRentMultiplier: number;

  // Income
  effectiveGrossIncome: number;

  // Expenses (3 scenarios)
  expenses: {
    low: number;
    mid: number;
    high: number;
  };

  // NOI (3 scenarios)
  noi: {
    low: number;
    mid: number;
    high: number;
  };

  // Returns
  capRate: { low: number; mid: number; high: number; };
  cashFlow: { monthly: number; annual: number; };
  cashOnCash: number;
  dscr: number;
  breakEvenOccupancy: number;
  onePercentRule: number;       // monthly rent / price

  // Stabilized (if value-add assumptions provided)
  stabilized?: {
    egi: number;
    noi: { low: number; mid: number; high: number; };
    capRate: { low: number; mid: number; high: number; };
    cashOnCash: number;
  };

  // 5-year projection
  fiveYearProjection: YearProjection[];

  // Market context
  marketCapRate?: number;
  marketRentPerUnit?: number;
  areaMedianIncome?: number;
}

interface YearProjection {
  year: number;
  grossIncome: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  loanBalance: number;
  equity: number;
  totalReturn: number;  // cash flow + equity build + appreciation
}

// Scenario override
interface Scenario {
  id: string;
  name: string;
  baseAnalysisId: string;
  overrides: Partial<{
    askingPrice: number;
    occupancyRate: number;
    rentGrowthRate: number;
    expenseGrowthRate: number;
    interestRate: number;
    downPaymentPercent: number;
    exitCapRate: number;
    holdPeriod: number;
    vacancyRate: number;
    managementFee: number;
    renovationBudget: number;
  }>;
  results: AnalysisResults;
}
```

---

## 8. API Design

### 8.1 REST Endpoints

```
Auth (AWS Cognito handles directly):
  POST   /auth/signup
  POST   /auth/login
  POST   /auth/google
  POST   /auth/apple
  POST   /auth/refresh
  POST   /auth/forgot-password

Analyses:
  GET    /analyses                   # List user's analyses
  POST   /analyses                   # Create new analysis
  GET    /analyses/:id               # Get analysis details
  PUT    /analyses/:id               # Update analysis
  DELETE /analyses/:id               # Delete analysis
  POST   /analyses/:id/calculate     # Recalculate results
  POST   /analyses/:id/pdf           # Generate PDF report
  GET    /analyses/:id/pdf           # Download PDF

Scenarios:
  GET    /analyses/:id/scenarios            # List scenarios
  POST   /analyses/:id/scenarios            # Create scenario
  PUT    /analyses/:id/scenarios/:sid       # Update scenario
  DELETE /analyses/:id/scenarios/:sid       # Delete scenario
  POST   /analyses/:id/scenarios/compare    # Compare scenarios

Data Fetch:
  POST   /data/property-lookup       # Fetch property data by address
  GET    /data/rent-comps            # Fetch rent comparables
  GET    /data/interest-rates        # Current rates from FRED
  GET    /data/demographics          # Census data for location
  GET    /data/fair-market-rent      # HUD FMR for area
  GET    /data/flood-zone            # FEMA flood zone check
  GET    /data/walk-score            # Walk Score for address

Billing:
  GET    /billing/subscription       # Current subscription
  POST   /billing/checkout           # Create Stripe checkout session
  POST   /billing/portal             # Stripe customer portal
  POST   /billing/webhook            # Stripe webhook handler

User:
  GET    /user/profile               # Get profile
  PUT    /user/profile               # Update profile
  PUT    /user/preferences           # Update default assumptions
  POST   /user/logo                  # Upload company logo
```

### 8.2 Request/Response Examples

**POST /analyses** (Create Analysis)
```json
{
  "property": {
    "address": {
      "street": "2620 N Gettysburg Avenue",
      "city": "Dayton",
      "state": "OH",
      "zip": "45406"
    },
    "type": "multifamily",
    "units": 10,
    "askingPrice": 450000,
    "buildingSqft": 5986,
    "yearBuilt": 1965
  },
  "autoFetch": true
}
```

**Response:**
```json
{
  "id": "a1b2c3d4",
  "status": "draft",
  "property": { ... },
  "fetchedData": {
    "propertyTax": { "amount": 7100, "source": "montgomery-county-oh", "year": 2025 },
    "assessedValue": { "amount": 157500, "source": "montgomery-county-oh" },
    "lastSale": { "date": "2022-03-15", "price": 320000 },
    "floodZone": { "zone": "X", "risk": "minimal" },
    "walkScore": 42,
    "demographics": {
      "medianIncome": 34200,
      "population": 137644,
      "medianAge": 33.1
    },
    "fairMarketRent": { "oneBed": 752, "twoBed": 921 },
    "interestRate": { "thirtyYear": 6.875, "source": "FRED", "date": "2026-02-19" }
  },
  "createdAt": "2026-02-19T14:30:00Z"
}
```

---

## 9. Scenario Engine

### 9.1 Calculation Pipeline

All financial calculations live in `packages/core/calculations/` and are shared between frontend (instant preview) and backend (authoritative results).

```
Input -> Validation -> Income Calc -> Expense Calc -> NOI Calc ->
  Financing Calc -> Returns Calc -> Projection Calc -> Results
```

### 9.2 Core Calculations

```typescript
// packages/core/calculations/

// 1. Income
function calculateIncome(rentRoll: RentRoll): IncomeResult {
  grossPotentialRent = sum(units.map(u => u.currentRent * 12))
  vacancyLoss = grossPotentialRent * (1 - occupancyRate)
  effectiveRentalIncome = grossPotentialRent - vacancyLoss
  otherIncome = passThrough + laundry + parking + storage + petFees
  effectiveGrossIncome = effectiveRentalIncome + otherIncome
}

// 2. Expenses (with low/mid/high ranges)
function calculateExpenses(expenses: Expenses, egi: number): ExpenseResult {
  if (mode === 'quick') {
    mid = egi * quickPercentage
    low = mid * 0.85
    high = mid * 1.15
  } else {
    mid = sum(all line items)
    low = mid * 0.85  // or per-line low estimates
    high = mid * 1.15  // or per-line high estimates
  }
}

// 3. NOI
function calculateNOI(egi: number, expenses: ExpenseResult): NOIResult {
  noi = { low: egi - expenses.high, mid: egi - expenses.mid, high: egi - expenses.low }
}

// 4. Financing
function calculateFinancing(financing: Financing): FinancingResult {
  monthlyPayment = PMT(rate/12, amortization*12, loanAmount)
  annualDebtService = monthlyPayment * 12
  // Handle seller finance with balloon
  if (type === 'seller' && balloon) {
    balloonBalance = FV(rate/12, balloon*12, monthlyPayment, -loanAmount)
  }
}

// 5. Returns
function calculateReturns(noi: NOIResult, financing: FinancingResult, price: number): ReturnsResult {
  capRate = noi / price
  cashFlow = noi - annualDebtService
  cashOnCash = cashFlow / totalCashInvested
  dscr = noi / annualDebtService
  breakEvenOccupancy = (expenses + debtService) / grossPotentialRent
  onePercentRule = (monthlyRent / price) * 100
}

// 6. Multi-Year Projection
function calculateProjection(
  baseIncome: number,
  baseExpenses: number,
  financing: FinancingResult,
  assumptions: {
    rentGrowth: number,      // annual %
    expenseGrowth: number,   // annual %
    appreciation: number,    // annual %
  },
  holdPeriod: number
): YearProjection[] {
  for each year 1..holdPeriod:
    income = baseIncome * (1 + rentGrowth)^year
    expenses = baseExpenses * (1 + expenseGrowth)^year
    noi = income - expenses
    debtService = annualDebtService (constant)
    cashFlow = noi - debtService
    loanBalance = remaining balance at year end
    propertyValue = price * (1 + appreciation)^year
    equity = propertyValue - loanBalance
    totalReturn = cumulativeCashFlow + equity - initialInvestment
}

// 7. IRR Calculation
function calculateIRR(
  initialInvestment: number,  // negative (cash out)
  annualCashFlows: number[],  // positive (cash in)
  exitProceeds: number        // sale price - loan balance - selling costs
): number {
  // Newton-Raphson method to solve for IRR
  cashFlows = [-initialInvestment, ...annualCashFlows.slice(0, -1),
               annualCashFlows[last] + exitProceeds]
  return IRR(cashFlows)
}

// 8. Sensitivity Matrix
function sensitivityMatrix(
  analysis: Analysis,
  variable1: { name: string, range: number[] },  // e.g., price: [380K, 400K, 420K, 440K, 450K]
  variable2: { name: string, range: number[] },  // e.g., rate: [6.0, 6.5, 7.0, 7.5, 8.0]
  metric: 'capRate' | 'cashOnCash' | 'irr' | 'dscr' | 'monthlyCashFlow'
): number[][] {
  // Generate matrix[v1.length][v2.length] of the chosen metric
}
```

### 9.3 Seller Financing Module

```typescript
interface SellerFinancingScenario {
  // Purchase
  purchasePrice: number;

  // Seller carry
  sellerDownPayment: number;          // what you pay seller upfront
  sellerLoanAmount: number;           // seller carries this
  sellerRate: number;                 // typically below market
  sellerTerm: number;                 // years
  sellerAmortization: number;         // years (may differ from term)
  sellerBalloonYears?: number;        // balloon payment due date

  // Bank financing (if blended)
  bankLoanAmount?: number;
  bankRate?: number;
  bankTerm?: number;
  bankAmortization?: number;

  // Comparison outputs
  totalMonthlyPayment: number;        // seller + bank combined
  effectiveBlendedRate: number;       // weighted average rate
  totalInterestPaid: number;          // over full term
  balloonAmount?: number;             // amount due at balloon
  refiAssumptions?: {                 // what happens at balloon
    newRate: number;
    newTerm: number;
    estimatedPropertyValue: number;   // for LTV check
  };
}
```

---

## 10. PDF Report Engine

### 10.1 Report Sections

| Section | Content | Page(s) |
|---------|---------|---------|
| Cover | Property photo, address, key metrics, analyst info, date | 1 |
| Executive Summary | 5-line deal summary, verdict, recommended offer | 1 |
| Property Overview | Address, type, units, year, sqft, features, map | 1 |
| Market Context | Demographics, employment, median income, rent trends | 1 |
| Rent Analysis | Current rent roll, market comps, occupancy, other income | 1 |
| Expense Analysis | Line-by-line build-up, low/mid/high, expense ratio, chart | 1 |
| Financial Analysis | NOI, cap rate, cash flow waterfall (3 scenarios) | 1 |
| Financing | Loan terms, debt service, DSCR, seller finance comparison | 1 |
| Returns | CoC, IRR, equity multiple, 5-year projection table + chart | 1 |
| Scenario Comparison | Side-by-side scenario metrics, sensitivity matrix | 1 |
| Risk Assessment | Auto-generated strengths and risks based on data | 1 |
| Appendix | Data sources, methodology, disclaimers | 1 |

Total: ~10-12 pages per report.

### 10.2 Implementation

PDF generation via Puppeteer on AWS Lambda:

1. Build HTML report using React components (same components as in-app views)
2. Render HTML to PDF via Puppeteer (headless Chrome on Lambda)
3. Store PDF in S3 with signed URL
4. Return download link to client

**Why Puppeteer over library-based PDF:**
- Full CSS support (charts, tables, colors render perfectly)
- Same React components for screen and print
- Charts render as they appear in the app
- Easier to maintain than low-level PDF libraries

### 10.3 White-Label (Pro Feature)

Pro users can customize:
- Company logo (header of every page)
- Company name, address, phone (cover page + footer)
- Primary brand color (headers, accents)
- Custom disclaimer text

---

## 11. Pricing & Monetization

### 11.1 Tier Structure

| Feature | Free | Pro ($29/mo) | Team ($49/mo) |
|---------|------|-------------|---------------|
| Analyses per month | 2 | Unlimited | Unlimited |
| Scenarios per analysis | 2 | Unlimited | Unlimited |
| PDF exports | Watermarked | Clean / branded | Branded + custom |
| Saved analyses | 5 max | Unlimited | Unlimited |
| Auto-data fetch | Basic (tax, rate) | Full (all sources) | Full + priority |
| 5-year projection | No | Yes | Yes |
| IRR calculation | No | Yes | Yes |
| Sensitivity matrix | No | Yes | Yes |
| Seller financing | Basic | Advanced | Advanced |
| Deal comparison | 2 deals | 4 deals | Unlimited |
| Report branding | No | Yes | Yes |
| Team members | 1 | 1 | Up to 5 |
| Priority support | No | Email | Email + chat |
| API access | No | No | Yes |

### 11.2 Revenue Projections (Conservative)

| Month | Free Users | Pro Users | Team Users | MRR |
|-------|-----------|-----------|-----------|-----|
| 3 | 200 | 10 | 2 | $388 |
| 6 | 800 | 40 | 8 | $1,552 |
| 12 | 2,500 | 150 | 30 | $5,820 |
| 18 | 5,000 | 400 | 80 | $15,520 |
| 24 | 10,000 | 800 | 200 | $33,000 |

Assumptions: 5% free-to-Pro conversion, 1% free-to-Team conversion.

### 11.3 Cost Structure

| Cost | Monthly (Early) | Monthly (Scale) | Notes |
|------|----------------|-----------------|-------|
| AWS Lambda | ~$5 | ~$50 | Pay per invocation |
| DynamoDB | ~$5 | ~$25 | On-demand pricing |
| S3 | ~$2 | ~$15 | PDF storage |
| ElastiCache | ~$15 | ~$50 | Smallest Redis instance |
| Cognito | Free | Free | First 50K MAU free |
| Google Maps | ~$50 | ~$200 | Geocoding + Places |
| Stripe fees | 2.9% + $0.30 | 2.9% + $0.30 | Per transaction |
| Domain + DNS | ~$15 | ~$15 | Route 53 |
| **Total** | **~$92** | **~$355** | Scales with usage |

Breakeven: ~4 Pro subscribers cover early infrastructure costs.

---

## 12. Security & Compliance

### 12.1 Authentication & Authorization

- AWS Cognito manages all auth flows (signup, login, MFA, password reset)
- JWT tokens with 1-hour expiration, refresh tokens for 30 days
- API Gateway validates JWT on every request
- Row-level security: users can only access their own analyses (PK = USER#userId)

### 12.2 Data Security

- All data encrypted at rest (DynamoDB, S3 use AWS-managed encryption)
- All data encrypted in transit (HTTPS/TLS 1.3 everywhere)
- No PII stored beyond email, name, company (no SSN, bank accounts, etc.)
- S3 PDFs use signed URLs with 24-hour expiration
- User-uploaded photos scanned for malware before storage

### 12.3 Privacy

- GDPR-ready: data export and deletion endpoints
- No selling of user data to third parties
- Analytics: anonymized usage metrics only (Mixpanel or PostHog)
- Cookie consent banner for web (required for EU users)
- Privacy policy and terms of service required at signup

### 12.4 Rate Limiting

| Endpoint | Free Tier | Pro Tier |
|----------|----------|----------|
| Data fetch | 10/hour | 60/hour |
| PDF generation | 2/day | 50/day |
| Analysis CRUD | 20/hour | 200/hour |
| Scenario runs | 10/hour | 100/hour |

### 12.5 Compliance

- Apple App Store: Apple Sign-In required (implemented)
- Google Play: Privacy policy link required
- Stripe PCI compliance: Stripe handles all card data (no PCI scope for us)
- SOC 2: Not required initially; consider at $50K+ MRR

---

## 13. Infrastructure & Deployment

### 13.1 AWS Architecture

```
Route 53 (DNS)
  |
  +-- dealscope.com -> CloudFront -> S3 (Next.js static export)
  +-- app.dealscope.com -> CloudFront -> S3 (Expo web build)
  +-- api.dealscope.com -> API Gateway -> Lambda functions
  |
  +-- Cognito User Pool (auth)
  +-- DynamoDB (database)
  +-- S3 (file storage: PDFs, photos, assets)
  +-- ElastiCache Redis (data cache)
  +-- SES (transactional email)
  +-- CloudWatch (monitoring, logging)
  +-- WAF (web application firewall on API Gateway)
```

### 13.2 Environments

| Environment | Purpose | AWS Account |
|-------------|---------|-------------|
| dev | Development & testing | Shared |
| staging | Pre-production, QA | Shared |
| prod | Production | Dedicated |

### 13.3 CI/CD Pipeline

```
GitHub Push
  |
  +-- Lint + Type Check (all packages)
  +-- Unit Tests (core calculations, API handlers)
  +-- Integration Tests (API + DynamoDB local)
  |
  +-- Build
  |   +-- Expo build (iOS + Android + Web)
  |   +-- Next.js build (marketing site)
  |   +-- Lambda package
  |
  +-- Deploy (environment-specific)
      +-- dev: auto-deploy on push to `dev` branch
      +-- staging: auto-deploy on push to `main` branch
      +-- prod: manual approval + deploy on tag
```

### 13.4 Mobile Deployment

| Platform | Distribution | Process |
|----------|-------------|---------|
| iOS | App Store | EAS Build -> TestFlight -> App Store Review -> Release |
| Android | Google Play | EAS Build -> Internal Testing -> Production |
| Web | CloudFront | Expo web export -> S3 -> CloudFront invalidation |

---

## 14. Development Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Project Setup**
- [ ] Initialize monorepo (pnpm + Turborepo)
- [ ] Set up Expo app with file-based routing
- [ ] Set up Next.js marketing site skeleton
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up AWS CDK infrastructure (Cognito, DynamoDB, S3, API Gateway)
- [ ] Implement auth flow (Email + Google + Apple)

**Week 2: Core Calculations**
- [ ] Build `packages/core/calculations/` module
- [ ] Income calculator (GPR, vacancy, EGI)
- [ ] Expense calculator (quick mode + detailed mode, low/mid/high)
- [ ] NOI & cap rate calculator
- [ ] Financing calculator (conventional + seller finance + cash)
- [ ] Returns calculator (CoC, DSCR, break-even, 1% rule)
- [ ] 100% unit test coverage on all calculations

**Week 3: Deal Input Wizard**
- [ ] Step 1: Property basics screen (address autocomplete, type, units, price)
- [ ] Step 2: Auto-data fetch screen (integrate FRED for rates, basic property lookup)
- [ ] Step 3: Rent roll screen (quick + detailed entry modes)
- [ ] Step 4: Expenses screen (quick % + detailed line-by-line)
- [ ] Step 5: Financing screen (conventional + seller finance tabs)
- [ ] Step 6: Results dashboard screen
- [ ] Wizard navigation with progress bar and save/resume

**Week 4: Backend API**
- [ ] Lambda functions for analysis CRUD
- [ ] Data fetch service (FRED rates, Census demographics, HUD FMR)
- [ ] API Gateway setup with Cognito authorizer
- [ ] DynamoDB integration with single-table design
- [ ] Basic error handling and logging

### Phase 2: Data & Polish (Weeks 5-8)

**Week 5: Data Fetching**
- [ ] County assessor scraper framework
- [ ] First 5 county adapters (Montgomery OH, Franklin OH, Hamilton OH + 2 major markets)
- [ ] FEMA flood zone integration
- [ ] Walk Score integration
- [ ] GreatSchools integration
- [ ] Redis caching layer for fetched data

**Week 6: Scenario Engine**
- [ ] Quick scenario sliders (price, rate, vacancy, rent growth)
- [ ] Full scenario creation with overrides
- [ ] Side-by-side comparison view (up to 4 scenarios)
- [ ] Sensitivity matrix (2-variable grid)
- [ ] 5-year projection table and chart

**Week 7: PDF Reports**
- [ ] Puppeteer Lambda setup
- [ ] Report template (all 12 sections)
- [ ] S3 storage with signed URLs
- [ ] PDF download flow in app
- [ ] White-label branding (Pro feature)

**Week 8: Dashboard & UX**
- [ ] Deal dashboard with cards, search, sort, filter
- [ ] Deal status management (Analyzing, Offered, Under Contract, etc.)
- [ ] Deal comparison screen
- [ ] Settings screen (profile, defaults, branding)
- [ ] Freemium gating (usage counter, upgrade prompts)
- [ ] Loading states, error states, empty states
- [ ] Responsive design polish (phone, tablet, desktop)

### Phase 3: Monetization & Launch (Weeks 9-12)

**Week 9: Payments**
- [ ] Stripe integration (checkout, subscriptions, webhooks)
- [ ] Free/Pro/Team tier enforcement
- [ ] Usage tracking and limits
- [ ] Billing portal (manage subscription, invoices)
- [ ] Upgrade/downgrade flows

**Week 10: Marketing Site**
- [ ] Landing page with hero, features, pricing, testimonials
- [ ] SEO optimization (property analysis keywords)
- [ ] Blog skeleton (for content marketing)
- [ ] Help center / documentation
- [ ] Contact form

**Week 11: Testing & QA**
- [ ] End-to-end testing (Detox for mobile, Playwright for web)
- [ ] Load testing (API Gateway + Lambda)
- [ ] Security audit (OWASP top 10 check)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Cross-device testing (iPhone, Android, tablet)
- [ ] Beta testing with 10-20 real users

**Week 12: Launch**
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)
- [ ] Production deployment
- [ ] Monitoring and alerting setup
- [ ] Launch announcement (Product Hunt, BiggerPockets, Reddit)
- [ ] Analytics tracking (Mixpanel/PostHog)

### Phase 4: Growth (Weeks 13-24)

- Expand county scrapers to top 50 markets
- Add ATTOM API integration (paid data tier)
- Rent comp engine with adjustments
- AI-powered deal summary and risk flags
- Team collaboration features
- Market heat maps
- Deal alerts (matching criteria notifications)
- Portfolio dashboard (post-purchase tracking)
- Retail asset type expansion
- Office asset type expansion

---

## 15. Future Expansion

### 15.1 Asset Type Roadmap

| Phase | Asset Type | Timeline | Key Additions |
|-------|-----------|----------|---------------|
| MVP | Multifamily (5-50 units) | Launch | Rent roll, unit mix, utility pass-through |
| 2 | Small Multifamily (2-4 units) | Month 4 | House hack analysis, FHA financing |
| 3 | Retail (NNN) | Month 6 | Lease abstracts, CAM, tenant credit |
| 4 | Retail (Gross/Modified Gross) | Month 7 | Expense stops, base year, escalations |
| 5 | Office | Month 9 | TI allowances, free rent, lease rollover |
| 6 | Industrial/Warehouse | Month 10 | Clear height, dock doors, yard space |
| 7 | Mixed-Use | Month 12 | Blended residential + commercial |
| 8 | Self-Storage | Month 14 | Per-unit revenue, occupancy ramp |
| 9 | Mobile Home Parks | Month 16 | Lot rent, POH analysis, utility billing |

### 15.2 Advanced Features Roadmap

| Feature | Timeline | Value |
|---------|----------|-------|
| AI Deal Scorer | Month 4 | Auto-grade deals A/B/C/D based on risk-return |
| Lender Matching | Month 6 | Connect with lenders by deal type/size |
| Investor Portal | Month 8 | Share analysis packages with passive investors |
| 1031 Exchange Tracker | Month 10 | Timeline management, replacement property matching |
| Depreciation Calculator | Month 10 | Cost segregation estimates, tax impact |
| Comparable Sales Database | Month 12 | Aggregate all user-entered deal data (anonymized) |
| Market Reports | Month 14 | Auto-generated quarterly market reports by MSA |
| API for Partners | Month 16 | Let brokerages embed DealScope analysis |

### 15.3 Data Source Expansion

| Source | Timeline | Data Provided |
|--------|----------|--------------|
| ATTOM Data | Month 4 | Property details, AVM, sales history, permits |
| Rentometer | Month 4 | Accurate rent comps by bed/bath |
| CoStar (if budget allows) | Month 8 | Institutional-grade market analytics |
| Yardi Matrix | Month 10 | Multifamily market data, rent trends |
| US Postal Service | Month 6 | Vacancy rates (address validation) |
| IRS SOI Data | Month 8 | Income tax statistics by zip code |
| NMHC Data | Month 12 | Apartment market surveys |

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **NOI** | Net Operating Income = EGI - Operating Expenses |
| **Cap Rate** | Capitalization Rate = NOI / Purchase Price |
| **CoC** | Cash-on-Cash Return = Annual Cash Flow / Total Cash Invested |
| **DSCR** | Debt Service Coverage Ratio = NOI / Annual Debt Service |
| **EGI** | Effective Gross Income = Rental Income - Vacancy + Other Income |
| **GRM** | Gross Rent Multiplier = Purchase Price / Annual Gross Rent |
| **IRR** | Internal Rate of Return (annualized return including all cash flows) |
| **AVM** | Automated Valuation Model (algorithmic property value estimate) |
| **NNN** | Triple Net Lease (tenant pays taxes, insurance, maintenance) |
| **CAM** | Common Area Maintenance charges |
| **TI** | Tenant Improvement allowance |
| **1% Rule** | Monthly rent should be >= 1% of purchase price |
| **50% Rule** | Operating expenses typically ~50% of gross income |
| **BRRRR** | Buy, Rehab, Rent, Refinance, Repeat strategy |
| **FMR** | Fair Market Rent (HUD-defined benchmark) |

## Appendix B: Competitive Analysis

| Feature | DealScope | DealCheck | RealNex | Argus | Excel |
|---------|-----------|-----------|---------|-------|-------|
| Price | $0-49/mo | $15-50/mo | $99-299/mo | $500+/mo | Free |
| Mobile app | Yes | Yes | No | No | Limited |
| Auto-data fetch | Yes | Limited | Yes | Yes | No |
| Scenario modeling | Advanced | Basic | Advanced | Advanced | Manual |
| PDF reports | Branded | Basic | Branded | Advanced | Manual |
| Seller financing | Yes | Basic | Yes | Yes | Manual |
| Sensitivity matrix | Yes | No | Yes | Yes | Manual |
| 5-year projection | Yes | Basic | Yes | Yes | Manual |
| IRR calculation | Yes | Pro only | Yes | Yes | Formula |
| Multi-asset type | Expanding | Yes | Yes | Yes | Manual |
| Deal comparison | Yes | Basic | Yes | Yes | Manual |
| Learning curve | Low | Low | High | Very High | Medium |
| County data fetch | Yes | No | No | No | No |
| Team collaboration | Yes (Team) | No | Yes | Yes | Cloud only |

---

*End of Product Specification*
*DealScope v1.0 - February 2026*
