# constitution.md

# Product Constitution

> *This document defines the fundamental beliefs and immutable principles of the Personal Wealth & Portfolio Management (PwPM) platform. Every product, architecture, data model and implementation decision should align with this constitution.*

---

# 1. Purpose

PwPM exists to help individuals make better investment decisions.

The platform does not attempt to replace accountants, banks, tax software or ERP systems.

Instead, PwPM helps users understand their investments, evaluate their financial position and make investment decisions based on reliable information.

---

# 2. Primary User

PwPM is designed for:

> **Self-directed Individual Investors**

People who actively manage their own investments and financial decisions.

This includes individuals who own and operate private businesses as part of their personal investment portfolio.

PwPM is built to support the investor rather than the institution.

---

# 3. Product Belief

We believe that the quality of an investment decision depends on:

* The quality of available data.
* The completeness of financial context.
* The ability to understand how every decision impacts the overall investment portfolio.

The platform exists to improve decision quality rather than simply record information.

---

# 4. Core Domain

The core domain of PwPM is:

> **Investment**

Everything else exists to describe, support or evaluate an investment.

Assets, financing, transactions, valuations, reports and analytics are different perspectives of the same investment.

Investment is therefore the primary business concept of the platform.

---

# 5. Source of Truth

PwPM is a user-owned data platform.

The user owns and controls every piece of information stored in the system.

The platform does not require external integrations in order to function.

Data may be entered through:

* Manual input
* Structured forms
* Batch import templates

Future integrations may simplify data collection, but they never replace user ownership of data.

---

# 6. Financial Transactions vs Business Events

PwPM distinguishes two different concepts.

## Financial Transaction

A financial transaction changes money or financial position.

Examples:

* Purchase investment
* Receive rental income
* Receive dividend
* Pay loan principal
* Pay loan interest
* Capital contribution
* Investment disposal

Transactions are the foundation of financial analysis.

---

## Business Event

A business event changes investment context without necessarily changing cash flow.

Examples:

* Property valuation
* Tenant replacement
* Interest rate adjustment
* Property renovation completed
* Legal document updated
* Credit rating changed

Business Events provide context for analysis and future decisions.

Not every Business Event is a Financial Transaction.

Not every Financial Transaction requires a Business Event.

---

# 7. Product Boundary

PwPM is NOT:

* An ERP system
* Accounting software
* Tax filing software
* CRM
* Core Banking
* Trading platform
* Portfolio execution platform

PwPM complements these systems by helping users understand and evaluate their investments.

---

# 8. Platform Philosophy

PwPM is designed as a platform rather than a collection of independent features.

Every capability should be reusable across different investment types.

Adding a new investment type should primarily require new data rather than new architecture.

Investment types may evolve.

The platform should not.

---

# 9. Decision-first Philosophy

Recording data is not the objective.

Generating reports is not the objective.

The objective is to help users make better investment decisions.

Every capability should answer at least one investment question.

If a feature does not improve understanding or decision quality, it does not belong in PwPM.

---

# 10. Data Philosophy

Data is organized around business meaning rather than user interface.

Reports never become the source of truth.

Dashboards never own data.

Every report is generated from underlying business data.

A single source of truth must always exist.

---

# 11. Extensibility

PwPM must support multiple investment classes through a unified business model.

Examples include:

* Real Estate
* Stocks
* ETFs
* Mutual Funds
* Gold
* Cryptocurrency
* Private Business
* Deposits
* Bonds
* Future investment categories

Extensibility should come from the domain model rather than custom implementations.

---

# 12. Long-term Direction

PwPM aims to become the central platform where individuals understand, evaluate and continuously improve their investment portfolio.

The platform should evolve from investment recording to investment intelligence while remaining faithful to its core purpose:

> **Helping individuals make better investment decisions through better information.**
