import { clampUnit } from "./axis.js";

export function seriesHash(id: string): number {
  // Encode the scalar values explicitly so Core has no runtime or DOM dependency.
  let hash = 2166136261;
  const add = (byte: number) => {
    hash = Math.imul(hash ^ byte, 16777619);
  };
  for (const character of id) {
    const code = character.codePointAt(0)!;
    if (code < 0x80) {
      add(code);
    } else if (code < 0x800) {
      add(0xc0 | (code >> 6));
      add(0x80 | (code & 63));
    } else if (code < 0x10000) {
      add(0xe0 | (code >> 12));
      add(0x80 | ((code >> 6) & 63));
      add(0x80 | (code & 63));
    } else {
      add(0xf0 | (code >> 18));
      add(0x80 | ((code >> 12) & 63));
      add(0x80 | ((code >> 6) & 63));
      add(0x80 | (code & 63));
    }
  }
  return hash >>> 0;
}

export function sampleColor(
  stops: readonly string[],
  position: number,
): string {
  const index = clampUnit(position) * (stops.length - 1);
  const left = stops[Math.floor(index)];
  const right = stops[Math.ceil(index)];
  const fraction = index - Math.floor(index);
  const channels = [1, 3, 5].map((offset) => {
    const low = Number.parseInt(left.slice(offset, offset + 2), 16);
    const high = Number.parseInt(right.slice(offset, offset + 2), 16);
    return Math.round(low + (high - low) * fraction)
      .toString(16)
      .padStart(2, "0");
  });
  return ("#" + channels.join("")).toUpperCase();
}
