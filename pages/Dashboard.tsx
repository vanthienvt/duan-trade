
import React, { useState, useEffect } from 'react';
import { View, SignalType, MarketSignal } from '../types';
import { getDashboardSignal, getRecentAlerts, getFearAndGreedIndex, getMarketData } from '../services/apiService';
import { getMarketAnalysis, AIAnalysisResult } from '../services/geminiService';
import { getBTCContext } from '../services/binanceService';

import GuideModal from '../components/GuideModal';
import SystemHealth from '../components/SystemHealth';

interface Props {
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

// Fallback mock data when API fails
const FALLBACK_SIGNAL: MarketSignal = {
  id: 'fallback',
  pair: 'BTC/USDT',
  exchange: 'Binance Perp',
  price: 64230.50,
  change24h: 2.45,
  type: SignalType.LONG,
  confidence: 87,
  timeframe: '4H',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  summary: 'Đang tải dữ liệu từ Binance...'
};

const Dashboard: React.FC<Props> = ({ onNavigate }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [signal, setSignal] = useState<MarketSignal | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setHasError(false);
      const data = await getDashboardSignal();
      const alertsData = await getRecentAlerts(); // Fetch alerts

      if (data) {
        setSignal(data);
        setHasError(false);

        // HYDRATION START: Fetch heavy Pro Data (OI/Funding) separately
        // This keeps the initial load instant, then updates details ~1s later
        if (data.id !== 'fallback') {
          getMarketData(data.pair).then((fullData: any) => { // Use 'any' or proper type if imported
            if (fullData) {
              setSignal(prev => {
                if (!prev || prev.id !== data.id) return prev;
                return {
                  ...prev,
                  openInterest: fullData.openInterest,
                  fundingRate: fullData.fundingRate,
                  oiTrend: fullData.oiTrend,
                  support: fullData.support,
                  resistance: fullData.resistance
                };
              });
            }
          }).catch(err => console.error("Hydration failed", err));
        }
        // HYDRATION END

        // 10-Part System: Fetch Global Context First
        if (data.id !== 'fallback') {
          setIsAnalyzing(true);

          // ... rest of AI analysis logic ...

          // Fetch Context in parallel
          const [btcContext, sentiment] = await Promise.all([
            getBTCContext(),
            getFearAndGreedIndex()
          ]);

          // Trigger AI with Context
          // Pass local coin data as fallback
          const coinData = {
            symbol: data.pair,
            price: data.price,
            change24h: data.change24h,
            rsi: data.rsi || 50
          };

          getMarketAnalysis(data.pair, coinData, {
            btcTrend: btcContext,
            fearAndGreed: sentiment
          }).then(result => {
            setAiAnalysis(result);
            setIsAnalyzing(false);
          });
        }
      } else {
        setSignal(FALLBACK_SIGNAL);
        setHasError(true);
      }

      if (alertsData) {
        setAlerts(alertsData);
      }
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

  if (!signal) {
    return (
      <div className="flex flex-col w-full items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-warning mb-4">warning</span>
          <h2 className="text-xl font-bold mb-2">Không thể kết nối đến Binance</h2>
          <p className="text-text-secondary text-sm mb-4">
            Vui lòng kiểm tra kết nối internet và thử lại.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-extrabold tracking-tight">Phân Tích Tổng Quan <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-black align-middle ml-2">v2.6</span></h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-surface text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">school</span>
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-surface text-white">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Meta Info */}
      <div className="py-2 flex items-center justify-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${hasError ? 'bg-warning' : 'bg-bullish'} animate-pulse`}></div>
        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">
          {hasError ? '⚠️ Dữ liệu mẫu' : 'Cập nhật'}: {signal.timestamp} • Hôm nay
        </p>
        <button
          onClick={() => setShowHealth(true)}
          className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          Signal Health
        </button>
      </div>

      {/* Hero Signal Card */}
      <div className="p-4" onClick={() => onNavigate('details', signal)}>
        <div className="relative overflow-hidden rounded-2xl bg-surface p-8 flex flex-col items-center text-center shadow-2xl group cursor-pointer active:scale-[0.98] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2c42] to-[#10151a]"></div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-3">Tín Hiệu Thị Trường</p>
            <h1 className="text-6xl font-black tracking-tighter mb-4" style={{ color: signal.type === SignalType.LONG ? '#10b981' : signal.type === SignalType.SHORT ? '#ef4444' : '#9dabb9' }}>
              {signal.type}
            </h1>

            <div className="w-full max-w-[240px]">
              <div className="flex justify-between text-[10px] text-text-secondary mb-1.5 font-semibold uppercase">
                <span>Yếu</span>
                <span className="text-white">Độ tin cậy: {signal.confidence}%</span>
                <span>Mạnh</span>
              </div>
              <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-bullish shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                  style={{ width: `${signal.confidence}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-text-secondary mt-6 italic opacity-60">
              AI phân tích dựa trên dữ liệu {signal.timeframe} • OI {signal.oiTrend === 'UP' ? 'đang tăng 🚀' : 'đi ngang'}
            </p>
          </div>
        </div>
      </div>

      {/* Ticker: Recent Alerts */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">Cảnh báo mới nhất</h3>
          <button className="text-primary text-xs font-bold" onClick={() => onNavigate('signals')}>Xem tất cả</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x">
          {alerts.map((alert, i) => (
            <div
              key={i}
              onClick={() => {
                // Construct a signal object from alert to navigate
                const signal: MarketSignal = {
                  id: alert.pair,
                  pair: alert.pair,
                  exchange: 'Binance',
                  price: 0, // Fallback
                  change24h: 0,
                  type: alert.type.includes('Long') ? SignalType.LONG : SignalType.SHORT,
                  confidence: 90,
                  timeframe: '1H',
                  timestamp: alert.time,
                  summary: 'Tín hiệu từ Alert'
                };
                onNavigate('details', signal);
              }}
              className="snap-start flex-none w-[160px] bg-surface border border-white/5 rounded-xl p-3 flex flex-col gap-3 cursor-pointer hover:border-primary/50 active:scale-95 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${alert.bg} flex items-center justify-center text-[10px] font-bold text-white`}>{alert.icon}</div>
                  <span className="font-bold text-sm">{alert.pair}</span>
                </div>
                {/* Timeframe hidden as requested */}
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold ${alert.color}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {alert.type.includes('Long') ? 'trending_up' : alert.type.includes('Short') ? 'trending_down' : 'remove_circle_outline'}
                </span>
                {alert.type.replace('Entry ', '').replace(' (Buy)', '').replace('Bearish ', '').replace(' (Avoid/Sell)', '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10-PART SYSTEM: MARKET BIAS (ACTION) */}
      <div className="px-4 mb-6">
        {aiAnalysis ? (
          <div className={`relative overflow-hidden rounded-2xl p-6 text-center border ${aiAnalysis.action === 'LONG' ? 'bg-green-500/10 border-green-500/20' :
            aiAnalysis.action === 'SHORT' ? 'bg-red-500/10 border-red-500/20' :
              'bg-slate-500/10 border-white/5'
            }`}>
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Chiến lược hôm nay</p>
            <h2 className={`text-4xl font-black tracking-tighter ${aiAnalysis.action === 'LONG' ? 'text-bullish' :
              aiAnalysis.action === 'SHORT' ? 'text-bearish' :
                'text-gray-400'
              }`}>
              {aiAnalysis.action === 'SIT OUT' ? 'SIT OUT (NGHỈ)' : aiAnalysis.action}
            </h2>
            <p className="text-xs mt-2 font-medium opacity-80">{aiAnalysis.summary}</p>
            <div className="mt-4 flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              <span>Độ tin cậy: {aiAnalysis.confidence}%</span>
              <span>•</span>
              <span>Rủi ro: {aiAnalysis.riskLevel}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-6 text-center border border-white/5">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-text-secondary">AI đang phân tích dữ liệu toàn thị trường...</p>
          </div>
        )}
      </div>

      {/* Analysis Grid */}
      <div className="px-4">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Chỉ số chi tiết</h2>

        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            {
              label: 'Xu Hướng BTC',
              val: isAnalyzing ? '...' : aiAnalysis?.trendStatus || 'N/A',
              icon: 'trending_up',
              color: 'text-primary'
            },
            {
              label: 'Thanh Khoản',
              val: isAnalyzing ? '...' : aiAnalysis?.liquidity || 'N/A',
              icon: 'ssid_chart',
              color: 'text-teal-400'
            },
            {
              label: 'Tâm Lý',
              val: isAnalyzing ? '...' : aiAnalysis?.sentiment || 'N/A',
              icon: 'mood',
              color: 'text-orange-400'
            },
            {
              label: 'Vùng Mua',
              val: isAnalyzing ? '...' : aiAnalysis?.entryZone || 'Chờ tín hiệu',
              icon: 'ads_click',
              color: 'text-purple-400'
            },

            {
              label: 'Funding Rate',
              val: signal.fundingRate || '0.00%',
              icon: 'currency_exchange',
              color: (signal.fundingRate || '').startsWith('-') ? 'text-bullish' : 'text-text-secondary'
            },
            {
              label: 'Open Interest',
              val: signal.openInterest || 'N/A',
              icon: 'stacked_line_chart',
              color: 'text-blue-400'
            }
          ].map((item, i) => (
            <div key={i} className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
              <div className={`h-10 w-10 rounded-lg bg-current/10 flex items-center justify-center ${item.color}`}>
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div>
                <h3 className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">{item.label}</h3>
                <p className={`text-sm font-bold leading-tight ${isAnalyzing ? 'animate-pulse opacity-50' : ''}`}>{item.val}</p>
              </div>
              <span className={`material-symbols-outlined absolute -top-2 -right-2 text-6xl opacity-5 ${item.color}`}>{item.icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="sticky bottom-0 z-30 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 mt-4">
        <button
          onClick={() => onNavigate('signals')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary h-14 text-sm font-bold shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Danh Sách Altcoin Tiềm Năng
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      {showHealth && <SystemHealth onClose={() => setShowHealth(false)} />}
    </div>
  );
};

export default Dashboard;
