import { MarketSignal, SignalType } from '../types';
import { generateSignals, getMarketData as getBinanceMarketData, scanTopMarketCoins } from './binanceService';

export const getDashboardSignal = async (): Promise<MarketSignal | null> => {
  try {
    const signals = await generateSignals(['BTCUSDT']);
    return signals[0] || null;
  } catch (error) {
    console.error('Error fetching dashboard signal:', error);
    return null;
  }
};

export const getSignals = async (symbols?: string[]): Promise<MarketSignal[]> => {
  try {
    let symbolsToFetch = symbols;

    // If no specific symbols requested, use Smart Scanner
    if (!symbolsToFetch) {
      // Step 1: Get Top 20 High-Volume Candidates (Liquidity Filter)
      const topCoins = await scanTopMarketCoins();
      symbolsToFetch = topCoins.length > 0 ? topCoins : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    }

    // Step 2: Analysis & Scoring (Confluence Score)
    const signals = await generateSignals(symbolsToFetch);

    // Step 3: Smart Sorting (Rank by Confidence Score)
    // Sort descending: High Confidence -> Low Confidence
    return signals.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    console.error('Error fetching signals:', error);
    return [];
  }
};

export const getSignalBySymbol = async (symbol: string): Promise<MarketSignal | null> => {
  try {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const signals = await generateSignals([formattedSymbol]);
    return signals[0] || null;
  } catch (error) {
    console.error('Error fetching signal:', error);
    return null;
  }
};

export const getMarketData = async (symbol: string) => {
  try {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const data = await getBinanceMarketData(formattedSymbol);
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
};


export const getRecentAlerts = async (): Promise<any[]> => {
  try {
    // OLD: Linked to hardcoded list -> NEW: Link to Smart Scanner
    // Get Top Market Candidates (Dynamic)
    const topCoins = await scanTopMarketCoins();

    // Select top 20 for Alerts to keep performance high
    const alertSymbols = topCoins.slice(0, 20);

    // Get signals for these symbols using the existing service
    const signals = await generateSignals(alertSymbols);

    // 1. Filter out weak signals (Sit Out)
    const activeSignals = signals.filter(s => s.type !== SignalType.NEUTRAL);

    // 2. Sort by "Hotness" (Confidence score) -> Highest first
    const sortedSignals = activeSignals.sort((a, b) => b.confidence - a.confidence);

    // 3. Take Top 10 High Quality Alerts
    const topAlerts = sortedSignals.slice(0, 10);

    // Transform MarketSignal objects into the alert format expected by UI
    return topAlerts.map(signal => {
      const baseSymbol = signal.pair.split('/')[0];

      let type = 'Sit Out';
      let color = 'text-text-secondary';
      let bg = 'bg-slate-500/10';

      if (signal.type === SignalType.LONG) {
        type = 'Entry Long (Buy)';
        color = 'text-bullish';
        bg = 'bg-green-500/10';
      } else if (signal.type === SignalType.SHORT) {
        type = 'Bearish (Avoid/Sell)';
        color = 'text-bearish';
        bg = 'bg-red-500/10';
      }

      return {
        pair: baseSymbol,
        type: type,
        time: signal.timeframe, // Use timeframe to indicate the basis of the signal
        color: color,
        icon: baseSymbol.charAt(0),
        bg: bg
      };
    });
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return [];
  }
};

export const getFearAndGreedIndex = async () => {
  try {
    const response = await fetch('https://api.alternative.me/fng/');
    const data = await response.json();
    return {
      value: parseInt(data.data[0].value),
      classification: data.data[0].value_classification
    };
  } catch (error) {
    console.error('Error fetching Fear & Greed:', error);
    return { value: 50, classification: 'Neutral' };
  }
};
