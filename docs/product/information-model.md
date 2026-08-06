# information-model.md

# Information Model

## Purpose

Describe what kinds of information PwPM manages, independent of physical database design.

---

## Investment

Stores:

* Identity
* Investment Type
* Ownership
* Acquisition Information
* Status

---

## Financing

Stores:

* Funding Source
* Loan Terms
* Outstanding Balance
* Interest Structure

---

## Transaction

Stores:

* Transaction Date
* Transaction Type
* Amount
* Currency
* Related Investment

---

## Reference Event

Stores:

* Event Date
* Event Type
* Description
* Supporting Evidence

---

## Valuation

Stores:

* Valuation Date
* Estimated Value
* Valuation Source
* Notes

---

## Performance Snapshot

Calculated information including:

* Current Value
* Invested Capital
* Outstanding Financing
* Equity
* Total Income
* Total Expense
* Cash Flow
* Investment Return

---

## Portfolio

Aggregated information including:

* Total Portfolio Value
* Total Financing
* Net Worth
* Portfolio Allocation
* Overall Cash Flow
* Performance Summary

---

## Information Principles

* Business data is immutable once recorded (corrections create new records where appropriate).
* Calculated information is reproducible.
* Reports never become source data.
* Historical information is preserved.
