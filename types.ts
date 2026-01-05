
export enum SignalType {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'SIT OUT'
}

export interface MarketSignal {
  id: string;
  pair: string;
  exchange: string;
  price: number;
  change24h: number;
  type: SignalType;
  confidence: number;
  timeframe: string;
  timestamp: string;
  summary: string;
  volume24h?: number;
  rsi?: number;
  support?: number;
  resistance?: number;
}

export interface TradeAlert {
  id: string;
  pair: string;
  type: SignalType;
  timeAgo: string;
  icon: string;
}

export type View = 'dashboard' | 'signals' | 'journal' | 'details' | 'setup';
