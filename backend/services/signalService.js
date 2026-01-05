import { getMarketData } from './cryptoService.js';

const formatPairName = (symbol) => {
  const base = symbol.replace('USDT', '');
  return `${base}/USDT`;
};

const determineSignalType = (indicators, change24h) => {
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
  
  if (isBullish) return 'LONG';
  if (isBearish) return 'SHORT';
  return 'SIT OUT';
};

const calculateConfidence = (indicators, change24h, signalType) => {
  const { rsi, volumeRatio, currentPrice, ma20 } = indicators;
  
  let confidence = 50;
  
  if (signalType === 'LONG') {
    if (rsi > 40 && rsi < 65) confidence += 15;
    if (currentPrice > ma20) confidence += 10;
    if (volumeRatio > 1.5) confidence += 12;
    if (change24h > 2) confidence += 8;
    if (change24h > 5) confidence += 5;
  } else if (signalType === 'SHORT') {
    if (rsi > 35 && rsi < 60) confidence += 15;
    if (currentPrice < ma20) confidence += 10;
    if (volumeRatio > 1.5) confidence += 12;
    if (change24h < -2) confidence += 8;
    if (change24h < -5) confidence += 5;
  }
  
  return Math.min(95, Math.max(60, confidence));
};

const generateSummary = (signalType, indicators, change24h) => {
  const { rsi, volumeRatio } = indicators;
  
  if (signalType === 'LONG') {
    if (volumeRatio > 1.5 && change24h > 3) {
      return 'Volume đột biến, phá vỡ cản trên. Lực mua mạnh.';
    }
    if (rsi < 50 && change24h > 0) {
      return 'AI phát hiện lực mua gom mạnh tại vùng giá hỗ trợ.';
    }
    return 'Xu hướng tăng được hỗ trợ bởi volume và momentum.';
  } else if (signalType === 'SHORT') {
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

const getTimeframe = (volumeRatio) => {
  if (volumeRatio > 2) return '15m';
  if (volumeRatio > 1.5) return '1H';
  return '4H';
};

const formatTimestamp = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const generateSignals = async (symbols) => {
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
          };
        } catch (error) {
          console.error(`Error generating signal for ${symbol}:`, error);
          return null;
        }
      })
    );
    
    return signals.filter(signal => signal !== null);
  } catch (error) {
    console.error('Error generating signals:', error);
    throw error;
  }
};

export { generateSignals };

