import { useId, useState } from "react";
import {
  SettingsList,
  SettingsSection,
  SettingsTile,
} from "@duskmoon-dev/components/settings";

function SettingIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} />
    </svg>
  );
}

export function SettingsPreview() {
  const id = useId();
  const [updates, setUpdates] = useState(false);
  const languageId = `${id}-language`;

  return (
    <form onReset={() => setUpdates(false)}>
      <SettingsList>
        <SettingsSection
          title="General"
          headingLevel={4}
          description="Device preferences can apply to more than one workspace."
        >
          <SettingsTile.Link
            title="Language"
            href={`#${languageId}`}
            value="English"
            leading={
              <SettingIcon path="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0m0 0h18M12 3a16 16 0 0 1 0 18m0-18a16 16 0 0 0 0 18" />
            }
          />
          <SettingsTile
            id={languageId}
            title="Display language"
            description="Inherited from your device."
            trailing="English"
            leading={<SettingIcon path="M3 4h18v13H3zM8 21h8m-4-4v4" />}
          />
          <SettingsTile.Switch
            title="Email updates"
            description="Receive a weekly summary."
            checked={updates}
            onCheckedChange={setUpdates}
            leading={<SettingIcon path="M3 5h18v14H3zM3 7l9 6 9-6" />}
          />
        </SettingsSection>
        <SettingsSection title="Editor" headingLevel={4}>
          <SettingsTile
            title={<label htmlFor={`${id}-profile`}>Profile name</label>}
            trailing={
              <input
                className="input input-sm"
                id={`${id}-profile`}
                defaultValue="Default"
              />
            }
          />
          <SettingsTile
            title={<label htmlFor={`${id}-size`}>Font size</label>}
            description={
              <span id={`${id}-size-help`}>Adjust within 12–24 px.</span>
            }
            trailing={
              <input
                type="range"
                className="range range-sm"
                id={`${id}-size`}
                min={12}
                max={24}
                defaultValue={16}
                aria-describedby={`${id}-size-help`}
              />
            }
          />
          <SettingsTile
            title={<label htmlFor={`${id}-tabs`}>Tab width</label>}
            trailing={
              <select
                className="select select-sm"
                id={`${id}-tabs`}
                defaultValue="2"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </select>
            }
          />
          <SettingsTile
            title={<label htmlFor={`${id}-wrap`}>Wrap long lines</label>}
            trailing={
              <input
                type="checkbox"
                className="checkbox"
                id={`${id}-wrap`}
                defaultChecked
              />
            }
          />
          <SettingsTile
            stacked
            title={<label htmlFor={`${id}-notes`}>Profile notes</label>}
            trailing={
              <textarea
                className="textarea w-full"
                id={`${id}-notes`}
                rows={2}
              />
            }
          />
        </SettingsSection>
        <SettingsSection title="Startup" headingLevel={4}>
          <SettingsTile
            stacked
            title={<span id={`${id}-launch`}>On launch</span>}
            trailing={
              <div
                className="settings-row-trailing"
                role="radiogroup"
                aria-labelledby={`${id}-launch`}
              >
                <label className="radio-label">
                  <input
                    type="radio"
                    className="radio"
                    name={`${id}-launch`}
                    defaultChecked
                  />
                  Restore session
                </label>
                <label className="radio-label">
                  <input type="radio" className="radio" name={`${id}-launch`} />
                  Start fresh
                </label>
              </div>
            }
          />
          <SettingsTile
            stacked
            title={<span id={`${id}-restore`}>Restore with session</span>}
            description={
              <span id={`${id}-restore-help`}>
                Select which items reopen with a restored session.
              </span>
            }
            trailing={
              <div
                className="settings-row-trailing"
                role="group"
                aria-labelledby={`${id}-restore`}
                aria-describedby={`${id}-restore-help`}
              >
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox" defaultChecked />
                  Open tabs
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox" />
                  Panel layout
                </label>
              </div>
            }
          />
        </SettingsSection>
        <SettingsSection
          title="About"
          headingLevel={4}
          description="Changes are kept in this page for the current session."
        >
          <SettingsTile
            title="Release channel"
            trailing={<span className="badge badge-primary">Stable</span>}
          />
          <SettingsTile
            title="Example preferences"
            trailing={
              <button className="btn btn-ghost btn-sm" type="reset">
                Reset example
              </button>
            }
          />
        </SettingsSection>
      </SettingsList>
    </form>
  );
}
