# use-cases.md

# Use Cases

## Purpose

This document translates Business Stories into system capabilities.

Each use case represents a customer goal that PwPM must support.

The MVP focuses on enabling customers to register, maintain, evaluate and make decisions about their investments.

---

# UC-01 Register Investment

## Goal

Register a new investment in the platform.

Examples:

* Rental property
* Stock investment

### Outcome

The investment becomes part of the customer's portfolio.

---

# UC-02 Register Investment Financing

## Goal

Record how the investment was financed.

Examples:

* Personal capital
* Bank loan
* Margin loan (future)
* Multiple funding sources

### Outcome

The platform understands the investment's capital structure.

---

# UC-03 Record Financial Transaction

## Goal

Record any financial activity affecting the investment.

Examples:

Rental Property

* Rental income
* Loan principal payment
* Loan interest payment
* Maintenance expense
* Renovation expense

Equity Investment

* Buy shares
* Sell shares
* Dividend received
* Brokerage fee

### Outcome

Investment cash flow and financial position remain up to date.

---

# UC-04 Record Reference Event

## Goal

Record business events that change investment context but do not directly affect cash flow.

Examples:

Rental Property

* Property valuation updated
* Tenant changed
* Lease renewed
* Interest rate changed

Equity Investment

* Market valuation updated
* Stock split
* Company merger
* Corporate action

### Outcome

Historical context is preserved for analysis.

---

# UC-05 Evaluate Investment

## Goal

Automatically calculate investment performance.

Typical outputs include:

* Current Value
* Outstanding Financing
* Equity
* Cash Flow
* Investment Return
* Historical Performance

### Outcome

Customers understand the current financial health of each investment.

---

# UC-06 Portfolio Overview

## Goal

Provide a consolidated view across all investments.

Typical outputs include:

* Portfolio Value
* Portfolio Allocation
* Total Cash Flow
* Total Financing
* Net Worth
* Investment Distribution

### Outcome

Customers understand their portfolio as a whole.

---

# UC-07 Investment Decision Support

## Goal

Provide sufficient information for investment decisions.

Typical questions include:

* Should I continue holding?
* Should I sell?
* Should I inject more capital?
* Which investment performs best?
* Which investment requires attention?

PwPM provides facts, calculations and context.

Final investment decisions always belong to the customer.

---

# MVP Scope

The MVP intentionally excludes:

* Investment discovery
* Market recommendations
* AI investment advice
* Trading execution
* Bank integration
* Tax calculation
* Accounting workflows

The MVP focuses on helping customers understand and manage investments they already own.
