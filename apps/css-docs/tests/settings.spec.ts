import { expect, test } from '@playwright/test';

test('settings rows support keyboard navigation and native switch interaction', async ({ page }) => {
  await page.goto('/duskmoonui/docs/en/components/settings/');

  const settings = page.getByRole('region', { name: 'General', exact: true });
  const language = settings.getByRole('link', { name: 'Language English' });
  const updates = settings.getByRole('switch', {
    name: 'Email updates',
    description: 'Receive a weekly summary.',
  });

  await language.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#display-language$/);

  await language.focus();
  await page.keyboard.press('Tab');
  await expect(updates).toBeFocused();
  await page.keyboard.press('Space');
  await expect(updates).toBeChecked();
});

test('settings rows stay within the group on narrow RTL layouts and use theme colors', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/duskmoonui/docs/en/components/settings/');

  const settings = page.getByRole('region', { name: 'General', exact: true });
  const list = settings.getByRole('list');
  await expect(list).toBeVisible();
  await settings.evaluate((element) => element.setAttribute('dir', 'rtl'));

  const link = settings.getByRole('link', { name: 'Language English' });
  expect(await link.evaluate((element) => {
    const title = element.querySelector('.settings-row-title')!.getBoundingClientRect();
    const value = element.querySelector('.settings-row-trailing')!.getBoundingClientRect();
    return title.right > value.right && element.scrollWidth <= element.clientWidth;
  })).toBe(true);

  const geometry = await list.evaluate((element) => {
    const row = element.children[1];
    const rowStyle = getComputedStyle(row);
    const divider = getComputedStyle(row, '::before');
    return {
      groupRadius: parseFloat(getComputedStyle(element).borderStartStartRadius),
      rowRadius: rowStyle.borderStartStartRadius,
      rowBorder: rowStyle.borderBlockStartWidth,
      dividerWidth: divider.borderBlockStartWidth,
      startInset: parseFloat(divider.insetInlineStart),
      endInset: parseFloat(divider.insetInlineEnd),
    };
  });
  expect(geometry.groupRadius).toBeGreaterThan(0);
  expect(geometry.rowRadius).toBe('0px');
  expect(geometry.rowBorder).toBe('0px');
  expect(geometry.dividerWidth).toBe('1px');
  expect(geometry.startInset).toBeGreaterThan(geometry.endInset);

  const backgrounds = new Set<string>();
  for (const theme of ['sunshine', 'moonlight', 'forest', 'ocean']) {
    const background = await list.evaluate((element, value) => {
      document.documentElement.setAttribute('data-theme', value);
      const reference = document.createElement('span');
      reference.style.backgroundColor = 'var(--color-surface-container-low)';
      element.before(reference);
      const tokenColor = getComputedStyle(reference).backgroundColor;
      reference.remove();
      return tokenColor;
    }, theme);
    await expect(list).toHaveCSS('background-color', background);
    backgrounds.add(background);
  }
  expect(backgrounds.size).toBe(4);
});

test('settings example edits every field type and restores defaults', async ({ page }) => {
  await page.goto('/duskmoonui/docs/en/components/settings/');
  const editor = page.getByRole('region', { name: 'Editor', exact: true });
  const profile = editor.getByRole('textbox', { name: 'Profile name' });
  const notes = editor.getByRole('textbox', { name: 'Profile notes' });
  const fontSize = editor.getByRole('slider', { name: 'Font size' });
  const tabs = editor.getByRole('combobox', { name: 'Tab width' });
  const wrap = editor.getByRole('checkbox', { name: 'Wrap long lines' });
  const launch = page.getByRole('radiogroup', { name: 'On launch' });
  const restore = page.getByRole('group', { name: 'Restore with session' });
  const panel = restore.getByRole('checkbox', { name: 'Panel layout' });

  await profile.fill('Work');
  await notes.fill('For project work');
  await fontSize.press('ArrowRight');
  await tabs.selectOption({ label: '4 spaces' });
  await wrap.uncheck();
  await launch.getByRole('radio', { name: 'Start fresh' }).check();
  await panel.check();
  await expect(fontSize).toHaveValue('17');
  await expect(panel).toBeChecked();
  await expect(page.getByRole('region', { name: 'About' }).getByText('Stable')).toBeVisible();

  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(profile).toHaveValue('Default');
  await expect(notes).toHaveValue('');
  await expect(fontSize).toHaveValue('16');
  await expect(tabs).toHaveValue('2 spaces');
  await expect(wrap).toBeChecked();
  await expect(launch.getByRole('radio', { name: 'Restore session' })).toBeChecked();
  await expect(panel).not.toBeChecked();
});
