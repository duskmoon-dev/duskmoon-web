import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SettingsList, SettingsSection, SettingsTile } from "./Settings";

test("groups settings under a heading and renders native links and custom controls", () => {
  render(
    <SettingsList>
      <SettingsSection
        title="General"
        headingLevel={3}
        description="Applies to all profiles."
      >
        <SettingsTile.Link title="Language" value="English" href="/language" />
        <SettingsTile
          title="Text size"
          stacked
          trailing={<input aria-label="Text size" type="range" />}
        />
      </SettingsSection>
    </SettingsList>,
  );

  const group = screen.getByRole("region", {
    name: "General",
    description: "Applies to all profiles.",
  });
  const list = within(group).getByRole("list");
  const link = within(list).getByRole("link", { name: "Language English" });

  expect(within(group).getByRole("heading", { level: 3 })).toBeTruthy();
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  expect(link.getAttribute("href")).toBe("/language");
  expect(
    within(list)
      .getByRole("slider", { name: "Text size" })
      .closest(".settings-row")
      ?.classList.contains("settings-row-stacked"),
  ).toBe(true);
});

test("names the switch from the row and keeps its value controlled", () => {
  const onCheckedChange = mock(() => {});
  const row = (checked: boolean, disabled = false) => (
    <SettingsList>
      <SettingsSection title="Notifications">
        <SettingsTile.Switch
          title="Email updates"
          description="Receive a weekly summary."
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
        />
      </SettingsSection>
    </SettingsList>
  );
  const { rerender } = render(row(false));
  const input = screen.getByRole<HTMLInputElement>("switch", {
    name: "Email updates",
    description: "Receive a weekly summary.",
  });

  fireEvent.click(input);
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  expect(input.checked).toBe(false);

  rerender(row(true, true));
  expect(input.checked).toBe(true);
  expect(input.disabled).toBe(true);
  input.click();
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
});
