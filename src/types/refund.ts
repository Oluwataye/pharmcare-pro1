export interface Refund {
    id: string;
    sale_id: string;
    transaction_id: string;
    refund_amount: number;
    refund_reason: string;
    refund_type: 'full' | 'partial';
    status: 'pending' | 'approved' | 'rejected';

    // Initiator (Cashier)
    initiated_by: string;
    initiated_by_name: string;
    initiated_at: string;

    // Approver (Admin)
    approved_by?: string;
    approved_by_name?: string;
    approved_at?: string;
    rejection_reason?: string;

    // Sale details
    original_amount: number;
    customer_name?: string;
    items?: any[];

    created_at: string;
    updated_at: string;
}

export interface RefundRequest {
    sale_id: string;
    transaction_id: string;
    refund_amount: number;
    refund_reason: string;
    refund_type: 'full' | 'partial';
    original_amount: number;
    customer_name?: string;
    items?: any[];
}

export interface RefundApproval {
    refund_id: string;
    action: 'approve' | 'reject';
    rejection_reason?: string;
}
