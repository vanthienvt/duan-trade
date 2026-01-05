import { MarketSignal } from '../types';
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return dynamic signals based on current time
  const now = new Date();
  const minutes = now.getMinutes();

  return [
    {
      pair: 'SOL',
      type: minutes % 2 === 0 ? 'Entry Long' : 'Entry Short',
      time: '2m',
      color: minutes % 2 === 0 ? 'text-bullish' : 'text-bearish',
      icon: 'S',
      bg: 'bg-indigo-500/10'
    },
    {
      pair: 'BTC',
      type: 'Sit Out',
      time: '5m',
      color: 'text-text-secondary',
      icon: 'B',
      bg: 'bg-orange-500/10'
    },
    {
      pair: 'ETH',
      type: minutes % 3 === 0 ? 'Short Setup' : 'Long Setup',
      time: '12m',
      color: minutes % 3 === 0 ? 'text-bearish' : 'text-bullish',
      icon: 'E',
      bg: 'bg-blue-500/10'
    },
    {
      pair: 'DOGE',
      type: 'Entry Long',
      time: '15m',
      color: 'text-bullish',
      icon: 'D',
      bg: 'bg-yellow-500/10'
    },
    {
      pair: 'RENDER',
      type: minutes % 4 === 0 ? 'Sit Out' : 'Long Setup',
      time: '18m',
      color: minutes % 4 === 0 ? 'text-text-secondary' : 'text-bullish',
      icon: 'R',
      bg: 'bg-purple-500/10'
    }
  ];
};
