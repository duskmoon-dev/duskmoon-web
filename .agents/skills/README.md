# Duskmoon Web development skills

Codex discovers the repository workflows under `.agents/skills/`. Use these skills when changing Duskmoon Web itself. For applications installing released packages, use the [consumer catalog](../../skills/README.md).

| Skill | Covers |
| --- | --- |
| [create-element](create-element/SKILL.md) | Element package source, registration, docs and regression checks |
| [css-art](css-art/SKILL.md) | CSS Art source files and docs integration |
| [duskmoon-web-development](duskmoon-web-development/SKILL.md) | React, Phoenix, Code Engine and Yew source checks |
| [cmd-audit-duskmoon-style](cmd-audit-duskmoon-style/SKILL.md) | Targeted audit of a rendered component, explicitly invoked |
| [cmd-update-project-docs](cmd-update-project-docs/SKILL.md) | Refresh documentation and skills, explicitly invoked |
| [duskmoon-web-release](duskmoon-web-release/SKILL.md) | Coordinated release preparation, publication and recovery |

The [source history](../../docs/migration.md#history) identifies the imported skill revisions. `create_element` now matches its declared name, `create-element`. The docs-refresh command covers the original docs commands and Phoenix's `cmd-update-project-skill`. `duskmoon-web-release` follows the coordinated Web workflow. The design-token and cross-repository dependency sync commands were retired during consolidation. Duskmoon Bundler continues to maintain its own skill.
