# Luxe Retirement Forecaster

A Vite-powered React app for high-net-worth retirement planning. Adjust the input cards to model savings, education drawdowns, investment growth/withdrawals, timed expenses, mortgage payoff, and property appreciation through age 100. Copy the generated markdown table for your docs.

## Getting started
1. Install dependencies:
   ```sh
   npm install
   ```
   If your network blocks the default registry, try `npm install --registry https://registry.npmjs.org`.
2. Start local dev server:
   ```sh
   npm run dev -- --host --port 5173
   ```
   Open the printed URL (e.g., http://localhost:5173) to interact with the app.

## Building and previewing
Create a production bundle and serve it locally:
```sh
npm run build
npm run preview -- --host --port 4173
```
The preview server listens on port 4173 by default.

## Using the planner
- Preloaded defaults showcase the flow; update any field to reflect your situation.
- Add one-off spends with the **Other planned expenses** section (age + amount).
- Copy the markdown table for reports via **Copy markdown table**.
- Reset back to sample values with **Reset to defaults**.
