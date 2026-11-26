import type { Axis, Issue, Pair, Time } from "./model.js";

export function normalizeTime(value: Time): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && Math.abs(value) <= 8_640_000_000_000_000
      ? value
      : null;
  }

  const date =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!date) return null;
  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
    offset,
    offsetHour,
    offsetMinute,
  ] = date;
  if (
    +hour > 23 ||
    +minute > 59 ||
    +second > 59 ||
    (offset && (+offsetHour > 23 || +offsetMinute > 59))
  )
    return null;
  const calendar = new Date(0);
  calendar.setUTCFullYear(+year, +month - 1, +day);
  if (
    calendar.getUTCFullYear() !== +year ||
    calendar.getUTCMonth() !== +month - 1 ||
    calendar.getUTCDate() !== +day
  )
    return null;
  const normalized = Date.parse(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export function continuousDomain(
  values: Iterable<number>,
  {
    explicit,
    includeZero = false,
    time = false,
    nice = false,
  }: {
    explicit?: Pair;
    includeZero?: boolean;
    time?: boolean;
    nice?: boolean;
  } = {},
): Pair | null {
  if (explicit) return validDomain(explicit) ? explicit : null;
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (low > high) return null;
  if (includeZero) {
    low = Math.min(low, 0);
    high = Math.max(high, 0);
  }
  if (low === high) {
    const padding = time ? 1000 : low === 0 ? 1 : Math.abs(low) * 0.05;
    low -= padding;
    high += padding;
  }
  if (nice) {
    const requestedStep = Math.max(
      time ? 1 : Number.MIN_VALUE,
      high / 5 - low / 5,
    );
    const power = 10 ** Math.floor(Math.log10(requestedStep));
    const factor = [1, 2, 5, 10].find((step) => step * power >= requestedStep);
    if (factor !== undefined && power > 0) {
      const step = factor * power;
      low = Math.floor(low / step) * step;
      high = Math.ceil(high / step) * step;
    }
  }
  return validDomain([low, high]) ? [low, high] : null;
}

export function validDomain([low, high]: Pair): boolean {
  return Number.isFinite(low) && Number.isFinite(high) && low < high;
}

export function normalizePosition(value: number, [low, high]: Pair): number {
  const span = high - low;
  return Number.isFinite(span)
    ? (value - low) / span
    : (value / 2 - low / 2) / (high / 2 - low / 2);
}

export function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normalizeAxisValue(
  value: Time,
  axis: Axis,
  path: string,
  issues: Issue[],
): Time | null {
  const issue = (code: Issue["code"]) =>
    issues.push({ code, path, severity: "error" });
  if (typeof value === "number" && !Number.isFinite(value)) {
    issue("invalidNumber");
    return null;
  }
  if (axis.type === "time") {
    const normalized = normalizeTime(value);
    if (normalized === null) issue("invalidTime");
    return normalized;
  }
  if (typeof value === (axis.type === "numeric" ? "number" : "string"))
    return value;
  issue("invalidShape");
  return null;
}

function dateTimeFormatter(
  locale: string,
  timeZone: string,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  });
}

export function validateAxisFormat(
  axis: Axis,
  path: string,
  issues: Issue[],
): void {
  const format = axis.format;
  if (!format) return;
  try {
    const style = format.style;
    const valid =
      axis.type === "category"
        ? style === "label"
        : axis.type === "numeric"
          ? style === "decimal"
          : style === "utc-iso" || style === "date-time";
    if (
      !valid ||
      (format.fractionDigits !== undefined &&
        (!Number.isInteger(format.fractionDigits) ||
          format.fractionDigits < 0 ||
          format.fractionDigits > 12))
    ) {
      throw new RangeError("Invalid axis format");
    }
    if (format.locale) Intl.getCanonicalLocales(format.locale);
    if (format.timeZone)
      dateTimeFormatter(format.locale ?? "en-US", format.timeZone);
  } catch {
    issues.push({
      code: "invalidFormat",
      path: path + "/format",
      severity: "error",
    });
  }
}

export function formatAxisValue(
  value: Time,
  axis: Axis,
  labels?: ReadonlyMap<string, string>,
): string {
  const format = axis.format;
  if (axis.type === "category")
    return labels?.get(String(value)) ?? String(value);
  if (axis.type === "numeric") {
    return new Intl.NumberFormat(format?.locale ?? "en-US", {
      useGrouping: false,
      maximumFractionDigits: format?.fractionDigits ?? 3,
    }).format(Object.is(value, -0) ? 0 : Number(value));
  }

  const date = new Date(Number(value));
  if (format?.style !== "date-time") return date.toISOString();
  const fields = Object.fromEntries(
    dateTimeFormatter(format.locale ?? "en-US", format.timeZone ?? "UTC")
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const offset = fields.timeZoneName.slice(3) || "+00:00";
  return `${fields.year.padStart(4, "0")}-${fields.month}-${fields.day} ${fields.hour}:${fields.minute}:${fields.second} ${offset}`;
}
