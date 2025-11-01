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
    console.log('Processing sale:', { transactionId: saleData.transactionId, itemCount: saleData.items.length })

    // Validate inventory availability
    for (const item of saleData.items) {
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', item.id)
        .single()

      if (inventoryError || !inventoryItem) {
        throw new Error(`Product ${item.name} not found in inventory`)
      }

      if (inventoryItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`)
      }
    }

    // Insert sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        transaction_id: saleData.transactionId,
        total: saleData.total,
        discount: saleData.discount || 0,
        customer_name: saleData.customerName,
        customer_phone: saleData.customerPhone,
        business_name: saleData.businessName,
        business_address: saleData.businessAddress,
        sale_type: saleData.saleType,
        status: 'completed',
        cashier_id: user.id,
        cashier_name: saleData.cashierName,
        cashier_email: saleData.cashierEmail
      })
      .select()
      .single()

    if (saleError) {
      console.error('Error creating sale:', saleError)
      throw new Error(`Failed to create sale: ${saleError.message}`)
    }

    console.log('Sale created:', sale.id)

    // Insert sale items and update inventory
    const saleItemsPromises = saleData.items.map(async (item) => {
      // Insert sale item
      const { error: itemError } = await supabase
        .from('sales_items')
        .insert({
          sale_id: sale.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          price: item.price,
          discount: item.discount || 0,
          is_wholesale: item.isWholesale || false,
          total: item.total
        })

      if (itemError) {
        console.error('Error creating sale item:', itemError)
        throw new Error(`Failed to create sale item for ${item.name}`)
      }

      // Get current inventory quantity
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', item.id)
        .single()

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: (currentInventory?.quantity || 0) - item.quantity,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (updateError) {
        console.error('Error updating inventory:', updateError)
        throw new Error(`Failed to update inventory for ${item.name}`)
      }

      console.log(`Updated inventory for ${item.name}: -${item.quantity}`)
    })

    await Promise.all(saleItemsPromises)

    console.log('Sale completed successfully:', sale.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        saleId: sale.id,
        transactionId: sale.transaction_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in complete-sale function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while completing the sale'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
