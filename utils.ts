export const formatPrice = (price: number): string => {
    // Custom logic to ensure decimals are consistent
    let formatted;
    if (price < 0.01) {
        // Small tokens: 0,00012345 -> 0,00012345
        formatted = price.toFixed(8).replace('.', ',');
    } else if (price < 1) {
        // Mid tokens: 0,1234 -> 0,1234
        formatted = price.toFixed(4).replace('.', ',');
    } else {
        // Large tokens: 1.234,56
        formatted = price.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    return formatted;
};
