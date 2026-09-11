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

> This project is under active development for SIH 2026. Current stage: initial scaffold — data pipeline and forecasting modules are in progress.

- [ ] Real sea-ice/ocean data pipeline
- [ ] Map visualization (ice concentration heatmap)
- [ ] Baseline route (hardcoded start/end)
- [ ] Route optimization (A*/Dijkstra over risk grid)
- [ ] Sea-ice forecasting model (ConvLSTM/U-Net)
- [ ] Iceberg trajectory model (physics + ML hybrid)
- [ ] In-app assistant (Gemini-powered, for explaining forecasts/routes — not for prediction)

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
