# gradient

Mesh-gradient renderer split out of the dashboard server. Exposes an
Express router with two routes:

- `GET /render` — returns the HTML page that runs `mesh-gradient.js`
  in a headless browser. Used internally by `/gradient`. Not meant for
  direct consumption.
- `GET /gradient` — uses puppeteer to load `/render`, then either
  screenshots it (PNG) or captures the animation through CCapture and
  pipes it through ffmpeg to MP4.

`puppeteer` is imported lazily inside the `/gradient` handler so the
module is cheap to import when no one calls the endpoint.

## Usage

The dashboard server mounts this at the root level so the existing
canvas helpers (which hard-code `http://localhost:4000/gradient`)
keep working without any change:

```js
import { createGradientRouter } from '../../gradient/index.js';

app.use(createGradientRouter({ port: 4000 }));
```

## Query parameters

| Name | Default | Description |
|------|---------|-------------|
| `colors` | `295C96,D0CBC7,899FB6` | comma-separated hex without `#` |
| `dimensions` | `1280x720` | `WIDTHxHEIGHT` |
| `animate` | `false` | `true` returns MP4, `false` returns PNG |
| `seed` | random | deterministic seed for reproducible output |
| `time` | `2` | animation length in seconds (when `animate=true`) |

## Dependencies

- `puppeteer` (lazy)
- `ffmpeg` on PATH (only when `animate=true`)
