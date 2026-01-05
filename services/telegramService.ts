export interface TelegramSettings {
    botToken: string;
    chatId: string;
    enabled: boolean;
}

const STORAGE_KEY = 'telegram_settings';

export const getTelegramSettings = (): TelegramSettings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : { botToken: '', chatId: '', enabled: false };
    } catch (e) {
        return { botToken: '', chatId: '', enabled: false };
    }
};

export const saveTelegramSettings = (settings: TelegramSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const sendTelegramAlert = async (message: string) => {
    const settings = getTelegramSettings();
    if (!settings.enabled || !settings.botToken || !settings.chatId) return;

    try {
        const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Failed to send Telegram alert:', error);
    }
};
