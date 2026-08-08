import type { Investment } from "@pwpm/shared";

export const INVESTMENT_TYPE_LABEL: Record<Investment["investment_type"], string> = {
  equity: "Cổ phiếu",
  rental_property: "BĐS cho thuê",
};

export const INVESTMENT_STATUS_LABEL: Record<Investment["status"], string> = {
  active: "ACTIVE",
  disposed: "ĐÃ THOÁI VỐN",
  archived: "ĐÃ LƯU TRỮ",
};

export const INVESTMENT_STATUS_DOT: Record<Investment["status"], string> = {
  active: "before:bg-emerald",
  disposed: "before:bg-gold",
  archived: "before:bg-muted-foreground",
};
