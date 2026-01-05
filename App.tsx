
import React, { useState } from 'react';
import { View, MarketSignal, SignalType } from './types';
import Dashboard from './pages/Dashboard';
import SignalList from './pages/SignalList';
import TradeJournal from './pages/TradeJournal';
import AnalysisDetails from './pages/AnalysisDetails';

import TradeSetup from './pages/TradeSetup';
import RiskCalculator from './pages/RiskCalculator';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);

  const navigateTo = (view: View, signal?: MarketSignal) => {
    if (signal) setSelectedSignal(signal);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'signals':
        return <SignalList onNavigate={navigateTo} />;
      case 'journal':
        return <TradeJournal onNavigate={navigateTo} />;
      case 'details':
        return <AnalysisDetails signal={selectedSignal} onNavigate={navigateTo} />;
      case 'setup':
        return <TradeSetup signal={selectedSignal} onNavigate={navigateTo} />;
      case 'risk':
        return <RiskCalculator onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background text-white relative">
      <main className="flex-1 pb-24">
        {renderContent()}
      </main>

      {/* Global Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-white/5 max-w-md mx-auto safe-bottom">
        <div className="flex h-16 items-center justify-around px-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentView === 'dashboard' ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined ${currentView === 'dashboard' ? 'fill-1' : ''}`}>home</span>
            <span className="text-[10px] font-medium">Trang chủ</span>
          </button>

          <button
            onClick={() => navigateTo('signals')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentView === 'signals' ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined ${currentView === 'signals' ? 'fill-1' : ''}`}>candlestick_chart</span>
            <span className="text-[10px] font-medium">Tín hiệu</span>
          </button>

          <button
            onClick={() => navigateTo('risk')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentView === 'risk' ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined ${currentView === 'risk' ? 'fill-1' : ''}`}>calculate</span>
            <span className="text-[10px] font-medium">QL Vốn</span>
          </button>

          <button
            onClick={() => navigateTo('journal')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${currentView === 'journal' ? 'text-primary' : 'text-text-secondary'}`}
          >
            <div className="relative">
              <span className={`material-symbols-outlined ${currentView === 'journal' ? 'fill-1' : ''}`}>history_edu</span>
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-background"></div>
            </div>
            <span className="text-[10px] font-medium">Nhật ký</span>
          </button>

          <button
            className="flex flex-1 flex-col items-center justify-center gap-1 text-text-secondary"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Cá nhân</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
