import { computeOutstandingFinancing } from "@pwpm/domain";
import { formatVND } from "@pwpm/utils";
import type { Financing, InvestmentType, Transaction } from "@pwpm/shared";

import { FinancingForm } from "./financing-form";
import { FinancingRow } from "./financing-row";

export function FinancingTab({
  investmentId,
  investmentType,
  financings,
  transactions,
}: {
  investmentId: string;
  investmentType: InvestmentType;
  financings: Financing[];
  transactions: Transaction[];
}) {
  const outstanding = computeOutstandingFinancing(financings, transactions);

  return (
    <div className="grid grid-cols-[1fr_320px] items-start gap-4">
      <div className="flex flex-col gap-4">
        <div className="rounded-[14px] border border-input bg-surface p-3.5">
          <span className="text-[11px] font-semibold text-muted-foreground">Dư nợ hiện tại</span>
          <div className="text-[22px] font-bold tabular-nums">{formatVND(outstanding)}</div>
        </div>

        <div className="rounded-[14px] border border-input bg-surface p-4">
          {financings.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-muted-foreground">Chưa có thông tin tài trợ.</p>
          ) : (
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <Th>Nguồn vốn</Th>
                  <Th align="right">Số tiền vay gốc</Th>
                  <Th align="right">Lãi suất</Th>
                  <Th align="right">Thời hạn</Th>
                  <Th>Bên cho vay</Th>
                  <Th>Ngày giải ngân</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {financings.map((f) => (
                  <FinancingRow
                    key={f.id}
                    investmentId={investmentId}
                    investmentType={investmentType}
                    financing={f}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FinancingForm investmentId={investmentId} investmentType={investmentType} />
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
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
