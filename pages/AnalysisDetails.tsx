
import React, { useState, useEffect } from 'react';
import { View, MarketSignal, SignalType } from '../types';
import { getMarketAnalysis, AIAnalysisResult } from '../services/geminiService';
import { getMarketData } from '../services/apiService';
import SystemHealth from '../components/SystemHealth';

interface Props {
  signal: MarketSignal | null;
  onNavigate: (view: View, signal?: MarketSignal) => void;
}

const AnalysisDetails: React.FC<Props> = ({ signal, onNavigate }) => {
  const [openSections, setOpenSections] = useState<string[]>(['trend', 'ai']);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [displaySignal, setDisplaySignal] = useState<MarketSignal | null>(signal);

  useEffect(() => {
    setDisplaySignal(signal); // Reset when props change
  }, [signal]);

  useEffect(() => {
    const initData = async () => {
      if (!displaySignal) return;

      // If we have "Skeleton Data" (Price=0 or OI=N/A), show full loading screen
      const isSkeleton = !displaySignal.price || displaySignal.price === 0 || displaySignal.openInterest === 'N/A';
      if (isSkeleton) setLoading(true);

      const fetchDataWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
        try {
          const data = await getMarketData(displaySignal.pair);
          // Simple validation: If price is 0, it's bad data
          if (!data || data.price === 0) throw new Error("Invalid Data");
          return data;
        } catch (err) {
          if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return fetchDataWithRetry(retries - 1, delay * 1.5);
          }
          return null; // Give up
        }
      };

      // FETCH DATA
      const freshData = await fetchDataWithRetry();

      let updatedSignal = { ...displaySignal };
      if (freshData) {
        updatedSignal = {
          ...updatedSignal,
          price: freshData.price,
          change24h: freshData.change24h,
          rsi: freshData.rsi || 50,
          openInterest: freshData.openInterest,
          fundingRate: freshData.fundingRate,
          oiTrend: freshData.oiTrend,
          support: freshData.support,
          resistance: freshData.resistance
        };
        setDisplaySignal(updatedSignal);
      } else if (isSkeleton) {
        // If we failed and only have skeleton data, keep loading true? 
        // Or show error? For now, let's keep loading false but show "Retry" button in UI
      }

      // FETCH AI ANALYSIS
      try {
        const aiResult = await getMarketAnalysis(updatedSignal.pair, {
          symbol: updatedSignal.pair,
          price: updatedSignal.price,
          change24h: updatedSignal.change24h,
          rsi: updatedSignal.rsi || 50
        });
        setAiAnalysis(aiResult);
      } catch (e) {
        console.error("AI Error", e);
      }

      setLoading(false);
    };

    initData();
  }, [signal?.id]);

  // FULL PAGE LOADING STATE (If missing critical data)
  if (!displaySignal || (loading && (!displaySignal.price || displaySignal.price === 0))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-text-secondary animate-pulse">Đang đồng bộ dữ liệu {signal?.pair}...</p>
        <div className="mt-2 flex gap-2">
          <span className="text-[10px] text-white/30">Force Proxy Check</span>
        </div>
      </div>
    );
  }

  if (!displaySignal) return null;

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const Section = ({ id, title, icon, color, children }: any) => {
    const isOpen = openSections.includes(id);
    return (
      <div className="rounded-2xl bg-surface border border-white/5 overflow-hidden transition-all duration-300">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${color}/10 text-${color}`}>
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <span className="font-bold text-sm tracking-tight">{title}</span>
          </div>
          <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {isOpen && (
          <div className="p-4 pt-2 animate-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-40">
      {/* App Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/90 px-4 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight">{displaySignal.pair}</h1>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{displaySignal.exchange}</span>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <button
            onClick={() => setShowHealth(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">wifi_tethering</span>
          </button>
          <div>
            <p className="text-base font-black leading-tight">${displaySignal.price.toLocaleString()}</p>
            <p className="text-bullish text-[10px] font-black uppercase tracking-widest">+{displaySignal.change24h}%</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* AI Analysis Summary */}
        <Section id="ai" title="Tư vấn AI Real-time" icon="bolt" color="amber-400">
          {loading ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-text-secondary uppercase animate-pulse">Gemini đang phân tích biểu đồ...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-medium leading-relaxed text-white/90 italic">
                "{aiAnalysis?.summary || displaySignal.summary}"
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background rounded-lg p-2 flex items-center gap-2">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Trend:</span>
                  <span className="text-[10px] font-black text-bullish">{aiAnalysis?.trendStatus}</span>
                </div>
                <div className="bg-background rounded-lg p-2 flex items-center gap-2">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Risk:</span>
                  <span className="text-[10px] font-black text-warning">{aiAnalysis?.riskLevel}</span>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* AI Score Card */}
        <div className="rounded-3xl bg-gradient-to-br from-surface to-background p-6 shadow-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>

          {/* Debug/Refresh Button v2.0 */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm('Force fetch fresh data?')) return;
              try {
                const fresh = await getMarketData(displaySignal.pair);
                alert(`DEBUG Result for ${displaySignal.pair}:\nOI: ${fresh.openInterest}\nFunding: ${fresh.fundingRate}\nTrend: ${fresh.oiTrend}`);
                window.location.reload();
              } catch (err) {
                alert('DEBUG Error: ' + err);
              }
            }}
            className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/30 hover:text-white transition-colors cursor-pointer"
            title="Force Refresh Data (v2.0)"
          >
            <span className="material-symbols-outlined text-[12px]">refresh</span>
          </button>

          <div className="flex flex-col gap-5 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-secondary tracking-widest uppercase">Độ tin cậy AI</span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded tracking-widest uppercase">
                {displaySignal.confidence > 85 ? 'Tín hiệu Vàng' : 'Tiềm năng'}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-black tracking-tighter">{displaySignal.confidence}<span className="text-2xl text-white/30">%</span></span>

              {/* Context Info (OI & Funding) */}
              <div className="flex flex-col gap-1 ml-auto text-right">
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Open Interest</span>
                  <span className="text-xs font-black">{
                    loading ? <span className="animate-pulse">...</span> :
                      (displaySignal.openInterest && displaySignal.openInterest !== '0' && displaySignal.openInterest !== 'N/A'
                        ? displaySignal.openInterest
                        : <span className="text-text-secondary text-[10px] font-bold opacity-70">Spot/No Fut</span>)
                  }</span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Funding</span>
                  <span className={`text-xs font-black ${loading ? 'text-text-secondary' :
                    (displaySignal.fundingRate && parseFloat(displaySignal.fundingRate) !== 0
                      ? ((displaySignal.fundingRate.startsWith('-')) ? 'text-bullish' : 'text-bearish')
                      : 'text-text-secondary')
                    }`}>
                    {loading ? <span className="animate-pulse">...</span> :
                      (displaySignal.fundingRate && parseFloat(displaySignal.fundingRate) !== 0
                        ? displaySignal.fundingRate
                        : <span className="text-[10px] opacity-70">--</span>)
                    }
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-full">
              Dựa trên phân tích đa khung thời gian & dòng tiền.
            </p>

            <div className="space-y-2">
              <div className="h-2.5 w-full rounded-full bg-background overflow-hidden p-0.5 border border-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${displaySignal.confidence}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <Section id="trend" title="Chỉ báo Kỹ thuật" icon="candlestick_chart" color="blue-500">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">RSI (14)</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black">62</span>
                <span className="text-[9px] font-black text-text-secondary bg-white/5 px-1 rounded uppercase">Bullish</span>
              </div>
            </div>
            <div className="bg-background rounded-xl p-3 border border-white/5">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Vol / 24h</span>
              <div className="flex items-center gap-1 text-bullish mt-1">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="text-[11px] font-black uppercase">+12.5%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-text-secondary">Kháng cự (Resistance)</span>
              {displaySignal.price > 0 ? (
                <span className="text-bearish font-mono">${(displaySignal.price * 1.05).toFixed(2)}</span>
              ) : (
                <span className="text-text-secondary animate-pulse">Đang tính...</span>
              )}
            </div>
            <div className="h-px w-full bg-white/5"></div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-text-secondary">Hỗ trợ (Support)</span>
              {displaySignal.price > 0 ? (
                <span className="text-bullish font-mono">${(displaySignal.price * 0.96).toFixed(2)}</span>
              ) : (
                <span className="text-text-secondary animate-pulse">Đang tính...</span>
              )}
            </div>
          </div>
        </Section>

        <Section id="macro" title="Lịch Kinh Tế" icon="calendar_month" color="indigo-500">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center min-w-[40px]">
                <span className="text-[9px] font-bold text-text-secondary uppercase">19:30</span>
                <span className="text-xs font-black">Hôm nay</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">Báo cáo CPI</span>
                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded border border-red-500/20 uppercase">Cao</span>
                </div>
                <p className="text-[10px] text-text-secondary font-medium italic">Sẽ ảnh hưởng trực tiếp đến biến động của {displaySignal.pair}.</p>
              </div>
            </div>
          </div>
        </Section>

        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
          <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider leading-relaxed">
            *Phân tích này không phải lời khuyên tài chính. Vui lòng tự chịu trách nhiệm với quyết định của mình.
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-white/5 z-50 flex gap-3 max-w-md mx-auto safe-bottom">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-surface hover:bg-white/5 font-bold text-sm transition-all active:scale-95 border border-white/5"
        >
          <span>Hủy bỏ</span>
        </button>
        <button
          onClick={() => onNavigate('setup', displaySignal)}
          className="flex-[2] flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-sm transition-all active:scale-95"
        >
          Xem Thiết Lập Lệnh
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </footer>
      {showHealth && <SystemHealth onClose={() => setShowHealth(false)} />}
    </div>
  );
};

export default AnalysisDetails;
