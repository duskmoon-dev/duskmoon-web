import type { LiveViewHook } from "./hooks/index.js";

export declare function lazyHook(
  load: () => Promise<LiveViewHook>,
  options?: { events?: string[]; synchronize?: boolean },
): LiveViewHook;
