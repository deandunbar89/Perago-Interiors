// Interview times are entered and shown on the Dubai clock whatever the server's or
// the viewer's own time zone is. The UAE has no daylight saving, so a fixed +04:00
// offset is exact.
const TZ = "Asia/Dubai";

/** "2026-10-25T10:00" (as typed into a datetime-local box) read as Dubai time. */
export function parseDubaiLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}:00+04:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** A Date as the "YYYY-MM-DDTHH:mm" string a datetime-local box expects, on the Dubai clock. */
export function toDubaiInputValue(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(d)
    .replace(" ", "T");
}

export function formatDubai(d: Date): string {
  return d.toLocaleString("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
