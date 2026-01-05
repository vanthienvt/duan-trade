<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Tq6qQnOAznCjPLrYLthy4AqCelPcNb-x

## Run Locally

**Prerequisites:**  Node.js

### Quick Start (Recommended)

1. Install all dependencies (backend and frontend):
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   VITE_API_URL=http://localhost:3001
   ```

3. Run both backend and frontend:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3001
   - Frontend app on http://localhost:3000

### Manual Start

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev:frontend
```

### API Endpoints

- `GET /health` - Health check
- `GET /api/dashboard` - Get dashboard signal (BTC)
- `GET /api/signals` - Get all signals
- `GET /api/signals/:symbol` - Get signal for specific symbol
- `GET /api/market/data/:symbol` - Get market data for symbol
