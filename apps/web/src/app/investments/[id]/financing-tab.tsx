import { computeOutstandingFinancing } from "@pwpm/domain";
import { formatDate, formatVND } from "@pwpm/utils";
import type { Financing, Transaction } from "@pwpm/shared";

import { FINANCING_SOURCE_LABEL } from "./labels";

export function FinancingTab({
  financings,
  transactions,
}: {
  financings: Financing[];
  transactions: Transaction[];
}) {
  if (financings.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-input py-14 text-center text-[12.5px] text-muted-foreground">
        Chưa có thông tin tài trợ.
      </div>
    );
  }

  const outstanding = computeOutstandingFinancing(financings, transactions);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-input bg-surface p-3.5">
        <span className="text-[11px] font-semibold text-muted-foreground">Dư nợ hiện tại</span>
        <div className="text-[22px] font-bold tabular-nums">{formatVND(outstanding)}</div>
      </div>

      <div className="rounded-[14px] border border-input bg-surface p-4">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <Th>Nguồn vốn</Th>
              <Th align="right">Số tiền vay gốc</Th>
              <Th align="right">Lãi suất</Th>
              <Th align="right">Thời hạn</Th>
              <Th>Bên cho vay</Th>
              <Th>Ngày bắt đầu</Th>
            </tr>
          </thead>
          <tbody>
            {financings.map((f) => (
              <tr key={f.id}>
                <td className="border-b border-input py-[7px] pr-2.5 align-middle font-medium last:border-b-0">
                  {FINANCING_SOURCE_LABEL[f.source_type]}
                </td>
                <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                  {formatVND(f.principal_amount)}
                </td>
                <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                  {f.interest_rate != null ? `${f.interest_rate}%/năm` : "—"}
                </td>
                <td className="border-b border-input py-[7px] pr-2.5 text-right align-middle tabular-nums last:border-b-0">
                  {f.loan_term_months != null ? `${f.loan_term_months} tháng` : "—"}
                </td>
                <td className="border-b border-input py-[7px] pr-2.5 align-middle last:border-b-0">
                  {f.lender_name ?? "—"}
                </td>
                <td className="border-b border-input py-[7px] pr-2.5 align-middle tabular-nums text-muted-foreground last:border-b-0">
                  {formatDate(f.start_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`border-b border-input pb-2 pr-2.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
