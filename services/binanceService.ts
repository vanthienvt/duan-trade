import { MarketSignal, SignalType } from '../types';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const BINANCE_FAPI_BASE = 'https://fapi.binance.com/fapi/v1';

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
  count: number;
}

interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

interface TechnicalIndicators {
  rsi: number;
  ma20: number;
  ma50: number;
  currentPrice: number;
  volumeRatio: number;
  support: number;
  resistance: number;
}

interface MarketData extends TickerData, TechnicalIndicators {
  timestamp: string;
}

const formatSymbol = (symbol: string): string => {
  if (symbol.includes('/')) {
    return symbol.replace('/', '');
  }
  return symbol.toUpperCase();
};

const getTickerData = async (symbol: string): Promise<TickerData> => {
  try {
    const formattedSymbol = formatSymbol(symbol);
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${formattedSymbol}`);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
      count: parseInt(data.count)
    };
  } catch (error) {
    console.error(`Error fetching ticker for ${symbol}:`, error);
    throw error;
  }
};

const getKlineData = async (symbol: string, interval: string = '1h', limit: number = 100): Promise<KlineData[]> => {
  try {
    const formattedSymbol = formatSymbol(symbol);
    const response = await fetch(
      `${BINANCE_API_BASE}/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((kline: any[]) => ({
      openTime: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      closeTime: kline[6],
      quoteVolume: parseFloat(kline[7]),
      trades: parseInt(kline[8])
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    throw error;
  }
};

const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
};

const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  // Better precision with slice for recent part if needed, but standard EMA is recursive.
  // For simplicity on small arrays:
  let trendEMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period; // Start with SMA
  for (let i = period; i < prices.length; i++) {
    trendEMA = (prices[i] - trendEMA) * k + trendEMA;
  }
  return trendEMA;
};

const calculateTechnicalIndicators = async (symbol: string): Promise<TechnicalIndicators> => {
  try {
    const klines1h = await getKlineData(symbol, '1h', 50);
    const klines4h = await getKlineData(symbol, '4h', 50);
    const closes1h = klines1h.map(k => k.close);
    const closes4h = klines4h.map(k => k.close);

    const rsi14 = calculateRSI(closes1h, 14);
    const ma20 = calculateMA(closes1h, 20);
    const ma50 = calculateMA(closes4h, 50);
    const currentPrice = closes1h[closes1h.length - 1];

    const volume = klines1h[klines1h.length - 1].volume;
    const avgVolume = klines1h.slice(-20).reduce((sum, k) => sum + k.volume, 0) / 20;
    const volumeRatio = volume / avgVolume;

    return {
      rsi: Math.round(rsi14),
      ma20,
      ma50,
      currentPrice,
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      support: currentPrice * 0.96,
      resistance: currentPrice * 1.05
    };
  } catch (error) {
    console.error(`Error calculating indicators for ${symbol}:`, error);
    return {
      rsi: 50,
      ma20: 0,
      ma50: 0,
      currentPrice: 0,
      volumeRatio: 1,
      support: 0,
      resistance: 0
    };
  }
};

const getMarketData = async (symbol: string): Promise<MarketData> => {
  try {
    const ticker = await getTickerData(symbol);
    const indicators = await calculateTechnicalIndicators(symbol);

    return {
      ...ticker,
      ...indicators,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw error;
  }
}
const getBTCContext = async () => {
  try {
    const klines4h = await getKlineData('BTCUSDT', '4h', 200);
    const klines1d = await getKlineData('BTCUSDT', '1d', 50);

    const closes4h = klines4h.map(k => k.close);
    const closes1d = klines1d.map(k => k.close);
    const currentPrice = closes4h[closes4h.length - 1];

    const ema20_4h = calculateEMA(closes4h, 20);
    const ema50_4h = calculateEMA(closes4h, 50);
    const ema200_4h = calculateEMA(closes4h, 200);

    const trend = {
      price: currentPrice,
      ema20_4h,
      ema50_4h,
      ema200_4h,
      rsi_4h: calculateRSI(closes4h, 14),
      trend_4h: currentPrice > ema200_4h ? 'UP' : 'DOWN',
      momentum: currentPrice > ema20_4h ? 'STRONG' : 'WEAK'
    };

    return trend;
  } catch (error) {
    console.error('Error fetching BTC context:', error);
    return null;
  }
};

const formatPairName = (symbol: string): string => {
  const base = symbol.replace('USDT', '');
  return `${base}/USDT`;
};

const determineSignalType = (indicators: TechnicalIndicators, change24h: number): SignalType => {
  const { rsi, currentPrice, ma20, volumeRatio } = indicators;

  // More sensitive conditions
  const isBullish =
    (rsi < 65 && rsi > 40 && currentPrice > ma20) || // Trend following
    (rsi < 30 && volumeRatio > 1.5); // Oversold rejection

  const isBearish =
    (rsi > 35 && rsi < 60 && currentPrice < ma20) || // Trend following
    (rsi > 70 && volumeRatio > 1.5); // Overbought rejection

  if (isBullish) return SignalType.LONG;
  if (isBearish) return SignalType.SHORT;
  return SignalType.NEUTRAL;
};


const calculateConfluenceScore = (indicators: TechnicalIndicators, signalType: SignalType, change24h: number): { score: number, reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  const { rsi, currentPrice, ma20, ma50, volumeRatio, resistance, support } = indicators;

  // 1. Trend Alignment (Key factor)
  if (signalType === SignalType.LONG) {
    if (currentPrice > ma50) { score += 1.5; reasons.push('Uptrend (Price > MA50)'); }
    if (ma20 > ma50) { score += 1; reasons.push('Golden Cross (MA20 > MA50)'); }
  } else if (signalType === SignalType.SHORT) {
    if (currentPrice < ma50) { score += 1.5; reasons.push('Downtrend (Price < MA50)'); }
    if (ma20 < ma50) { score += 1; reasons.push('Death Cross (MA20 < MA50)'); }
  }

  // 2. Momentum (RSI)
  if (signalType === SignalType.LONG) {
    if (rsi > 40 && rsi < 65) { score += 1; reasons.push('RSI Bullish Zone'); }
    else if (rsi < 30) { score += 1.5; reasons.push('RSI Oversold (Bounce likely)'); }
  } else if (signalType === SignalType.SHORT) {
    if (rsi < 60 && rsi > 35) { score += 1; reasons.push('RSI Bearish Zone'); }
    else if (rsi > 70) { score += 1.5; reasons.push('RSI Overbought (Rejection likely)'); }
  }

  // 3. Volume Confirmation
  if (volumeRatio > 1.2) { score += 1; reasons.push(`High Volume (x${volumeRatio})`); }

  // 4. Structure
  if (signalType === SignalType.LONG) {
    const distToSupport = (currentPrice - support) / currentPrice;
    if (distToSupport < 0.02) { score += 1; reasons.push('Near Support Area'); }
  } else if (signalType === SignalType.SHORT) {
    const distToRes = (resistance - currentPrice) / currentPrice;
    if (distToRes < 0.02) { score += 1; reasons.push('Near Resistance Area'); }
  }

  // Cap score at 10 for normalization logic
  return { score: Math.min(score, 6), reasons }; // Max realistic score ~6
};

const calculateConfidence = (indicators: TechnicalIndicators, change24h: number, signalType: SignalType): number => {
  const { score } = calculateConfluenceScore(indicators, signalType, change24h);

  // Normalize score 0-6 to percentage 30-95
  // Score 0-1: Weak (30-40%)
  // Score 2-3: Medium (50-65%)
  // Score 4: Strong (75%)
  // Score 5+: Very Strong (85%+)

  let baseConfidence = 30;
  if (score >= 5) baseConfidence = 85 + (score - 5) * 5;
  else if (score >= 4) baseConfidence = 75 + (score - 4) * 10;
  else if (score >= 2) baseConfidence = 50 + (score - 2) * 12;
  else baseConfidence = 30 + score * 10;

  return Math.min(98, Math.round(baseConfidence));
};

const generateSummary = (signalType: SignalType, indicators: TechnicalIndicators, change24h: number): string => {
  const { reasons } = calculateConfluenceScore(indicators, signalType, change24h);

  if (reasons.length === 0) return 'Tín hiệu yếu, chưa có nhiều yếu tố ủng hộ.';

  // Combine top 2-3 reasons
  return reasons.slice(0, 3).join('. ') + '.';
};

const getTimeframe = (volumeRatio: number): string => {
  // Higher volume = Lower timeframe reaction needed
  if (volumeRatio > 3.0) return '15m (Scalp)';
  if (volumeRatio > 1.5) return '1H (Intraday)';
  return '4H (Swing)';
};

const formatTimestamp = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const generateSignals = async (symbols: string[]): Promise<MarketSignal[]> => {
  try {
    const signals = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const marketData = await getMarketData(symbol);
          const pair = formatPairName(symbol);

          const signalType = determineSignalType(marketData, marketData.change24h);
          const confidence = calculateConfidence(marketData, marketData.change24h, signalType);
          const summary = generateSummary(signalType, marketData, marketData.change24h);
          const timeframe = getTimeframe(marketData.volumeRatio);

          return {
            id: symbol.toLowerCase(),
            pair,
            exchange: 'Binance Spot',
            price: marketData.price,
            change24h: parseFloat(marketData.change24h.toFixed(2)),
            type: signalType,
            confidence: Math.round(confidence),
            timeframe,
            timestamp: formatTimestamp(),
            summary,
            volume24h: marketData.volume24h,
            rsi: marketData.rsi,
            support: marketData.support,
            resistance: marketData.resistance
          } as MarketSignal;
        } catch (error) {
          console.error(`Error generating signal for ${symbol}:`, error);
          return null;
        }
      })
    );

    return signals.filter((signal): signal is MarketSignal => signal !== null);
  } catch (error) {
    console.error('Error generating signals:', error);
    throw error;
  }
};


