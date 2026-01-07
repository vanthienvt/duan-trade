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
  openInterest: string;
  oiTrend: 'UP' | 'DOWN' | 'NEUTRAL';
  fundingRate: string;
  support: number;
  resistance: number;
}

interface MarketData extends TickerData, TechnicalIndicators {
  timestamp: string;
}

// Global Ticker Cache
let tickerCache: Map<string, TickerData> = new Map();
let lastCacheUpdate = 0;
const CACHE_TTL = 10000; // 10 seconds

const formatSymbol = (symbol: string): string => {
  if (symbol.includes('/')) {
    return symbol.replace('/', '');
  }
  return symbol.toUpperCase();
};

const getTickerData = async (symbol: string): Promise<TickerData> => {
  try {
    const formattedSymbol = formatSymbol(symbol);

    // 1. Check Cache first
    if (tickerCache.has(formattedSymbol)) {
      const cached = tickerCache.get(formattedSymbol);
      if (Date.now() - lastCacheUpdate < CACHE_TTL && cached) {
        return cached;
      }
    }

    // 2. Fetch if not in cache
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

// Helper to safely get OI/Funding with FASTEST Proxy Race Strategy
const getProData = async (symbol: string) => {
  const formatted = symbol.replace('/', '');
  const timestamp = Date.now();

  // Custom Promise.any implementation for broad compatibility
  const raceSuccess = (promises: Promise<any>[]) => {
    return Promise.all(
      promises.map(p => {
        // Init a promise that resolves on success, but rejects on failure 
        // to allow Promise.all to wait, effectively implementing "first success" via inversion?
        // Actually, a simple race wrapper is better:
        return p.then(
          val => Promise.reject(val), // If success, reject wrapping promise to catch it early? 
          // No, that's messy. Let's use a standard "First Success" loop or helper.
          err => Promise.resolve(null) // Converting errors to null for checking
        );
      })
    ).then(
      () => null, // If all resolved to null (meaning all failed original p), return null
      val => val // If one "rejected" (meaning succeeded), we catch it here? No.
    );
    // Let's stick to a simpler async loop that fires all but handles results smartly
    // ensuring we pick the first *valid* one.
  };

  // 1. Define Request Creators
  const createRequests = (endpoint: string) => {
    const targetUrl = `${BINANCE_FAPI_BASE}${endpoint}&symbol=${formatted}&_t=${timestamp}`;

    // Proxy Candidates - Ordered by usual speed
    const candidates = [
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
    ];

    return candidates.map(async (url) => {
      try {
        // Set a timeout for each request to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Status ' + res.status);
        const data = await res.json();
        // Basic validation check
        if (data && (data.contents || data.openInterest || data.lastFundingRate || Array.isArray(data))) {
          return data.contents ? JSON.parse(data.contents) : data; // Handle AllOrigins JSON wrapper if used, or plain JSON
        }
        throw new Error('Invalid data');
      } catch (e) {
        throw e;
      }
    });
  };

  // 2. The Racer: Returns first successful promise
  const fetchFastest = async (endpoint: string) => {
    const requests = createRequests(endpoint);
    try {
      // Promise.any is ES2021. Polyfill approach:
      return await Promise.any(requests);
    } catch (aggregateError) {
      return null; // All failed
    }
  };

  try {
    const [oiData, fundData, oiHistData] = await Promise.all([
      fetchFastest('/openInterest?'),
      fetchFastest('/premiumIndex?'),
      fetchFastest('/openInterestHist?period=1h&limit=2')
    ]);

    const openInterest = oiData?.openInterest || '0';
    const fundingRate = fundData?.lastFundingRate || '0';
    const oiHist = Array.isArray(oiHistData) ? oiHistData : [];

    // Determine OI Trend
    let oiTrend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (oiHist && oiHist.length >= 2) {
      const current = parseFloat(oiHistData[1].sumOpenInterest);
      const prev = parseFloat(oiHistData[0].sumOpenInterest);
      if (current > prev * 1.01) oiTrend = 'UP';
      else if (current < prev * 0.99) oiTrend = 'DOWN';
    }

    return {
      openInterest: parseFloat(openInterest),
      fundingRate: parseFloat(fundingRate),
      oiTrend
    };
  } catch (e) {
    console.error('Pro Data Error (All Proxies Failed):', e);
    return { openInterest: 0, fundingRate: 0, oiTrend: 'NEUTRAL' as const };
  }
};


const calculateTechnicalIndicators = async (symbol: string, skipProData: boolean = false): Promise<TechnicalIndicators> => {
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

    // Fetch Pro Data (OI & Funding) - ONLY if requested
    // Skipping this saves ~3s per coin and prevents proxy rate limits
    let openInterest = 'N/A';
    let fundingRate = '0.0000%';
    let oiTrend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';

    if (!skipProData) {
      const proData = await getProData(symbol);
      openInterest = (proData.openInterest).toLocaleString();
      fundingRate = (proData.fundingRate * 100).toFixed(4) + '%';
      oiTrend = proData.oiTrend;
    }

    return {
      rsi: Math.round(rsi14),
      ma20,
      ma50,
      currentPrice,
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      openInterest,
      oiTrend,
      fundingRate,
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
      openInterest: 'N/A',
      oiTrend: 'NEUTRAL',
      fundingRate: '0.0000%',
      support: 0,
      resistance: 0
    };
  }
};

const getMarketData = async (symbol: string, skipProData: boolean = false): Promise<MarketData> => {
  try {
    const ticker = await getTickerData(symbol);
    const indicators = await calculateTechnicalIndicators(symbol, skipProData);

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
  const { rsi, currentPrice, ma20, ma50, volumeRatio, fundingRate, oiTrend } = indicators;

  const fRate = parseFloat(fundingRate.replace('%', ''));

  // 1. Trend Alignment
  if (signalType === SignalType.LONG) {
    if (currentPrice > ma50) {
      score += 1.5;
      reasons.push(`Xu hướng giá tăng ổn định`);
    }
    if (ma20 > ma50) {
      score += 1.0;
      reasons.push(`Lực mua đang áp đảo`);
    }
  } else if (signalType === SignalType.SHORT) {
    if (currentPrice < ma50) {
      score += 1.5;
      reasons.push(`Xu hướng giá giảm`);
    }
    if (ma20 < ma50) {
      score += 1.0;
      reasons.push(`Áp lực bán mạnh`);
    }
  }

  // 2. Momentum (RSI) - Add granular score based on exact RSI value
  if (signalType === SignalType.LONG) {
    if (rsi > 40 && rsi < 65) {
      score += 1.0 + (rsi % 10) / 20; // Variance
      reasons.push(`Động lượng tốt`);
    } else if (rsi < 30) {
      score += 1.5;
      reasons.push(`Vùng quá bán (lực bật đáy)`);
    }
  } else if (signalType === SignalType.SHORT) {
    if (rsi < 60 && rsi > 35) {
      score += 1.0 + (rsi % 10) / 20; // Variance
      reasons.push(`Động lượng giảm`);
    } else if (rsi > 70) {
      score += 1.5;
      reasons.push(`Vùng quá mua (sắp chỉnh)`);
    }
  }

  // 3. Pro Indicators (OI & Funding)
  // Logic: Price Trend + OI Up = Strong Trend. Price Trend + OI Down = Weak Trend.

  if (oiTrend === 'UP') {
    score += 1.0;
    reasons.push('Dòng tiền mở (OI) tăng mạnh');
  } else if (oiTrend === 'DOWN') {
    // No penalty, just no boost. Or maybe small penalty if this was supposed to be a breakout.
  }

  // Funding Rate Penalty/Boost
  if (Math.abs(fRate) > 0.05) {
    if ((signalType === SignalType.LONG && fRate < 0) || (signalType === SignalType.SHORT && fRate > 0)) {
      score += 0.5; // Funding favors trade
      reasons.push('Funding ủng hộ');
    } else {
      score -= 0.5; // Crowded trade (reduced penalty)
    }
  }

  // 4. Volume
  if (volumeRatio > 1.2) {
    score += 1.0 + Math.min(volumeRatio / 5, 0.5); // Variance
    reasons.push(`Dòng tiền vào mạnh`);
  }

  // 4. Strong Move
  if (Math.abs(change24h) > 2.0) {
    score += 0.5;
    // Don't add text, keep it simple
  }

  return { score, reasons };
};

const calculateConfidence = (indicators: TechnicalIndicators, change24h: number, signalType: SignalType): number => {
  const { score } = calculateConfluenceScore(indicators, signalType, change24h);

  // Map Score to %
  // Max score is around 7-8. 
  // We want realistic confidence: 50-85%. Very rarely >90%.

  let baseConfidence = 50;
  baseConfidence += (score * 5); // Each point = 5%

  // Cap at 88% unless truly exceptional
  const maxCap = score > 6.5 ? 92 : 85;

  // Add small noise
  const noise = (indicators.rsi * 10) % 3;

  return Math.min(maxCap, Math.round(baseConfidence + noise));
};

const generateSummary = (signalType: SignalType, indicators: TechnicalIndicators, change24h: number): string => {
  const { reasons } = calculateConfluenceScore(indicators, signalType, change24h);

  if (reasons.length === 0) return 'Thị trường đi ngang, chờ tín hiệu rõ ràng.';

  // Return a concise sentence
  // e.g. "Xu hướng giá tăng ổn định. Động lượng tốt."
  // Limit to 2 sentences max
  return reasons.slice(0, 2).join('. ') + '.';
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
    const BATCH_SIZE = 5; // Process 5 coins at a time to prevent network bottleneck
    const signals: MarketSignal[] = [];

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (symbol) => {
        try {
          // Skip Pro Data (OI/Funding) for List View -> MASSIVE SPEEDUP
          const marketData = await getMarketData(symbol, true);
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
            openInterest: marketData.openInterest,
            fundingRate: marketData.fundingRate,
            support: marketData.support,
            resistance: marketData.resistance
          } as MarketSignal;
        } catch (error) {
          console.error(`Error generating signal for ${symbol}:`, error);
          return null;
        }
      });

      // Wait for current batch to finish before starting next batch
      const batchResults = await Promise.all(batchPromises);
      signals.push(...batchResults.filter((s): s is MarketSignal => s !== null));
    }

    return signals;
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


