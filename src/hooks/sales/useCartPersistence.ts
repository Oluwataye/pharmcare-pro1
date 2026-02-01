import { useEffect } from 'react';

const STORAGE_KEY = 'pharmcare_cart_draft';

export const useCartPersistence = (
    items: any[],
    saleType: string,
    discount: number,
    manualDiscount: number,
    setItems: (items: any[]) => void,
    setSaleType: (type: 'retail' | 'wholesale') => void,
    setDiscount: (discount: number) => void,
    setManualDiscount: (discount: number) => void
) => {
    // Hydrate cart on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                const { items: savedItems, saleType: savedType, discount: savedDiscount, manualDiscount: savedManual } = draft;

                if (savedItems && savedItems.length > 0) {
                    console.log('[useCartPersistence] Hydrating cart from draft...');
                    setItems(savedItems);
                    setSaleType(savedType || 'retail');
                    setDiscount(savedDiscount || 0);
                    setManualDiscount(savedManual || 0);
                }
            } catch (e) {
                console.error('[useCartPersistence] Failed to parse cart draft:', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Persist cart on changes
    useEffect(() => {
        if (items.length > 0) {
            const draft = {
                items,
                saleType,
                discount,
                manualDiscount,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [items, saleType, discount, manualDiscount]);

    const clearDraft = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    return { clearDraft };
};
