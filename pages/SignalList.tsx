import React, { useState, useEffect } from 'react';
import { View, MarketSignal, SignalType } from '../types';
import { getSignals } from '../services/apiService';
import { getBTCContext, scanTopMarketCoins } from '../services/binanceService';
import SettingsModal from '../components/SettingsModal';
import { formatPrice } from '../utils';
import { sendTelegramAlert } from '../services/telegramService';

interface Props {
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const SignalList: React.FC<Props> = ({ onNavigate }) => {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [btcTrend, setBtcTrend] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('NEUTRAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [showSettings, setShowSettings] = useState(false);

  // Load sent alerts from session storage to prevent spam on reload
  const [sentAlerts] = useState(() => {
    const saved = sessionStorage.getItem('sent_alerts');
    return new Set<string>(saved ? JSON.parse(saved) : []);
  });


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
        // Condition: Confidence >= 85% (User requested for higher quality) AND Strong Trend (Long/Short) AND Not Sent Yet
        if (signal.confidence >= 85 && signal.type !== SignalType.NEUTRAL) {
          const alertKey = `${signal.pair}-${signal.type}-${signal.timeframe}`;
          if (!sentAlerts.has(alertKey)) {
            const icon = signal.type === SignalType.LONG ? '🟢' : '🔴';
            const entryPrice = signal.price;
            // SL fixed at 3.5% for Futures x5
            const stopLoss = formatPrice(signal.price * (signal.type === SignalType.LONG ? 0.965 : 1.035));
            const tp1 = formatPrice(signal.price * (signal.type === SignalType.LONG ? 1.04 : 0.96));
            const tp2 = formatPrice(signal.price * (signal.type === SignalType.LONG ? 1.08 : 0.92));
            const tp3 = formatPrice(signal.price * (signal.type === SignalType.LONG ? 1.15 : 0.85));
            const dangerZone = formatPrice(signal.price * (signal.type === SignalType.LONG ? 1.05 : 0.95));

            const msg = `${icon} *TÍN HIỆU VIP (Futures x5): ${signal.pair}*\n` +
              `--------------------------------\n` +
              `🚀 *Xu hướng:* ${signal.type === SignalType.LONG ? 'MUA (LONG)' : 'BÁN (SHORT)'}\n` +
              `💎 *Độ uy tín:* ${signal.confidence}%\n` +
              `--------------------------------\n` +
              `🎯 *Vùng Mua (Entry):* $${formatPrice(entryPrice)}\n` +
              `⛔ *Cắt Lỗ (SL):* $${stopLoss} (-3.5%)\n` +
              `--------------------------------\n` +
              `💰 *Chốt Lời 1:* $${tp1} (4%)\n` +
              `💰 *Chốt Lời 2:* $${tp2} (8%)\n` +
              `🚀 *Moonbag:* $${tp3} (15%)\n` +
              `--------------------------------\n` +
              `⚠️ *Vùng nguy hiểm:* Trên $${dangerZone}\n` +
              `📝 *Lý do:* ${signal.summary}`;

            sendTelegramAlert(msg);
            sentAlerts.add(alertKey);
            sessionStorage.setItem('sent_alerts', JSON.stringify(Array.from(sentAlerts)));
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

      // Global Sort: ALWAYS sort by Strength (Buy > Sell > Neutral) & Confidence
      // We process the list regardless of BTC context to ensure sorting is consistent

      // FIX: Do NOT filter by BTC Trend here. Let the user decide via UI Tabs.
      // Previously, this hid SHORT signals if BTC was UP, even if the Short signal was valid.
      const listToSort = data;

      // FIX: Clean Sort by Confidence Only
      // This ensures a fair mix of Long and Short based on how good the signal is, 
      // rather than forcing Longs to the top.
      listToSort.sort((a, b) => b.confidence - a.confidence);

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
          <h1 className="text-xl font-extrabold">Tín Hiệu AI <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-black align-middle ml-2">v2.6</span></h1>
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

      {/* Search Input */}
      <div className="px-4 mt-2">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="Tìm kiếm Coin (VD: BTC, ETH...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm font-bold placeholder:font-normal focus:outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

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
            // Priority Check: Search Query
            if (searchQuery && !s.pair.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
            if (activeFilter === 'Long (Mua)') return s.type === SignalType.LONG;
            if (activeFilter === 'Short (Bán)') return s.type === SignalType.SHORT;
            if (activeFilter === 'Uy tín cao') return s.confidence >= 70;
            return true;
          })
          .length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">{searchQuery ? `Không tìm thấy coin nào khớp với "${searchQuery}"` : 'Không có dữ liệu phù hợp'}</p>
          </div>
        ) : (
          signals
            .filter(s => {
              if (searchQuery && !s.pair.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
              }
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
                    <div className="h-12 w-12 rounded-full bg-surface border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={`https://assets.coincap.io/assets/icons/${signal.pair.split('/')[0].toLowerCase()}@2x.png`}
                        alt={signal.pair}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-primary/20 flex items-center justify-center font-black text-sm text-primary">
                        {signal.pair[0]}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold">{signal.pair}</h4>
                      </div>
                      <p className="text-xs font-medium text-text-secondary mt-0.5 tracking-tight">Giá: ${formatPrice(signal.price)}</p>
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
