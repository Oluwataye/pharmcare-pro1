/**
 * Currency Utility for Safe Financial Calculations
 * Avoids floating-point errors by performing math in minor units (cents).
 */

export const toCents = (amount: number): number => {
    return Math.round(amount * 100);
};

export const fromCents = (cents: number): number => {
    return cents / 100;
};

export const formatCurrency = (amount: number): string => {
    return amount.toFixed(2);
};

export const calculateDiscountAmount = (subtotal: number, discountPercentage: number): number => {
    const subtotalCents = toCents(subtotal);
    const discountCents = Math.round(subtotalCents * (discountPercentage / 100));
    return fromCents(discountCents);
};

export const calculateTotal = (subtotal: number, discountAmount: number, manualDiscount: number = 0): number => {
    const subtotalCents = toCents(subtotal);
    const discountCents = toCents(discountAmount);
    const manualCents = toCents(manualDiscount);
    return fromCents(subtotalCents - discountCents - manualCents);
};
