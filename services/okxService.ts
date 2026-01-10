
// OKX API Service
// Uses Web Crypto API for zero-dependency HMAC SHA256 signing

const PROXY_URL = '/api/okx'; // Proxies to https://www.okx.com/api/v5

export interface OKXSettings {
    apiKey: string;
    secretKey: string;
    passphrase: string;
}

export interface Position {
    instId: string; // "BTC-USDT-SWAP"
    posSide: string; // "long" or "short"
    sz: string; // Size
    avgPx: string; // Entry Price
    upl: string; // Unrealized PnL
    uplRatio: string; // PnL %
    lever: string; // Leverage
    liqPx: string; // Liquidation Price
    cTime: string; // Creation Time
}

export interface AccountBalance {
    totalEq: string; // Total Equity (USD)
    totalEqIso: string; // Isolated Equity
    imr: string; // Initial Margin Requirement
}

const STORAGE_KEY = 'okx_settings';

export const getOKXSettings = (): OKXSettings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : { apiKey: '', secretKey: '', passphrase: '' };
    } catch {
        return { apiKey: '', secretKey: '', passphrase: '' };
    }
};

export const saveOKXSettings = (settings: OKXSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// HMAC SHA256 Signing using Web Crypto API
async function sign(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, msgData);

    // Convert ArrayBuffer to Base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function fetchOKX(endpoint: string, method: string = 'GET', body: object | null = null) {
    const settings = getOKXSettings();
    if (!settings.apiKey || !settings.secretKey || !settings.passphrase) {
        throw new Error('Chưa cài đặt OKX API Key');
    }

    const timestamp = new Date().toISOString();
    // OKX requires ISO format exactly? actually they accept ISO. 
    // Standard format: 2020-12-08T09:08:57.715Z

    const bodyString = body ? JSON.stringify(body) : '';
    const signText = `${timestamp}${method}${endpoint}${bodyString}`;
    const signature = await sign(signText, settings.secretKey);

    const headers: HeadersInit = {
        'OK-ACCESS-KEY': settings.apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': settings.passphrase,
        'Content-Type': 'application/json'
    };

    // Simulate global flag via proxy logic if needed, but local usage is fine
    // Note: /api/okx rewrites to /api/v5
    const response = await fetch(`${PROXY_URL}${endpoint}`, {
        method,
        headers,
        body: body ? bodyString : undefined
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('OKX API Error:', err);
        throw new Error(`Lỗi kết nối OKX: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== '0') {
        throw new Error(`OKX Error: ${data.msg}`);
    }

    return data.data;
}

export const getAccountDetail = async (): Promise<AccountBalance | null> => {
    try {
        // Get Balance
        // Endpoint: /account/balance
        const data = await fetchOKX('/account/balance?ccy=USDT');
        if (data && data.length > 0) {
            return data[0].details[0] || data[0]; // OKX structure varies slightly, but usually data[0] is correct
        }
        return null;
    } catch (error) {
        console.error('Fetch Balance Error:', error);
        return null;
    }
};

export const getOpenPositions = async (): Promise<Position[]> => {
    try {
        // Endpoint: /account/positions
        const data = await fetchOKX('/account/positions');
        return data || [];
    } catch (error) {
        console.error('Fetch Positions Error:', error);
        return [];
    }
};
