import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ChartOptions, XYLayout } from "@duskmoon-dev/visualization-core";

export type ChartSize = { width?: number; height?: number; loading?: boolean };

export function token(name: string, fallback: string): string {
  return `var(--color-${name}, ${fallback})`;
}

export const seriesColors = [
  token("primary", "#005AC1"),
  token("secondary", "#565E71"),
  token("tertiary", "#705574"),
  token("primary-container", "#D8E2FF"),
  token("secondary-container", "#DAE2F9"),
  token("tertiary-container", "#FAD9FC"),
];

export type ChartRow = {
  id: string;
  name: string;
  raw: Readonly<Record<string, unknown>>;
};

type FrameProps = ChartSize & {
  options?: ChartOptions;
  state: XYLayout["state"];
  legend?: ReactNode;
  rows?: readonly ChartRow[];
  focusedValue?: string;
  children: (size: {
    width: number;
    height: number;
    clipId: string;
  }) => ReactNode;
};

export function ChartFrame({
  width,
  height = 300,
  loading,
  options,
  state,
  legend,
  rows,
  focusedValue,
  children,
}: FrameProps) {
  const host = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);
  const id = useId();
  useEffect(() => {
    const element = host.current;
    if (width !== undefined || !element) return;
    const measure = () => setMeasured(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  const plotWidth = width ?? measured;
  const message = loading
    ? "Loading chart…"
    : state === "error"
      ? "Unable to display chart"
      : state === "empty"
        ? "No data to display"
        : null;
  const theme = options?.theme;
  return (
    <figure
      style={{
        margin: 0,
        width,
        maxWidth: "100%",
        color: theme?.text ?? token("on-surface", "#202124"),
        background: theme?.background ?? token("surface", "#FFFFFF"),
      }}
    >
      <figcaption id={id + "-title"}>
        <strong>{options?.title || "Chart"}</strong>
        {options?.description && <div>{options.description}</div>}
      </figcaption>
      <div ref={host} style={{ minHeight: height }}>
        {message ? (
          <p role="status">{message}</p>
        ) : (
          plotWidth > 80 &&
          height > 80 &&
          children({ width: plotWidth, height, clipId: id + "-clip" })
        )}
      </div>
      {legend}
      {!!rows?.length && <ChartData rows={rows} />}
      <output
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clipPath: "inset(50%)",
        }}
      >
        {focusedValue}
      </output>
      {options?.summary && <p>{options.summary}</p>}
    </figure>
  );
}

export function Legend({
  items,
  onToggle,
}: {
  onToggle?: (id: string) => void;
  items: readonly {
    id: string;
    name: string;
    color: string;
    visible: boolean;
  }[];
}) {
  if (!items.length) return null;
  return (
    <ul
      aria-label="Chart legend"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        margin: 0,
        padding: "0 16px",
        listStyle: "none",
      }}
    >
      {items.map(({ id, name, color, visible }) => (
        <li key={id}>
          <button
            type="button"
            aria-pressed={visible}
            onClick={() => onToggle?.(id)}
            style={{
              color: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: visible ? undefined : "line-through",
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 10, height: 10, background: color }}
            />
            {name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ChartData({ rows }: { rows: readonly ChartRow[] }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const batch = 100;
  const last = Math.max(0, Math.ceil(rows.length / batch) - 1);
  const current = Math.min(last, page);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Chart data ({rows.length})</summary>
      {open && (
        <>
          <table>
            <caption>Raw chart values</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Values</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice(current * batch, (current + 1) * batch)
                .map(({ id, name, raw }) => (
                  <tr key={id}>
                    <th scope="row">{name}</th>
                    <td>
                      {Object.entries(raw)
                        .map(
                          ([key, value]) =>
                            key +
                            ": " +
                            (value === null ? "missing" : String(value)),
                        )
                        .join(", ")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {last > 0 && (
            <>
              <button
                type="button"
                disabled={!current}
                onClick={() => setPage(current - 1)}
              >
                Previous data page
              </button>
              <button
                type="button"
                disabled={current === last}
                onClick={() => setPage(current + 1)}
              >
                Next data page
              </button>
            </>
          )}
        </>
      )}
    </details>
  );
}
