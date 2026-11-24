import { forwardRef, useId } from "react";
import { cn } from "../../utils";
import { Switch } from "../switch";
import type {
  SettingsLinkTileProps,
  SettingsListProps,
  SettingsSectionProps,
  SettingsSwitchTileProps,
  SettingsTileProps,
} from "./Settings.types";

export const SettingsList = forwardRef<HTMLDivElement, SettingsListProps>(
  ({ className, ...props }, ref) => (
    <div {...props} ref={ref} className={cn("settings-list", className)} />
  ),
);
SettingsList.displayName = "SettingsList";

export const SettingsSection = forwardRef<HTMLElement, SettingsSectionProps>(
  (
    { title, description, headingLevel = 2, className, children, ...props },
    ref,
  ) => {
    const headingId = useId();
    const descriptionId = `${headingId}-description`;
    const Heading = `h${headingLevel}` as const;

    return (
      <section
        aria-labelledby={headingId}
        aria-describedby={description != null ? descriptionId : undefined}
        {...props}
        ref={ref}
        className={cn("settings-section", className)}
      >
        <Heading className="settings-section-title" id={headingId}>
          {title}
        </Heading>
        <ul className="settings-section-items" role="list">
          {children}
        </ul>
        {description != null && (
          <div className="settings-section-description" id={descriptionId}>
            {description}
          </div>
        )}
      </section>
    );
  },
);
SettingsSection.displayName = "SettingsSection";

function TileContent({
  title,
  description,
  leading,
  titleId,
  descriptionId,
}: Pick<SettingsTileProps, "title" | "description" | "leading"> & {
  titleId?: string;
  descriptionId?: string;
}) {
  return (
    <>
      {leading != null && (
        <span className="settings-row-leading" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="settings-row-content">
        <span className="settings-row-title" id={titleId}>
          {title}
        </span>
        {description != null && (
          <span className="settings-row-description" id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </>
  );
}

const StaticTile = forwardRef<HTMLLIElement, SettingsTileProps>(
  ({ title, description, leading, trailing, stacked, ...props }, ref) => (
    <li {...props} ref={ref}>
      <div className={cn("settings-row", stacked && "settings-row-stacked")}>
        <TileContent
          title={title}
          description={description}
          leading={leading}
        />
        {trailing != null && (
          <div className="settings-row-trailing">{trailing}</div>
        )}
      </div>
    </li>
  ),
);
StaticTile.displayName = "SettingsTile";

const LinkTile = forwardRef<HTMLAnchorElement, SettingsLinkTileProps>(
  ({ title, description, leading, value, className, ...props }, ref) => (
    <li>
      <a {...props} ref={ref} className={cn("settings-row", className)}>
        <TileContent
          title={title}
          description={description}
          leading={leading}
        />
        <span className="settings-row-trailing">
          {value}
          <span className="settings-row-chevron" aria-hidden="true" />
        </span>
      </a>
    </li>
  ),
);
LinkTile.displayName = "SettingsTile.Link";

const SwitchTile = forwardRef<HTMLLIElement, SettingsSwitchTileProps>(
  (
    {
      title,
      description,
      leading,
      checked,
      onCheckedChange,
      disabled,
      name,
      ...props
    },
    ref,
  ) => {
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;

    return (
      <li {...props} ref={ref}>
        <div className="settings-row">
          <TileContent
            title={title}
            description={description}
            leading={leading}
            titleId={titleId}
            descriptionId={descriptionId}
          />
          <div className="settings-row-trailing">
            <Switch
              checked={checked}
              disabled={disabled}
              name={name}
              onChange={onCheckedChange}
              aria-labelledby={titleId}
              aria-describedby={description != null ? descriptionId : undefined}
            />
          </div>
        </div>
      </li>
    );
  },
);
SwitchTile.displayName = "SettingsTile.Switch";

export const SettingsTile = Object.assign(StaticTile, {
  Link: LinkTile,
  Switch: SwitchTile,
});
