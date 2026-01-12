export interface Supplier {
    id: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NewSupplier {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}
