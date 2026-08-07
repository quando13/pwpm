import type { Valuation } from "@pwpm/shared";

export function latestValuation(valuations: Valuation[]): Valuation | undefined {
  return valuations.reduce<Valuation | undefined>((latest, current) => {
    if (!latest) return current;
    return current.valuation_date > latest.valuation_date ? current : latest;
  }, undefined);
}
