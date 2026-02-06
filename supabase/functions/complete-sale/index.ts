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
  shift_name?: string
  shift_id?: string
  staff_role?: string
  payments?: { mode: string, amount: number }[]
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables:', {
        url: !!SUPABASE_URL,
        key: !!SUPABASE_SERVICE_ROLE_KEY
      })
      return new Response(
        JSON.stringify({ error: 'System Configuration Error', diagnostic: 'Missing ENV vars on Edge Function' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Auth validation: Check for custom header first (to bypass Gateway 401s), then standard Authorization
    let token = req.headers.get('x-user-token')

    if (!token) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
      }
    }

    if (!token) {
      console.error('Missing Auth Token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized', diagnostic: 'Missing Authorization or x-user-token header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log(`[Auth] Verifying token (starts with: ${token.substring(0, 10)}..., Length: ${token.length})`)

    // Use Service Role for Admin Access (Bypassing RLS for system checks)
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify User Token explicitly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid Token',
          diagnostic: authError?.message || 'User not found',
          authError: authError,
          statusNote: 'If you see 418, the failure is inside the function logic. If you see 401, it is at the gateway.'
        }),
        // USE 418 TO DISTINGUISH FROM GATEWAY 401
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 418 }
      )
    }

    console.log(`User authenticated: ${user.id} (${user.email})`)

    const saleData: CompleteSaleRequest = await req.json()

    // 0. ENHANCED IDENTITY CHECK
    // If dispenserName is missing or 'Unknown', try to resolve it from profiles
    if (!saleData.dispenserName || saleData.dispenserName === 'Unknown' || saleData.dispenserName === 'Staff') {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        if (profile?.name) {
          console.log(`Resolved missing dispenser name for ${user.id}: ${profile.name}`);
          saleData.dispenserName = profile.name;
        } else {
          // Fallback to email username if profile fetch fails
          saleData.dispenserName = user.email?.split('@')[0] || 'Staff';
        }
      } catch (profileError) {
        console.warn('Failed to resolve profile name:', profileError);
      }
    }

    // 1. Validate Request Structure
    if (!Array.isArray(saleData.items) || saleData.items.length === 0) {
      throw new Error('Invalid sale items: must be a non-empty array')
    }

    // RATE LIMITING CHECK
    // 1. Cooldown period (2 seconds) to prevent accidental double-clicks
    const { data: lastSale, error: cooldownError } = await supabase
      .from('sales')
      .select('created_at')
      .eq('cashier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastSale && lastSale.length > 0) {
      const lastSaleTime = new Date(lastSale[0].created_at).getTime();
      const now = Date.now();
      if (now - lastSaleTime < 2000) {
        throw new Error('Please wait a moment before processing another sale.');
      }
    }

    // 2. Hourly Rate Limit (e.g., 100 sales per hour) to prevent automated abuse
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: hourlyCount, error: hourlyError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('cashier_id', user.id)
      .gte('created_at', oneHourAgo);

    if (hourlyError) {
      console.error('Error checking hourly rate limit:', hourlyError);
    } else if (hourlyCount !== null && hourlyCount >= 100) {
      console.warn(`Hourly rate limit exceeded for user ${user.id}: ${hourlyCount} sales`);
      throw new Error('Hourly sale limit exceeded. Please contact an administrator if this is an error.');
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

    // 2. PAYMENT & CREDIT LOGIC
    let paymentStatus = 'paid';
    let amountPaid = saleData.total;
    let amountOutstanding = 0;
    let customerId = null;

    if (saleData.payments && saleData.payments.length > 0) {
      const totalPaid = saleData.payments
        .filter(p => p.mode !== 'transfer')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalCredit = saleData.payments
        .filter(p => p.mode === 'transfer')
        .reduce((sum, p) => sum + p.amount, 0);

      amountPaid = totalPaid;
      amountOutstanding = totalCredit;

      if (amountOutstanding > 0) {
        if (amountPaid === 0) {
          paymentStatus = 'pending';
        } else {
          paymentStatus = 'partial';
        }

        // 2a. Resolve Customer for Credit
        if (!saleData.customerName || !saleData.customerPhone) {
          throw new Error('Customer Name and Phone are required for credit sales');
        }

        // Try to find existing customer by phone
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', saleData.customerPhone)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: saleData.customerName,
              phone: saleData.customerPhone,
              address: saleData.businessAddress || saleData.customerName + ' Address', // Fallback
              email: null // Optional
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Failed to create customer:', createError);
            throw new Error('Failed to register customer for credit sale');
          }
          customerId = newCustomer.id;
        }
      }
    }

    console.log('Payment Analysis:', { paymentStatus, amountPaid, amountOutstanding, customerId });

    // 3. Process Sale via Atomic RPC
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
        p_items: mappedItems,
        p_shift_name: sanitizeString(saleData.shift_name, 100),
        p_shift_id: saleData.shift_id,
        p_staff_role: sanitizeString(saleData.staff_role, 50),
        p_payments: saleData.payments || [{ mode: 'cash', amount: saleData.total }],
        // New Credit Specs
        p_payment_status: paymentStatus,
        p_amount_paid: amountPaid,
        p_amount_outstanding: amountOutstanding,
        p_customer_id: customerId
      })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error(rpcError.message || 'Atomic sale transaction failed')
    }

    console.log('Sale completed successfully via RPC:', result.sale_id);

    // 4. Update Ledger if Credit Sale
    if (amountOutstanding > 0 && customerId) {
      try {
        // Atomic update of customer balance
        // We can't easily do "returning" in one step with JS client easily without RPC, 
        // keeping it simple: Fetch, Calc, Update+Insert.
        // Ideally, 'update_customer_balance' trigger logic handles the customer update based on ledger insert, 
        // BUT ledger insert needs 'balance_after'. 
        // LET'S USE A SMALL RPC or direct SQL if possible? 
        // Actually, I defined a trigger 'update_customer_balance' in migration that updates customer FROM ledger.
        // BUT ledger needs 'balance_after'. Circular dependency if I rely on trigger to calc balance.
        // My trigger implementation was: updates customer SET balance = NEW.balance_after. 
        // So I MUST calculate balance_after here.

        const { data: custData } = await supabase
          .from('customers')
          .select('credit_balance')
          .eq('id', customerId)
          .single();

        const currentBalance = custData?.credit_balance || 0;
        const newBalance = currentBalance + amountOutstanding;

        const { error: ledgerError } = await supabase
          .from('customer_transactions')
          .insert({
            customer_id: customerId,
            type: 'DEBIT',
            amount: amountOutstanding,
            reference_id: result.sale_id,
            description: `Credit Sale ${result.transaction_id}`,
            balance_before: currentBalance,
            balance_after: newBalance,
            created_by: user.id
          });

        if (ledgerError) console.error('Ledger insert failed:', ledgerError);
        // Trigger will update customer table
      } catch (ledgerErr) {
        console.error('Ledger processing failed:', ledgerErr);
      }
    }

    // 5. SAVE RECEIPT DATA
    try {
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          sale_id: result.sale_id,
          receipt_data: {
            ...saleData,
            saleId: result.sale_id,
            date: new Date().toISOString(),
            paymentStatus,
            amountPaid,
            amountOutstanding,
            customerId
          }
        });

      if (receiptError) {
        console.error('Error saving receipt:', receiptError);
      }
    } catch (saveError) {
      console.error('Exception saving receipt:', saveError);
    }

    // 6. LOW STOCK CHECK & ALERTING (Asynchronous/Non-blocking)
    try {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('low_stock_threshold_global, enable_low_stock_alerts')
        .single();

      if (settings?.enable_low_stock_alerts) {
        const threshold = settings.low_stock_threshold_global || 10;
        const productIds = saleData.items.map(item => item.id);

        const { data: lowStockItems } = await supabase
          .from('inventory')
          .select('id, name, quantity')
          .in('id', productIds)
          .lt('quantity', threshold);

        if (lowStockItems && lowStockItems.length > 0) {
          for (const item of lowStockItems) {
            console.log(`[Low Stock Alert] ${item.name} is at ${item.quantity}`);
            // Invoke send-alert function
            await supabase.functions.invoke('send-alert', {
              body: {
                type: 'LOW_STOCK',
                message: `Low stock alert: ${item.name} has only ${item.quantity} units left.`,
                data: {
                  productId: item.id,
                  productName: item.name,
                  quantity: item.quantity,
                  threshold
                }
              }
            });
          }
        }
      }
    } catch (alertError) {
      console.error('Error during low stock check/alert:', alertError);
      // Don't fail the sale if alerting fails
    }

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
