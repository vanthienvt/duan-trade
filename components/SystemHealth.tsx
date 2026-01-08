import React, { useState, useEffect } from 'react';

interface HealthStatus {
    service: string;
    status: 'PENDING' | 'OK' | 'ERROR';
    latency?: number;
    message?: string;
}

const SystemHealth: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [statuses, setStatuses] = useState<HealthStatus[]>([
        { service: 'Binance Spot API (Price/Vol)', status: 'PENDING' },
        { service: 'CORS Proxy 1 (AllOrigins)', status: 'PENDING' },
        { service: 'CORS Proxy 2 (CorsProxy)', status: 'PENDING' },
        { service: 'CORS Proxy 3 (CodeTabs)', status: 'PENDING' },
    ]);

    const checkConnection = async (url: string, serviceName: string, isJsonWrapper: boolean = false) => {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            // Basic validation
            if (isJsonWrapper && data.contents) {
                // It's a wrapper, we successfully reached it
            }

            setStatuses(prev => prev.map(s =>
                s.service === serviceName ? { ...s, status: 'OK', latency: Date.now() - start } : s
            ));
        } catch (err: any) {
            setStatuses(prev => prev.map(s =>
                s.service === serviceName ? { ...s, status: 'ERROR', message: err.message, latency: Date.now() - start } : s
            ));
        }
    };

    useEffect(() => {
        // 1. Binance Direct (Spot)
        checkConnection('https://api.binance.com/api/v3/ping', 'Binance Spot API (Price/Vol)');

        // 2. Proxies
        const target = encodeURIComponent('https://fapi.binance.com/fapi/v1/time');
        checkConnection(`https://api.allorigins.win/get?url=${target}`, 'CORS Proxy 1 (AllOrigins)', true);
        checkConnection(`https://corsproxy.io/?${target}`, 'CORS Proxy 2 (CorsProxy)');
        checkConnection(`https://api.codetabs.com/v1/proxy?quest=${target}`, 'CORS Proxy 3 (CodeTabs)');
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg">System Health Check</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    {statuses.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{s.service}</span>
                                {s.message && <span className="text-[10px] text-red-400">{s.message}</span>}
                            </div>

                            <div className="flex items-center gap-2">
                                {s.status === 'PENDING' && <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />}
                                {s.status === 'OK' && <span className="h-2 w-2 bg-green-500 rounded-full" />}
                                {s.status === 'ERROR' && <span className="h-2 w-2 bg-red-500 rounded-full" />}

                                <span className={`text-xs font-bold ${s.status === 'OK' ? 'text-green-400' :
                                        s.status === 'ERROR' ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                    {s.status === 'OK' ? `${s.latency}ms` : s.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-background/30 text-[10px] text-text-secondary text-center">
                    Nếu "CORS Proxy" đỏ, chỉ số Open Interest/Funding sẽ hiển thị N/A.
                    hãy thử F5 hoặc dùng mạng khác.
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
