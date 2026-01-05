const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

const formatSymbol = (symbol) => {
  if (symbol.includes('/')) {
    return symbol.replace('/', '');
  }
  return symbol.toUpperCase();
};

const getTickerData = async (symbol) => {
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

const getKlineData = async (symbol, interval = '1h', limit = 100) => {
  try {
    const formattedSymbol = formatSymbol(symbol);
    const response = await fetch(
      `${BINANCE_API_BASE}/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map(kline => ({
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

const calculateRSI = (prices, period = 14) => {
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

const calculateMA = (prices, period) => {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
};

const calculateTechnicalIndicators = async (symbol) => {
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

const getMarketData = async (symbol) => {
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
};

export { getTickerData, getKlineData, getMarketData, calculateTechnicalIndicators };

