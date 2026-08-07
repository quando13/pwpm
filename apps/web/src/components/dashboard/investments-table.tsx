import { mockInvestments } from "./mock-data";
import { AlertIcon, HouseIcon, TrendUpIcon } from "../icons";

export function InvestmentsTable() {
  return (
    <section className="flex min-h-0 flex-col rounded-[14px] border border-input bg-surface p-4 pb-3 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_16px_32px_-18px_rgba(0,0,0,0.7)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-bold">Khoản đầu tư nổi bật</span>
        <span className="text-[11px] text-muted-foreground">Hiệu suất cao nhất &amp; cần chú ý</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <Th>Tài sản</Th>
              <Th>Loại</Th>
              <Th align="right">Giá trị hiện tại</Th>
              <Th align="right">ROI</Th>
              <Th>Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {mockInvestments.map((inv) => (
              <tr key={inv.name}>
                <td className="border-b border-input py-[6.5px] pr-2.5 align-middle last:border-b-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${
                        inv.type === "equity" ? "bg-emerald-soft text-emerald" : "bg-gold-soft text-gold-bright"
                      }`}
                    >
                      {inv.type === "equity" ? (
                        <TrendUpIcon className="h-3.5 w-3.5" strokeWidth="1.8" />
                      ) : (
                        <HouseIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold leading-tight">{inv.name}</div>
                      <div className="text-[11px] text-muted-foreground">{inv.sub}</div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-input py-[6.5px] pr-2.5 align-middle last:border-b-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${
                      inv.type === "equity" ? "bg-emerald-soft text-emerald" : "bg-gold-soft text-gold-bright"
                    }`}
                  >
                    {inv.typeLabel}
                  </span>
                </td>
                <td className="border-b border-input py-[6.5px] pr-2.5 text-right align-middle font-semibold tabular-nums last:border-b-0">
                  {inv.value}
                </td>
                <td className="border-b border-input py-[6.5px] pr-2.5 text-right align-middle last:border-b-0">
                  <span className={`font-bold tabular-nums ${inv.roiUp ? "text-emerald" : "text-ruby"}`}>
                    {inv.roi}
                  </span>
                </td>
                <td className="border-b border-input py-[6.5px] pr-2.5 align-middle last:border-b-0">
                  {inv.flagged ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ruby-soft px-2 py-[3px] text-[10.5px] font-semibold text-[#ff9c8c]">
                      <AlertIcon className="h-[11px] w-[11px]" />
                      Cần chú ý
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald">
                      Đang hoạt động
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`border-b border-input pb-2 text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground ${
        align === "right" ? "pr-2.5 text-right" : "pr-2.5 text-left"
      }`}
    >
      {children}
    </th>
  );
}
