import React, { useState, useEffect } from 'react';
import { TelegramSettings, getTelegramSettings, saveTelegramSettings } from '../services/telegramService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<TelegramSettings>({ botToken: '', chatId: '', enabled: false });

    useEffect(() => {
        if (isOpen) {
            setSettings(getTelegramSettings());
        }
    }, [isOpen]);

    const handleSave = () => {
        saveTelegramSettings(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">notifications_active</span>
                    Cài đặt Telegram
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Bot Token</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            value={settings.botToken}
                            onChange={e => setSettings({ ...settings, botToken: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Chat ID</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                            placeholder="-100123456789"
                            value={settings.chatId}
                            onChange={e => setSettings({ ...settings, chatId: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-white/5">
                        <input
                            type="checkbox"
                            id="enable-alerts"
                            className="w-5 h-5 accent-primary cursor-pointer"
                            checked={settings.enabled}
                            onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                        />
                        <label htmlFor="enable-alerts" className="text-sm font-medium cursor-pointer select-none">
                            Bật thông báo khi có tín hiệu Tốt
                        </label>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-primary text-background font-bold py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all mt-2"
                    >
                        Lưu Cài Đặt
                    </button>

                    <p className="text-[10px] text-text-secondary text-center mt-2 opacity-60">
                        Dữ liệu được lưu an toàn trên thiết bị của bạn.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
