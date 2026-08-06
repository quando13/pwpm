# README.md

# Personal Wealth & Portfolio Management (PwPM)

> **Understand your wealth. Make every investment decision with confidence.**

PwPM (Personal Wealth & Portfolio Management) is a platform that helps individuals digitize, manage and evaluate their investment portfolio.

The MVP focuses on **PiPM (Personal Investment & Portfolio Management)**, enabling investors to manage existing investments, monitor financial health and make better investment decisions.

---

# Product Vision

PwPM is **not**:

* Accounting Software
* ERP
* Tax Software
* Core Banking
* Trading Platform

PwPM is an **Investment Management Platform**.

Its mission is to help investors answer one question:

> **"Do I have enough information to make an investment decision today?"**

---

# MVP Scope

The first MVP supports two representative investment types:

## Rental Property

Examples:

* Apartment
* House
* Villa
* Office

Capabilities:

* Register investment
* Register financing
* Record rental income
* Record expenses
* Record loan payments
* Record valuation
* Analyze investment performance

---

## Equity Investment

Examples:

* Stocks

Capabilities:

* Register investment
* Record buy transactions
* Record sell transactions
* Record dividends
* Record valuation
* Analyze investment performance

---

# Product Workflow

```text
Register
      ↓
Maintain
      ↓
Evaluate
      ↓
Decide
```

Customers continuously maintain investment information.

PwPM automatically generates reports and investment insights.

---

# Project Structure

```text
pwpm/

├── apps/
│   └── web/
│
├── packages/
│   ├── ui/
│   ├── domain/
│   ├── shared/
│   └── utils/
│
├── docs/
│   ├── product/
│   │   ├── vision.md
│   │   ├── constitution.md
│   │   ├── customer-workflow.md
│   │   ├── business-stories.md
│   │   ├── use-cases.md
│   │   ├── ubiquitous-language.md
│   │   ├── domain-model.md
│   │   ├── information-model.md
│   │   ├── erd.md
│   │   ├── mvp-release-plan.md
│   │   ├── calculation-spec.md
│   │   └── screen-flow.md
│   └── technical/
│       ├── data-model.md
│       ├── architecture.md
│       └── security-rls.md
│
└── supabase/
```

---

# Technical Stack

## Frontend

* Next.js
* TypeScript
* TailwindCSS
* shadcn/ui
* TanStack Query

---

## Backend

* Supabase
* PostgreSQL
* Edge Functions

---

## Authentication

Supabase Auth

---

## Storage

Supabase Storage

---

## Database

PostgreSQL

Database schema follows business concepts rather than UI requirements.

---

# Core Business Concepts

The MVP centers around the following concepts:

* Portfolio
* Investment
* Financing
* Transaction
* Reference Event
* Valuation
* Performance Snapshot

Everything else is derived from these concepts.

---

# Development Principles

## Product First

Every feature should solve a real investment problem.

---

## Single Source of Truth

Business data is entered once.

Everything else is calculated.

---

## Evidence-driven Design

Business abstractions must be validated by real use cases.

Avoid speculative design.

---

## Investment-centric

Investment is the aggregate root of the domain.

---

## Extensible by Design

Adding a new investment type should require new business data rather than architectural changes.

---

# Development Roadmap

## Phase 1

Foundation

* Authentication
* Portfolio
* Investment
* Transactions
* Financing
* Valuation

---

## Phase 2

Analysis

* Cash Flow
* ROI
* Yield
* Equity
* Net Worth

---

## Phase 3

Portfolio

* Portfolio Dashboard
* Allocation
* Performance
* Historical Trends

---

## Phase 4

Decision Support

* What-if Analysis
* Exit Analysis
* Rebalancing
* Scenario Simulation

---

# Engineering Workflow

1. Understand the business story.
2. Identify the use case.
3. Update the domain model if necessary.
4. Design the data model.
5. Implement backend.
6. Implement frontend.
7. Validate against the business story.

Business requirements always take precedence over technical convenience.

---

# Definition of Done

A feature is complete only when:

* Business Story is satisfied.
* Use Case is completed.
* Data Model remains consistent.
* Reports are generated correctly.
* No duplicated source of truth is introduced.

---

# Long-term Vision

The MVP is the first step toward a comprehensive Personal Wealth Management Platform.

Future capabilities may include:

* Personal Finance Management
* AI-assisted Investment Analysis
* Goal-based Financial Planning
* Wealth Intelligence
* External Data Integrations

The architecture should allow these capabilities without changing the core business model.

---

# Philosophy

> **Capture Once. Reuse Everywhere.**

> **Investment Data Belongs to the Investor.**

> **Better Data. Better Decisions.**
