import { describe, expect, it } from "vitest";
import { TRANSACTION_TYPES_BY_INVESTMENT_TYPE } from "@pwpm/shared";

// Smoke test proving the vitest + workspace-package wiring works end to end.
// Real calculation-spec.md formula tests land per-calculator alongside Release 1/2 implementation.
describe("domain package wiring", () => {
  it("resolves @pwpm/shared across the workspace boundary", () => {
    expect(TRANSACTION_TYPES_BY_INVESTMENT_TYPE.equity).toContain("buy_shares");
  });
});