// New Function: Scan Top 50 Coins by Volume (Smart Scan)
const scanTopMarketCoins = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr`);
    const data = await response.json();

    // CLEAR OLD CACHE
    tickerCache.clear();
    lastCacheUpdate = Date.now();

    // Populate Cache with fresh data
    data.forEach((t: any) => {
      tickerCache.set(t.symbol, {
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume24h: parseFloat(t.volume),
        quoteVolume: parseFloat(t.quoteVolume),
        count: parseInt(t.count)
      });
    });

    // Filter USDT pairs, exclude stablecoins/leverage tokens/old pairs
    const validPairs = data.filter((t: any) =>
      t.symbol.endsWith('USDT') &&
      !t.symbol.includes('UP') &&
      !t.symbol.includes('DOWN') &&
      !t.symbol.includes('BEAR') &&
      !t.symbol.includes('BULL') &&
      !['USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 'BUSDUSDT', 'USDPUSDT', 'EURUSDT'].includes(t.symbol)
    );

    // Sort by Quote Volume (Liquidity) -> Top 50
    const topCoins = validPairs
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 50)
      .map((t: any) => t.symbol);

    return topCoins;
  } catch (error) {
    console.error('Scanner Error:', error);
    // Fallback if API fails
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'SHIBUSDT', 'PEPEUSDT', 'LINKUSDT'];
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
