# Storybook production asset measurements

The baseline uses the original Phoenix source at
`b115f533c24587c0b6ea8ca1ec3598d9e782863a`. The candidate uses Duskmoon Web's
Storybook production build and the two asset profiles in
[`phoenix/config/config.exs`](../phoenix/config/config.exs).
Both ran on the same Mac with Elixir 1.20.1, OTP 29 and the published 10.1.3
Duskmoon Bundler cohort. The asset builds used strict precompiled mode. Browser
requests confirmed gzip for both versions.

Measurements used Chrome DevTools on desktop Chrome 157 with a 1440×900
viewport at 1×, Fast 4G emulation, 1× CPU and cold browser storage. Each row
contains one navigation per version. The Form route was repeated once per
version. Other work on the same host affected timing. Treat transfer counts and
sizes as reproducible observations for these builds and timing as local samples.

| Route | Asset requests, baseline → Web | Asset transfer bytes | JS requests | JS transfer bytes |
| --- | ---: | ---: | ---: | ---: |
| `/components` | 10 → 3 | 624,561 → 154,692 | 8 → 1 | 523,469 → 53,503 |
| `/components/action/button` | 11 → 5 | 958,769 → 644,021 | 9 → 3 | 857,677 → 542,832 |
| `/components/data-entry/react-form` | 9 → 6 | 619,974 → 408,277 | 7 → 4 | 518,882 → 307,088 |

Every resource count is for same-origin subresources and excludes the HTML
navigation and WebSocket messages. Transfer bytes include Chrome's reported
response overhead. Web's component catalog requested only `/assets/js/app.js`
for JavaScript and rendered zero `el-dm-*` nodes. The Button page requested the
retained Markdown Elements chunk without the React profile. The Form page
requested the React feature loader, its shared React runtime and the Form chunk
without downloading an Elements chunk or the Chat feature. The second Form run
reproduced the request counts and transfer sizes exactly.

| Route and sample | FCP, baseline → Web | Control ready | Long-task time | CLS |
| --- | ---: | ---: | ---: | ---: |
| Catalog | 2,992 → 2,680 ms | 3,833 → 2,899 ms | 2,916 → 2,106 ms | .00257 → 0 |
| Button | 1,224 → 3,072 ms | 3,011 → 2,775 ms | 619 → 2,204 ms | .12222 → .04599 |
| React Form, first | 1,204 → 2,644 ms | 2,335 → 3,761 ms | 516 → 1,962 ms | .01445 → .01759 |
| React Form, repeat | 12,332 → 33,632 ms | 14,229 → probe exceeded its 20 s window | 11,847 → 33,898 ms | .01445 → .01759 |

Control ready means the first animation frame in which the probe found an
enabled, visible-in-layout control. It also required a connected LiveSocket for
the catalog link and Form input. This signal can precede the first paint. Chrome
reported LCP equal to FCP in these samples. Long-task time sums the observed
durations of main-thread tasks over 50 ms. CLS uses the largest layout-shift
session window excluding shifts after recent input. Both Form runs rendered five
classic React fields. The repeated run's wide timing spread makes these
measurements unsuitable for a production latency forecast. The initial Form
control was slower in the first measured pair, and the repeated candidate
exceeded the probe deadline while still rendering its fields.

To repeat, build the source baseline with its locked install and
`MIX_ENV=prod scripts/with-precompiled-toolchain.sh mix duskmoon_bundler.build duskmoon_storybook`.
Build Web from `phoenix/` with
`MIX_ENV=prod scripts/with-precompiled-toolchain.sh mix storybook.assets`.
Run `MIX_ENV=prod mix phx.digest` on each build and serve both with the same
production endpoint settings. In DevTools apply the same emulation and disable
cache for each navigation. Use a buffered `PerformanceObserver` for
`largest-contentful-paint`, `layout-shift` and `longtask`. Read FCP from
`performance.getEntriesByName("first-contentful-paint")`. Read transfer sizes
and request counts from same-origin resource entries. Measure a visible
`#components-link-action-button` on the catalog, the first primary native
button or upgraded button's shadow child on the Button page, and an input
inside `#react-profile [data-dm-react-field]` on the Form page.

Run `elixir scripts/check-storybook-assets.exs` from `phoenix/` after a
production build. It checks emitted files listed in both manifests, including
static imports of the native entry. It also requires a single React runtime
in the React profile and no Elements registration in that profile.

## Streaming and interaction evidence

The bridge regression sent 600 ordered deltas and a duplicate followed by
completion in one animation frame. It observed one render, zero outbound
sync requests for the contiguous sequence, sequence 601, and the exact
concatenated message with status complete. This is a controlled burst check.
The production Storybook also accepted a Chrome-driven chat prompt and exposed
a rendered user message and a completed streamed response.

In the React Form modal, Chrome received a server rejection for the reserved
name, then Escape closed the dialog and returned focus to its trigger. The
reopened dialog retained the rejected draft. Closing its live WebSocket
produced a disconnect and recovery with the same editor and input nodes,
the same draft, and the dialog still open. A corrected name with notifications
cleared then received the save acknowledgement.

## Bundler observation

A single Storybook asset graph initially put React in a shared chunk loaded by
an Elements-only route. In Bundler 10.1.3 a manual-chunk attempt produced
`[{"./app-react.js", "./app-index.js", "default"}]` in emitted-import validation
and fell back to a 6.46 MB single JS bundle. The production setup uses separate
Bundler profiles with the existing precompiled tooling. This keeps the
Elements graph independent and lets the Form and Chat chunks share one React
runtime. The publishing boundary and versions of Bundler and Hologram are
independent of the Web version.
