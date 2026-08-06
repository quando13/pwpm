# domain-model.md

# Domain Model

## Core Domain

The core business concept of PwPM is **Investment**.

Everything else either describes, finances, measures or evaluates an investment.

---

## Core Entities

### Investment

Represents a single investment owned by the customer.

---

### Portfolio

Groups investments belonging to one customer.

---

### Transaction

Represents financial activities affecting an investment.

---

### Reference Event

Represents contextual events affecting investment analysis.

---

### Financing

Represents funding sources associated with an investment.

---

### Valuation

Represents the estimated value of an investment at a point in time.

---

### Performance Snapshot

Represents calculated financial metrics derived from transactions, financing and valuation.

---

## Domain Relationships

```text
Portfolio
    │
    ├──── Investment
              │
              ├──── Transaction
              ├──── Financing
              ├──── Valuation
              ├──── Reference Event
              │
              └──── Performance Snapshot
```

---

## Domain Principles

* Investment is the aggregate root.
* Transactions record financial activities.
* Reference Events preserve business context.
* Valuation captures market assumptions.
* Performance is calculated, never manually maintained.
* Reports are generated from business data.
