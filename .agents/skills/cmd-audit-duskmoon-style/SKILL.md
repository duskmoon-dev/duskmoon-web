---
name: cmd-audit-duskmoon-style
description: Audit a requested Duskmoon Web component in its actual docs or Storybook route for layout, theme, focus, and component interaction regressions.
---

# Audit Duskmoon component styles

Select the demo for the renderer the user asked about. Use the Core, Elements, or React docs workspaces in the [JS workspace guide](../../../docs/js-workspace.md), `phoenix/apps/duskmoon_storybook` for Phoenix, or `yew/example` for Yew. Prefer a known component route to a crawl when the requested scope is limited.

Build prerequisites and open the rendered demo with Chrome DevTools or the project's supported browser test harness. Match the requested viewport, themes, and states. For a responsive audit, measure both the document and component scroll regions. For interactive controls, test keyboard focus, opening/closing, disabled state, form submission, or scrolling according to the component's contract.

Trace observed failures to the rendered markup, computed styles, relevant CSS variables and package entry. Include URLs, reproduction steps, viewport and theme, and the actual measurements or screenshots. Keep diagnosis read-only unless the user asks for fixes. Stay in the authorized checkout and follow repository Git instructions for any repair.
