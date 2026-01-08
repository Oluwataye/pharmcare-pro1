import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { parse } from 'https://deno.land/std@0.181.0/encoding/csv.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { csvContent } = await req.json()

    if (!csvContent) {
      throw new Error('No CSV content provided')
    }

    // Parse CSV
    // Assuming CSV headers: Name, SKU, Category, Quantity, Unit, Price, Cost Price, Reorder Level, Expiry Date
    const result = await parse(csvContent, { skipFirstRow: true });

    const itemsToInsert = [];
    const errors = [];
    let successCount = 0;

    for (const row of result) {
      try {
        // Map row to object based on expected structure
        // Note: The structure depends on the user's CSV format. 
        // We assume a standard format here or flexible mapping.
        // Array indices: 0:Name, 1:SKU, 2:Category, 3:Qty, 4:Unit, 5:Price, 6:Cost, 7:Reorder, 8:Expiry, 9:Manufacturer, 10:Batch

        const item = {
          name: row[0]?.toString().trim(),
          sku: row[1]?.toString().trim(),
          category: row[2]?.toString().trim() || 'General',
          quantity: parseInt(row[3] as string) || 0,
          unit: row[4]?.toString().trim() || 'pcs',
          price: parseFloat(row[5] as string) || 0,
          cost_price: parseFloat(row[6] as string) || 0,
          reorder_level: parseInt(row[7] as string) || 10,
          expiry_date: row[8]?.toString().trim() || null,
          manufacturer: row[9]?.toString().trim() || null,
          batch_number: row[10]?.toString().trim() || null
        };

        if (!item.name || !item.sku) {
          throw new Error(`Row missing Name or SKU: ${JSON.stringify(row)}`);
        }

        // Upsert logic (checking for existing SKU is implicit with UPSERT if SKU is unique constraint, 
        // strictly speaking we should check if SKU exists to avoid ID conflicts if we want to update quantity)
        // For simplicity in this port, we will attempt validation then Insert.
        // Actually best practice for "Receive Inventory" is usually adding to stock, but "Bulk Upload" often implies "Setting Stock".
        // We will treat this as "Upsert by SKU" if possible, or simple Insert.

        itemsToInsert.push(item);
        successCount++;

      } catch (err) {
        errors.push(err.message);
      }
    }

    // Perform Bulk Insert/Upsert
    // Note: Supabase upsert requires a unique constraint. If SKU is unique, this works.
    // If not, we might be creating duplicates. 
    // We'll perform an upsert on 'sku' if it exists as a constraint, otherwise we just insert.

    // Chunking to avoid packet size limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
      const chunk = itemsToInsert.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('inventory')
        .upsert(chunk, { onConflict: 'sku' }); // critical assumption: sku is unique

      if (error) {
        console.error('Batch error:', error);
        throw new Error(`Batch insert failed: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Upload processed',
        successCount,
        errorCount: errors.length,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
