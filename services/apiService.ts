import { MarketSignal, SignalType } from '../types';
import { generateSignals, getMarketData as getBinanceMarketData } from './binanceService';

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
    const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'RENDERUSDT'];
    const symbolsToFetch = symbols || defaultSymbols;
    const signals = await generateSignals(symbolsToFetch);
    return signals;
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
    // List of coins to monitor for alerts (using popular/volatile coins for interesting alerts)
    const alertSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'RENDERUSDT', 'BNBUSDT', 'PEPEUSDT'];

    // Get signals for these symbols using the existing service
    const signals = await generateSignals(alertSymbols);

    // Transform MarketSignal objects into the alert format expected by UI
    return signals.map(signal => {
      const baseSymbol = signal.pair.split('/')[0];

      let type = 'Sit Out';
      let color = 'text-text-secondary';
      let bg = 'bg-slate-500/10';

      if (signal.type === SignalType.LONG) {
        type = 'Entry Long';
        color = 'text-bullish';
        bg = 'bg-green-500/10';
      } else if (signal.type === SignalType.SHORT) {
        type = 'Entry Short';
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
