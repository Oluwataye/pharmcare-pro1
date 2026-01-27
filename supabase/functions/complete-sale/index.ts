import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  dispenserName?: string
  dispenserEmail?: string
  manualDiscount?: number
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
    return new Response(null, { status: 204, headers: corsHeaders })
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

    // 2. Process Sale via Atomic RPC
    console.log('Calling process_sale_transaction RPC for:', saleData.transactionId)

    // Transform items to match SQL expected recordset structure
    const mappedItems = saleData.items.map(item => ({
      product_id: item.id,
      product_name: sanitizeString(item.name, 500) || item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      price: item.price,
      discount: item.discount || 0,
      is_wholesale: item.isWholesale || false,
      total: item.total
    }));

    const { data: result, error: rpcError } = await supabase
      .rpc('process_sale_transaction', {
        p_transaction_id: saleData.transactionId,
        p_total: saleData.total,
        p_discount: saleData.discount || 0,
        p_manual_discount: saleData.manualDiscount || 0,
        p_customer_name: sanitizeString(saleData.customerName, 200),
        p_customer_phone: sanitizeString(saleData.customerPhone, 20),
        p_business_name: sanitizeString(saleData.businessName, 200),
        p_business_address: sanitizeString(saleData.businessAddress, 500),
        p_sale_type: saleData.saleType,
        p_cashier_id: user.id,
        p_cashier_name: sanitizeString(saleData.dispenserName, 200),
        p_cashier_email: sanitizeString(saleData.dispenserEmail, 255),
        p_items: mappedItems
      })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error(rpcError.message || 'Atomic sale transaction failed')
    }

    console.log('Sale completed successfully via RPC:', result.sale_id);

    return new Response(
      JSON.stringify({
        success: true,
        saleId: result.sale_id,
        transactionId: result.transaction_id,
        profit: result.profit
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
