import { MarketSignal, SignalType } from '../types';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

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

  const isBullish =
    rsi < 70 &&
    rsi > 30 &&
    currentPrice > ma20 &&
    change24h > 0 &&
    volumeRatio > 1.2;

  const isBearish =
    rsi > 30 &&
    rsi < 70 &&
    currentPrice < ma20 &&
    change24h < 0 &&
    volumeRatio > 1.2;

  if (isBullish) return SignalType.LONG;
  if (isBearish) return SignalType.SHORT;
  return SignalType.NEUTRAL;
};

const calculateConfidence = (indicators: TechnicalIndicators, change24h: number, signalType: SignalType): number => {
  const { rsi, volumeRatio, currentPrice, ma20 } = indicators;

  let confidence = 50;

  if (signalType === SignalType.LONG) {
    if (rsi > 40 && rsi < 65) confidence += 15;
    if (currentPrice > ma20) confidence += 10;
    if (volumeRatio > 1.5) confidence += 12;
    if (change24h > 2) confidence += 8;
    if (change24h > 5) confidence += 5;
  } else if (signalType === SignalType.SHORT) {
    if (rsi > 35 && rsi < 60) confidence += 15;
    if (currentPrice < ma20) confidence += 10;
    if (volumeRatio > 1.5) confidence += 12;
    if (change24h < -2) confidence += 8;
    if (change24h < -5) confidence += 5;
  }

  return Math.min(95, Math.max(60, confidence));
};

const generateSummary = (signalType: SignalType, indicators: TechnicalIndicators, change24h: number): string => {
  const { rsi, volumeRatio } = indicators;

  if (signalType === SignalType.LONG) {
    if (volumeRatio > 1.5 && change24h > 3) {
      return 'Volume đột biến, phá vỡ cản trên. Lực mua mạnh.';
    }
    if (rsi < 50 && change24h > 0) {
      return 'AI phát hiện lực mua gom mạnh tại vùng giá hỗ trợ.';
    }
    return 'Xu hướng tăng được hỗ trợ bởi volume và momentum.';
  } else if (signalType === SignalType.SHORT) {
    if (volumeRatio > 1.5 && change24h < -3) {
      return 'Mô hình nêm giảm, RSI phân kỳ. Áp lực bán tăng.';
    }
    if (rsi > 50 && change24h < 0) {
      return 'Chạm kháng cự mạnh, khả năng điều chỉnh cao.';
    }
    return 'Xu hướng giảm với volume tăng.';
  }

  return 'Thị trường đang trong trạng thái trung tính. Nên chờ tín hiệu rõ ràng hơn.';
};

const getTimeframe = (volumeRatio: number): string => {
  if (volumeRatio > 2) return '15m';
  if (volumeRatio > 1.5) return '1H';
  return '4H';
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
            exchange: 'Binance Perp',
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

export {
  getTickerData,
  getKlineData,
  getMarketData,
  calculateTechnicalIndicators,
  generateSignals,
  getBTCContext
};

