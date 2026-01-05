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
    const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT'];
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

