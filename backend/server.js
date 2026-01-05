import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getMarketData, getTickerData, calculateTechnicalIndicators } from './services/cryptoService.js';
import { generateSignals } from './services/signalService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/market/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const tickerData = await getTickerData(symbol);
    res.json(tickerData);
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const marketData = await getMarketData(symbol);
    res.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT'];
    const signals = await generateSignals(symbols);
    res.json(signals);
  } catch (error) {
    console.error('Error generating signals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const signals = await generateSignals([symbol]);
    res.json(signals[0] || null);
  } catch (error) {
    console.error('Error generating signal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const btcSignal = await generateSignals(['BTCUSDT']);
    res.json(btcSignal[0] || null);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error('Please either:');
    console.error(`  1. Kill the process using port ${PORT}: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`  2. Or change PORT in .env file\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

