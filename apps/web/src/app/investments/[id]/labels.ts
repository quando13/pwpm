import type { FinancingSource, ReferenceEventType, TransactionType, ValuationSource } from "@pwpm/shared";

export const FINANCING_SOURCE_LABEL: Record<FinancingSource, string> = {
  personal_capital: "Vốn tự có",
  bank_loan: "Vay ngân hàng",
  private_loan: "Vay cá nhân / người thân",
  margin_loan: "Vay ký quỹ (Margin)",
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  capital_contribution: "Vốn góp",
  rental_income: "Thu nhập cho thuê",
  loan_principal_payment: "Trả nợ gốc",
  loan_interest_payment: "Trả lãi vay",
  maintenance_expense: "Chi phí bảo trì",
  renovation_expense: "Chi phí cải tạo",
  disposal_proceeds: "Tiền thu từ thanh lý",
  buy_shares: "Mua cổ phiếu",
  sell_shares: "Bán cổ phiếu",
  dividend_received: "Cổ tức nhận được",
  brokerage_fee: "Phí môi giới",
};

export const VALUATION_SOURCE_LABEL: Record<ValuationSource, string> = {
  market_reference: "Tham chiếu thị trường",
  appraisal: "Thẩm định giá",
  broker_quote: "Báo giá môi giới",
  manual_estimate: "Ước tính thủ công",
};

export const REFERENCE_EVENT_TYPE_LABEL: Record<ReferenceEventType, string> = {
  property_valuation_note: "Ghi chú định giá BĐS",
  tenant_change: "Đổi người thuê",
  lease_renewal: "Gia hạn hợp đồng thuê",
  interest_rate_change: "Thay đổi lãi suất",
  market_valuation_note: "Ghi chú định giá thị trường",
  stock_split: "Chia tách cổ phiếu",
  corporate_action: "Sự kiện doanh nghiệp",
  legal_update: "Cập nhật pháp lý",
  other: "Khác",
};
