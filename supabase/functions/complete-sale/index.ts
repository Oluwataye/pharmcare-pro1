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

// Rate limiting helper
const checkRateLimit = async (
  supabase: any,
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
  
  // Check existing rate limit
  const { data: existing, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .single()
  
  if (error && error.code !== 'PGRST116') { // Not a "not found" error
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: maxAttempts }
  }
  
  if (!existing) {
    // Create new rate limit entry
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        action,
        attempts: 1,
        window_start: new Date().toISOString()
      })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  if (existing.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }
  
  // Increment attempts
  await supabase
    .from('rate_limits')
    .update({ 
      attempts: existing.attempts + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id)
  
  return { allowed: true, remaining: maxAttempts - existing.attempts - 1 }
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

    // Check rate limit: 100 sales per hour per user
    const rateLimit = await checkRateLimit(supabase, user.id, 'complete_sale', 100, 60)
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remainingAttempts: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    const saleData: CompleteSaleRequest = await req.json()
    
    // Validate and sanitize inputs
    if (!Array.isArray(saleData.items) || saleData.items.length === 0) {
      throw new Error('Invalid sale items: must be a non-empty array')
    }
    
    if (saleData.items.length > 1000) {
      throw new Error('Too many items in a single sale (max 1000)')
    }
    
    if (typeof saleData.total !== 'number' || saleData.total < 0 || saleData.total > 100000000) {
      throw new Error('Invalid sale total')
    }
    
    if (!validateTransactionId(saleData.transactionId)) {
      throw new Error('Invalid transaction ID format')
    }
    
    if (saleData.customerName && saleData.customerName.length > 200) {
      throw new Error('Customer name too long (max 200 characters)')
    }
    
    if (!validatePhone(saleData.customerPhone)) {
      throw new Error('Invalid phone number format')
    }
    
    if (!validateEmail(saleData.cashierEmail)) {
      throw new Error('Invalid cashier email format')
    }
    
    if (saleData.saleType !== 'retail' && saleData.saleType !== 'wholesale') {
      throw new Error('Invalid sale type: must be retail or wholesale')
    }

    // Sanitize text inputs
    const sanitizedCustomerName = sanitizeString(saleData.customerName, 200)
    const sanitizedCustomerPhone = sanitizeString(saleData.customerPhone, 20)
    const sanitizedBusinessName = sanitizeString(saleData.businessName, 200)
    const sanitizedBusinessAddress = sanitizeString(saleData.businessAddress, 500)
    const sanitizedCashierName = sanitizeString(saleData.cashierName, 200)
    const sanitizedCashierEmail = sanitizeString(saleData.cashierEmail, 255)

    console.log('Processing sale:', { 
      transactionId: saleData.transactionId, 
      itemCount: saleData.items.length,
      remainingAttempts: rateLimit.remaining
    })

    // Validate inventory availability
    for (const item of saleData.items) {
      // Validate item structure
      if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 100000) {
        throw new Error(`Invalid item quantity for ${item.name}`)
      }
      
      if (!item.name || item.name.length > 500) {
        throw new Error('Invalid item name')
      }

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
        customer_name: sanitizedCustomerName,
        customer_phone: sanitizedCustomerPhone,
        business_name: sanitizedBusinessName,
        business_address: sanitizedBusinessAddress,
        sale_type: saleData.saleType,
        status: 'completed',
        cashier_id: user.id,
        cashier_name: sanitizedCashierName,
        cashier_email: sanitizedCashierEmail
      })
      .select()
      .single()

    if (saleError) {
      console.error('Error creating sale:', saleError)
      throw new Error('Failed to create sale record')
    }

    console.log('Sale created:', sale.id)

    // Insert sale items and update inventory
    const saleItemsPromises = saleData.items.map(async (item) => {
      // Sanitize item name
      const sanitizedItemName = sanitizeString(item.name, 500) || item.name

      // Insert sale item
      const { error: itemError } = await supabase
        .from('sales_items')
        .insert({
          sale_id: sale.id,
          product_id: item.id,
          product_name: sanitizedItemName,
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
        transactionId: sale.transaction_id,
        remainingAttempts: rateLimit.remaining
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in complete-sale function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while completing the sale'
    
    // Sanitize error message to prevent information disclosure
    const safeErrorMessage = errorMessage.includes('database') || errorMessage.includes('query')
      ? 'A system error occurred. Please try again.'
      : errorMessage
    
    return new Response(
      JSON.stringify({ error: safeErrorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
