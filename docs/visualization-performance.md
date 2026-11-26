# Visualization performance baseline

Measured on November 27, 2026, with an Intel Core i5-12600KF, NixOS 26.05
(Linux 6.18.48), headless Chromium 152.0.7977.64, viewport 800 × 520, DPR 1
and a 640 × 360 chart. The input generators use the same deterministic
sequences on both platforms. Map uses `mercator-fit-holes-and-points` from
the locked visualization fixture set. No chart animation, sampling, or
engine changes were enabled during the measurements. Each case has one
discarded warm-up and five measured repetitions.

| Workload | Input | React mount / update (ms) | React keyboard tooltip callback (ms) | Flutter mount / update (ms) |
| --- | --- | --- | --- | --- |
| Line | 4 × 1,000 points | 62.1 / 61.7 | 0.2 | 18.5 / 22.9 |
| Scatter | 10,000 points | 181.3 / 158.2 | 0.2 | 63.7 / 148.3 |
| Heatmap | 100 × 100 cells | 192.7 / 165.1 | 0.1 | 62.0 / 67.8 |
| Network | 500 nodes, 1,000 edges | 7.4 / 2.6 | 0.1 | 33.2 / 34.8 |
| Map | 3 local features | 0.5 / 0.3 | 0.1 | 18.0 / 15.8 |

Values are medians. The React production benchmark times synchronous DOM
commit through `flushSync`, followed by an animation frame before the
next operation. The tooltip measurement runs from the keyboard event to
the callback and excludes paint. Flutter 3.50.1 profile Web with local
CanvasKit records elapsed time through `endOfFrame`, including scheduling
and frame rendering. Compare repetitions within one runtime and measurement
method. These measurements describe this machine and workload.

## Reproduce

Build the JS packages with Bun 1.4.0 and run the benchmark from the Web
repository. The runner prints individual samples and environment metadata.

```sh
bun run build:packages @duskmoon-dev/visualization
CHROME_BIN=/path/to/chromium node validation/visualization-browser/performance.mjs
```

In the Flutter repository, open the Flutter development environment and
build the profile benchmark from `example/design_preview`:

```sh
flutter build web --profile --no-web-resources-cdn \
  --target lib/visualization_benchmark.dart --output /tmp/duskmoon-viz-benchmark
python3 -m http.server 4491 --bind 127.0.0.1 --directory /tmp/duskmoon-viz-benchmark
```

Collect the Flutter data using the same Chromium runner:

```sh
CHROME_BIN=/path/to/chromium DUSKMOON_VIZ_FLUTTER_URL=http://127.0.0.1:4491 \
  node validation/visualization-browser/performance.mjs
```
