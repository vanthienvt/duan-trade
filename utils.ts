// Custom logic to ensure decimals are consistent
export const formatPrice = (price: number): string => {
    if (price === 0) return '0.00';
    if (price < 0.0001) return price.toFixed(8); // PEPE, SHIB
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Strict formatter for Exchange Input (No commas, fixed precision)
export const formatExchangePrice = (price: number): string => {
    if (!price) return '0';

    // Tick Size Logic (Simulated)
    if (price < 0.00001) return price.toFixed(8); // SHIB/PEPE
    if (price < 0.01) return price.toFixed(6);    // Low cap
    if (price < 1) return price.toFixed(4);       // ADA/XRP
    if (price < 50) return price.toFixed(4);      // Mid cap (Precision up to 4 for accurate triggers)
    if (price < 1000) return price.toFixed(2);    // BNB/SOL
    return price.toFixed(1);                      // BTC/ETH (Binance usually takes 1-2 decimals for high price)
};
