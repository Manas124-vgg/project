# PolarPath

**AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory & Navigation Decision Support System**

Built for Smart India Hackathon 2026 — Problem Statement **#26059**
Team: **Crimson Coders**

---

## The Problem

Antarctic sea ice and icebergs shift rapidly and unpredictably. Research vessels currently rely on delayed satellite imagery and human guesswork to navigate, leaving captains blind to sudden hazards — risking trapped vessels, mission delays, and crew safety.

## Our Idea

PolarPath is an AI-powered maritime navigation platform. By combining satellite, ocean, and weather data, it predicts ice movement 3–7 days ahead, giving captains the safest, most fuel-efficient routes before hazards form.

## Proposed Solution

- **3-Layer Predictive Pipeline** — ingests satellite, ocean current, and wind data to concurrently assess sea-ice risk, iceberg drift, and route risk
- **Deep Learning Forecasting** — ConvLSTM / U-Net models predicting sea-ice concentration and iceberg trajectories 3–7 days ahead
- **Dynamic Route Optimizer** — generates the safest, most fuel-efficient maritime path on an interactive dashboard with traffic-light risk zones

## What Makes This Different

- **Predictive risk corridors** — converts complex satellite/ocean data into intuitive traffic-light navigation paths instead of static scientific maps
- **Physics-informed deep learning** — fuses ocean hydrodynamic drift equations with neural networks for higher accuracy despite scarce polar training data
- **Low-bandwidth satcom sync** — compresses routing updates into lightweight vectors (<50 KB) for reliable transmission over polar satellite links

## Project Status

> This project is under active development for SIH 2026.

- [x] Real sea-ice/ocean data pipeline (Copernicus AMSR2 grid, `public/data/seaIce.json`)
- [x] Map visualization (ice concentration heatmap — 2D Leaflet + 3D Three.js globe)
- [x] Baseline route (hardcoded start/end)
- [x] Route optimization (corridor risk scoring; A*/Dijkstra over risk grid in progress)
- [ ] Sea-ice forecasting model (ConvLSTM/U-Net)
- [ ] Iceberg trajectory model (physics + ML hybrid)
- [x] In-app assistant (Gemini-powered — POLARIS, explains forecasts/routes; not for prediction)
- [x] Iceberg fleet tracking — 13 contacts with drift vectors, keel drafts, CPA hazard zones
- [x] Operator modes — LIVE / SIMULATION / STANDBY with distinct telemetry cadence (hotkey: M)
- [x] Mission settings persistence — units, CPA buffer, SAR cadence, bridge dimming

## Running Locally

```bash
npm install
npm run dev      # Vite on http://localhost:3000
npm run lint     # TypeScript strict check
```

The app reads `GEMINI_API_KEY`, `APP_URL`, and `GOOGLE_*` from `.env` (see `.env.example`).

### Enabling real Google Sign-In in dev

The official Google button only works when the app runs on an origin registered as an
**Authorized JavaScript origin** on the OAuth client. By default that is
`https://www.PolaNav.com`, so on `http://localhost:3000` the app shows an explanatory
notice and falls back to the local dev bridge sign-in.

To enable the real Google button locally:

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Select the OAuth client for this project (ID `584069263560-mhuueak8neiv6t7hefmo6llo6u0gm47c`)
3. Under **Authorized JavaScript origins**, add `http://localhost:3000`
   (⚠ origins match **exactly, scheme included** — `https://localhost:3000` and
   `http://localhost:3000` are separate entries; the dev server runs on **http**)
4. Reload the app — the official button activates automatically

If the origin is still unregistered, clicking the button surfaces a precise
`origin_mismatch` error naming the exact origin to add.

Until then, "Sign In as Chief Navigation Officer (Local Bridge)" provides a full-featured
offline session (labeled `local` provider in the profile menu).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| AI Assistant | Google Gemini API |
| Mapping | Mapbox GL JS / Leaflet *(planned)* |
| Forecasting | PyTorch (ConvLSTM/U-Net) *(planned)* |
| Data sources | Copernicus Marine Service, NSIDC, ERA5 *(planned)* |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- A free [Gemini API key](https://ai.google.dev/)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Manas124-vgg/project.git
   cd project
   npm install
   ```

2. Create a `.env.local` file in the project root and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

3. Run the app locally:
   ```bash
   npm run dev
   ```

## Team — Crimson Coders

| Name | Role |
|---|---|
| *(add names)* | *(add role)* |

## Acknowledgments

- [Copernicus Marine Service](https://marine.copernicus.eu/) — ocean & ice data
- [NSIDC](https://nsidc.org/) — sea ice index
- Built with [Google AI Studio](https://ai.studio/)
