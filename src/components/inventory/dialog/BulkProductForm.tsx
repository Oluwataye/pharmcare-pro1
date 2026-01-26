import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import { AddInventoryForm } from "./AddInventoryForm"; // Check import path
import { useState, useEffect } from "react";
import { InventoryItem } from "@/types/inventory";

interface BulkProductFormProps {
    items: any[];
    onUpdateItem: (index: number, data: any) => void;
    onRemoveItem: (index: number) => void;
    onAddItem: () => void;
    categories: string[];
    suppliers?: Supplier[];
}

export const BulkProductForm = ({
    items,
    onUpdateItem,
    onRemoveItem,
    onAddItem,
    categories,
    suppliers = []
}: BulkProductFormProps) => {
    const [expandedIndexes, setExpandedIndexes] = useState<number[]>([0]);

    // Automatically expand the latest added item
    useEffect(() => {
        if (items.length > 0) {
            const lastIndex = items.length - 1;
            if (!expandedIndexes.includes(lastIndex)) {
                setExpandedIndexes(prev => [...prev, lastIndex]);
            }
        }
    }, [items.length]);

    const toggleExpand = (index: number) => {
        setExpandedIndexes(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="space-y-6">
            {items.map((item, index) => (
                <div key={item.id || index} className="border rounded-xl bg-card shadow-sm overflow-hidden transition-all duration-200 border-primary/10">
                    <div
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${expandedIndexes.includes(index) ? 'border-b bg-muted/30' : ''}`}
                        onClick={() => toggleExpand(index)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                <Package className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {item.name || "New Product"}
                                </h3>
                                {(item.quantity > 0 || item.price > 0) && (
                                    <p className="text-xs text-muted-foreground">
                                        Qty: {item.quantity} {item.unit} | Price: ₦{item.price}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpand(index)}
                                className="h-8 w-8"
                                title={expandedIndexes.includes(index) ? "Collapse" : "Expand"}
                            >
                                {expandedIndexes.includes(index) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            {items.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onRemoveItem(index)}
                                    title="Remove from Restock"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {expandedIndexes.includes(index) && (
                        <div className="p-6 bg-background animate-in fade-in slide-in-from-top-2 duration-300">
                            <AddInventoryForm
                                formData={item}
                                setFormData={(data: any) => {
                                    const newData = typeof data === 'function' ? data(item) : data;
                                    onUpdateItem(index, newData);
                                }}
                                handleSubmit={(e) => e.preventDefault()}
                                categories={categories}
                                suppliers={suppliers}
                                isBulkMode={true}
                                expiryDate={item.expiryDateObj}
                                setExpiryDate={(date: any) => {
                                    onUpdateItem(index, { ...item, expiryDateObj: date });
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-primary font-medium"
                onClick={onAddItem}
            >
                <Plus className="h-4 w-4 mr-2" /> Add Another Product to this Restock
            </Button>
        </div>
    );
};
