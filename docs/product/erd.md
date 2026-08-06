# erd.md

# Entity Relationship Diagram (Conceptual)

```text
Customer
│
└──────────── Portfolio
                  │
                  │ 1..N
                  │
            Investment
              │
      ┌───────┼────────┬──────────┐
      │       │        │          │
      │       │        │          │
Transaction Financing Valuation ReferenceEvent
      │
      │
PerformanceSnapshot (Derived)
```

---

## Entity Overview

### Customer

Owns one or more portfolios.

---

### Portfolio

Logical grouping of investments.

---

### Investment

Represents a single investment.

Attributes include:

* Investment Type
* Status
* Acquisition Date

---

### Financing

Represents funding associated with an investment.

---

### Transaction

Stores financial activities.

---

### Valuation

Stores historical investment values.

---

### Reference Event

Stores contextual business events.

---

### Performance Snapshot

Represents derived financial metrics.

Snapshots are generated from business data and should not be manually edited.

---

## Design Principles

* One source of truth.
* Investment-centric architecture.
* Event-aware history.
* Calculation over duplication.
* Extensible to new investment types.
* Database schema follows business concepts rather than UI requirements.
