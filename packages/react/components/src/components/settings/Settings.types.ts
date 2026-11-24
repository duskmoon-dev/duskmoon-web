import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SwitchChangeEvent } from "../switch";

export type SettingsListProps = ComponentPropsWithoutRef<"div">;

export interface SettingsSectionProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  /** Visible heading for the group. */
  title: ReactNode;
  /** Supporting information displayed under the group. */
  description?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

interface SettingsTileContent {
  /** Visible name of the setting. */
  title: ReactNode;
  description?: ReactNode;
  /** Decorative icon shown before the setting. */
  leading?: ReactNode;
}

export interface SettingsTileProps
  extends
    Omit<ComponentPropsWithoutRef<"li">, "title" | "children">,
    SettingsTileContent {
  /** Current value or a custom control with its own accessible name. */
  trailing?: ReactNode;
  /** Place a wider control on its own line. */
  stacked?: boolean;
}

export interface SettingsLinkTileProps
  extends
    Omit<ComponentPropsWithoutRef<"a">, "title" | "href" | "children">,
    SettingsTileContent {
  href: string;
  /** Current value shown inside the link. */
  value?: string;
}

export interface SettingsSwitchTileProps extends Omit<
  SettingsTileProps,
  "stacked" | "trailing"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean, event: SwitchChangeEvent) => void;
  disabled?: boolean;
  name?: string;
}