const getOpenInterest = async (symbol: string): Promise<string> => {
  try {
    const formattedSymbol = symbol.toUpperCase().replace('/', '');
    const response = await fetch(`${BINANCE_FAPI_BASE}/openInterest?symbol=${formattedSymbol}`);
    const data = await response.json();
    return (parseFloat(data.openInterest)).toLocaleString();
  } catch (error) {
    console.error('Error OI:', error);
    return 'N/A';
  }
};

const getFundingRate = async (symbol: string): Promise<string> => {
  try {
    const formattedSymbol = symbol.toUpperCase().replace('/', '');
    const response = await fetch(`${BINANCE_FAPI_BASE}/premiumIndex?symbol=${formattedSymbol}`);
    const data = await response.json();
    return (parseFloat(data.lastFundingRate) * 100).toFixed(4) + '%';
  } catch (error) {
    console.error('Error Funding:', error);
    return '0.0100%';
  }
};


// New Function: Scan Top 15 Coins by Volume
const scanTopMarketCoins = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr`);
    const data = await response.json();

    // Filter USDT pairs, exclude stablecoins/leverage tokens
    const validPairs = data.filter((t: any) =>
      t.symbol.endsWith('USDT') &&
      !t.symbol.includes('UP') &&
      !t.symbol.includes('DOWN') &&
      !['USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'DAIUSDT'].includes(t.symbol)
    );

    // Sort by Quote Volume (Liquidity) -> Top 20
    const topCoins = validPairs
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map((t: any) => t.symbol);

    return topCoins;
  } catch (error) {
    console.error('Scanner Error:', error);
    // Fallback if API fails
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
  }
};

export {
  getTickerData,
  getKlineData,
  getMarketData,
  calculateTechnicalIndicators,
  generateSignals,
  getBTCContext,
  getOpenInterest,
  getFundingRate,
  scanTopMarketCoins
};

