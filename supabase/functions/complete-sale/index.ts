import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaleItem {
  id: string
  name: string
  quantity: number
  price: number
  unitPrice: number
  isWholesale?: boolean
  discount?: number
  total: number
}

interface CompleteSaleRequest {
  items: SaleItem[]
  total: number
  discount?: number
  customerName?: string
  customerPhone?: string
  businessName?: string
  businessAddress?: string
  saleType: 'retail' | 'wholesale'
  transactionId: string
  cashierName?: string
  cashierEmail?: string
}

// Input validation and sanitization utilities
const sanitizeString = (input: string | undefined, maxLength: number): string | undefined => {
  if (!input) return undefined
  // Remove potentially harmful characters and limit length
  return input
    .replace(/[<>\"'&]/g, '') // Remove XSS characters
    .trim()
    .substring(0, maxLength)
}

const validateEmail = (email: string | undefined): boolean => {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

const validatePhone = (phone: string | undefined): boolean => {
  if (!phone) return true // Optional field
  // Allow only digits, spaces, +, -, (, )
  const phoneRegex = /^[\d\s\+\-\(\)]+$/
  return phoneRegex.test(phone) && phone.length <= 20
}

const validateTransactionId = (id: string): boolean => {
  // Must be alphanumeric with dashes/underscores, max 100 chars
  const idRegex = /^[a-zA-Z0-9\-_]+$/
  return idRegex.test(id) && id.length <= 100
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const saleData: CompleteSaleRequest = await req.json()

    // 1. Validate Request Structure
    if (!Array.isArray(saleData.items) || saleData.items.length === 0) {
      throw new Error('Invalid sale items: must be a non-empty array')
    }

    if (saleData.items.length > 2000) {
      throw new Error('Too many items in a single sale (max 2000)')
    }

    if (!validateTransactionId(saleData.transactionId)) {
      throw new Error('Invalid transaction ID format')
    }

    console.log('Processing sale:', {
      transactionId: saleData.transactionId,
      itemCount: saleData.items.length
    })

    // 2. Fetch ALL Inventory Items in ONE Query (Vectorized Read)
    const itemIds = saleData.items.map(item => item.id);
    const { data: inventoryItems, error: inventoryFetchError } = await supabase
      .from('inventory')
      .select('id, name, quantity, cost_price')
      .in('id', itemIds);

    if (inventoryFetchError) throw new Error('Failed to fetch inventory data');

    // Create a map for O(1) lookup
    const inventoryMap = new Map(inventoryItems?.map(i => [i.id, i]));

    // 3. Validate Stock & Calculate Totals (In Memory)
    let totalCost = 0;
    const itemsToInsert = [];
    const inventoryUpdates = [];

    for (const item of saleData.items) {
      const inventoryItem = inventoryMap.get(item.id);

      if (!inventoryItem) {
        throw new Error(`Product ${item.name} (ID: ${item.id}) not found in inventory`);
      }

      if (inventoryItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
      }

      const costPrice = inventoryItem.cost_price || 0;
      totalCost += costPrice * item.quantity;

      // Prepare Sale Item Payload (with cost captured!)
      itemsToInsert.push({
        sale_id: null, // Will be set after sale creation
        product_id: item.id,
        product_name: sanitizeString(item.name, 500) || item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        price: item.price,
        cost_price: costPrice, // CAPTURE THE COST
        discount: item.discount || 0,
        is_wholesale: item.isWholesale || false,
        total: item.total
      });

      // Prepare Inventory Update
      inventoryUpdates.push({
        id: item.id,
        quantity_to_deduct: item.quantity,
        new_quantity: inventoryItem.quantity - item.quantity
      });
    }

    // 4. Create Sale Record (Master)
    // Calculate profit safely
    const grossProfit = saleData.total - totalCost;

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        transaction_id: saleData.transactionId,
        total: saleData.total,
        discount: saleData.discount || 0,
        // We could store profit in the sale record if the column existed, 
        // but typically it's calculated. However, to match offline, 
        // we heavily rely on sales_items having cost_price. 
        // If we added a profit column to sales, we'd set it here.
        customer_name: sanitizeString(saleData.customerName, 200),
        customer_phone: sanitizeString(saleData.customerPhone, 20),
        business_name: sanitizeString(saleData.businessName, 200),
        business_address: sanitizeString(saleData.businessAddress, 500),
        sale_type: saleData.saleType,
        status: 'completed',
        cashier_id: user.id,
        cashier_name: sanitizeString(saleData.cashierName, 200),
        cashier_email: sanitizeString(saleData.cashierEmail, 255)
      })
      .select()
      .single()

    if (saleError) throw new Error('Failed to create sale record: ' + saleError.message);

    // 5. Bulk Insert Sale Items (Vectorized Write)
    // Assign the new sale_id to all items
    itemsToInsert.forEach(item => item.sale_id = sale.id);

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Critical error: Sale created but items failed. 
      // In a real transactional DB we'd rollback. 
      // Here we throw, and frontend gets error. 
      console.error('Critical: Failed to insert items for sale ' + sale.id, itemsError);
      throw new Error('Failed to save sale items');
    }

    // 6. Update Inventory (Parallel Execution)
    // Since we don't have a bulk-update RPC handy, we parallelize the updates.
    // This is still N queries but they run concurrently via Promise.all
    await Promise.all(inventoryUpdates.map(update =>
      supabase
        .from('inventory')
        .update({
          quantity: update.new_quantity,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
    ));

    console.log('Sale completed successfully:', sale.id);

    return new Response(
      JSON.stringify({
        success: true,
        saleId: sale.id,
        transactionId: sale.transaction_id,
        profit: grossProfit
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in complete-sale function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
