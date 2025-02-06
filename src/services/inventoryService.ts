import { supabase } from '@/lib/supabase';
import { InventoryItem, Category } from '@/lib/types/database';

export const inventoryService = {
  // Fetch all inventory items
  async getInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Add new inventory item
  async addItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update inventory item
  async updateItem(id: string, updates: Partial<InventoryItem>) {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete inventory item
  async deleteItem(id: string) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },
};