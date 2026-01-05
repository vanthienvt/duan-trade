import React, { useState, useEffect } from 'react';
import { View, MarketSignal, SignalType } from '../types';
import { getSignals } from '../services/apiService';
import { getBTCContext, scanTopMarketCoins } from '../services/binanceService';
import SettingsModal from '../components/SettingsModal';
import { sendTelegramAlert } from '../services/telegramService';

interface Props {
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const SignalList: React.FC<Props> = ({ onNavigate }) => {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [btcTrend, setBtcTrend] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('NEUTRAL');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [showSettings, setShowSettings] = useState(false);
  const [sentAlerts] = useState(new Set<string>()); // Session based spam prevention

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Scan Market for Top Coins
      const topCoins = await scanTopMarketCoins();

      // 2. Fetch Signals & Context
      const [data, btcContext] = await Promise.all([
        getSignals(topCoins),
        getBTCContext()
      ]);

      // TELEGRAM ALERT LOGIC
      data.forEach(signal => {
        // Condition: Strong Confidence (>=95%) AND Strong Trend (Long/Short) AND Not Sent Yet
        if (signal.confidence >= 95 && signal.type !== SignalType.NEUTRAL) {
          const alertKey = `${signal.pair}-${signal.type}-${signal.timeframe}`;
          if (!sentAlerts.has(alertKey)) {
            const icon = signal.type === SignalType.LONG ? '🟢' : '🔴';
            const msg = `${icon} *TÍN HIỆU HOT: ${signal.pair}*\n\n` +
              `• Xu hướng: *${signal.type}*\n` +
              `• Giá: $${signal.price.toLocaleString()}\n` +
              `• Uy tín: ${signal.confidence}%\n` +
              `• Lý do: ${signal.summary}\n\n` +
              `👉 Vào App xem chi tiết!`;

            sendTelegramAlert(msg);
            sentAlerts.add(alertKey);
          }
        }
      });

      setBtcTrend(btcContext ? btcContext.trend_4h as 'UP' | 'DOWN' : 'NEUTRAL');

      // Part 6: Filter Logic
      // If BTC is UP, prioritize Longs. If BTC is DOWN, prioritize Shorts.
      // If BTC Context is not null, we can strictly filter or just sort.
      // For strict 10-part system: "If trend... don't align? No trade."


      // Global Sort: ALWAYS sort by Strength (Buy > Sell > Neutral) & Confidence
      // We process the list regardless of BTC context to ensure sorting is consistent

      const listToSort = btcContext ?
        // If BTC Filter active: Hide opposing signals? Or just de-prioritize?
        // User asked for "Strong Buy on Top". Strict filter might hide them if BTC is down.
        // Let's keep the filter but SORT what remains.
        data.filter(s => {
          const trend = btcContext.trend_4h === 'UP' ? SignalType.LONG : SignalType.SHORT;
          return s.type === trend || s.type === SignalType.NEUTRAL;
        })
        : data;

      listToSort.sort((a, b) => {
        // Priority Map: LONG (3) > SHORT (2) > NEUTRAL (1)
        const getPriority = (type: SignalType) => {
          if (type === SignalType.LONG) return 3;
          if (type === SignalType.SHORT) return 2;
          return 1;
        };

        const priorityA = getPriority(a.type);
        const priorityB = getPriority(b.type);

        if (priorityA !== priorityB) {
          return priorityB - priorityA; // High priority first
        }

        // Secondary Sort: Confidence
        return b.confidence - a.confidence;
      });

      setSignals(listToSort);
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-full items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary text-sm mt-4">Đang tải dữ liệu...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Tín Hiệu AI</h1>
          <p className="text-xs text-text-secondary font-medium">Bản đồ BTC: <span className={btcTrend === 'UP' ? 'text-bullish' : 'text-bearish'}>{btcTrend}</span></p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-surface"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </header >

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {['Tất cả', 'Long (Mua)', 'Short (Bán)', 'Uy tín cao'].map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${activeFilter === chip ? 'bg-white text-background shadow-lg' : 'bg-surface text-text-secondary border border-white/5'}`}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {activeFilter === 'Tất cả' ? 'Cơ hội (Thuận xu hướng)' : activeFilter}
        </h3>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-10">
        {signals
          .filter(s => {
            if (activeFilter === 'Long (Mua)') return s.type === SignalType.LONG;
            if (activeFilter === 'Short (Bán)') return s.type === SignalType.SHORT;
            if (activeFilter === 'Uy tín cao') return s.confidence >= 70;
            return true;
          })
          .length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">Không có dữ liệu phù hợp</p>
          </div>
        ) : (
          signals
            .filter(s => {
              if (activeFilter === 'Long (Mua)') return s.type === SignalType.LONG;
              if (activeFilter === 'Short (Bán)') return s.type === SignalType.SHORT;
              if (activeFilter === 'Uy tín cao') return s.confidence >= 70;
              return true;
            })
            .map((signal) => (
              <div
                key={signal.id}
                onClick={() => onNavigate('setup', signal)}
                className="group relative flex flex-col gap-4 rounded-2xl bg-surface p-5 border border-white/5 transition-all active:scale-[0.98] cursor-pointer hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-[28px]">token</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold">{signal.pair}</h4>
                      </div>
                      <p className="text-xs font-medium text-text-secondary mt-0.5 tracking-tight">Giá: ${signal.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline - flex items - center gap - 1 rounded - md px - 2.5 py - 1 text - [11px] font - black uppercase tracking - wider ${signal.type === SignalType.LONG ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'} `}>
                      <span className="material-symbols-outlined text-[14px]">
                        {signal.type === SignalType.LONG ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      {signal.type}
                    </span>
                    <span className="text-[11px] font-bold text-primary">{signal.confidence}% Uy tín</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-background/50 px-3 py-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">tips_and_updates</span>
                  <p className="truncate text-[11px] font-semibold text-text-secondary">{signal.summary}</p>
                </div>
              </div>
            ))
        )}
      </div>
    </div >
  );
};

export default SignalList;
