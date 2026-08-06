const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(isoDate));
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
