export const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(8); // For small tokens like PEPE, SHIB
    if (price < 1) return price.toFixed(4);    // For mid-range tokens
    return price.toLocaleString();             // For large tokens like BTC, ETH
};
