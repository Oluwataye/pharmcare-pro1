import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  'Product Name': string;
  'SKU': string;
  'Category': string;
  'Expiry Date': string;
  'Quantity': string;
  'Unit': string;
  'Price (₦)': string;
  'Reorder Level': string;
  'Manufacturer': string;
  'Batch Number': string;
}

// Input sanitization
const sanitizeString = (input: string | undefined, maxLength: number): string | undefined => {
  if (!input) return undefined
  return input
    .replace(/[<>\"'&]/g, '') // Remove XSS characters
    .trim()
    .substring(0, maxLength)
}

// Normalize unit names to match database schema
const normalizeUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'vials': 'vials',
    'tablets': 'tablets',
    'capsules': 'capsules',
    'sachets': 'units',
    'boxes': 'boxes',
    'bottles': 'bottles',
    'ampoules': 'units',
    'strips': 'units',
    'syrup': 'bottles',
  };
  
  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || 'units';
};

// Parse CSV content
const parseCSV = (csvContent: string): CSVRow[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV file is empty or invalid');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row as CSVRow);
    }
  }

  return rows;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is SUPER_ADMIN
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'SUPER_ADMIN' });

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only SUPER_ADMIN can bulk upload.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvContent } = await req.json();

    // Validate CSV content
    if (!csvContent || typeof csvContent !== 'string') {
      throw new Error('CSV content is required and must be a string')
    }

    if (csvContent.length > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('CSV file too large (max 5MB)')
    }

    console.log('Parsing CSV content...');
    const rows = parseCSV(csvContent);
    
    if (rows.length > 10000) {
      throw new Error('Too many rows (max 10,000 per upload)')
    }

    console.log(`Parsed ${rows.length} rows`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Validate and sanitize inputs
        const productName = sanitizeString(row['Product Name'], 500)
        const sku = sanitizeString(row['SKU'], 100)
        const category = sanitizeString(row['Category'], 100)
        const manufacturer = sanitizeString(row['Manufacturer'], 200)
        const batchNumber = sanitizeString(row['Batch Number'], 100)

        if (!productName || productName.length < 2) {
          throw new Error('Product name must be at least 2 characters')
        }

        if (!sku || sku.length < 1) {
          throw new Error('SKU is required')
        }

        // Parse and validate numeric values
        const quantity = parseInt(row['Quantity'])
        const price = parseFloat(row['Price (₦)'])
        const reorderLevel = parseInt(row['Reorder Level'])

        if (isNaN(quantity) || quantity < 0 || quantity > 1000000) {
          throw new Error('Invalid quantity')
        }

        if (isNaN(price) || price < 0 || price > 10000000) {
          throw new Error('Invalid price')
        }

        if (isNaN(reorderLevel) || reorderLevel < 0 || reorderLevel > 100000) {
          throw new Error('Invalid reorder level')
        }

        // Parse and format expiry date (YYYY-MM-DD)
        const expiryDate = row['Expiry Date'];
        if (!expiryDate || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(expiryDate)) {
          throw new Error('Invalid expiry date format (must be YYYY-MM-DD)')
        }

        const [year, month, day] = expiryDate.split('-');
        const formattedExpiryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Validate date is in the future
        const expiryDateObj = new Date(formattedExpiryDate)
        if (expiryDateObj < new Date()) {
          throw new Error('Expiry date must be in the future')
        }

        const inventoryItem = {
          name: productName,
          sku: sku,
          category: category,
          quantity: quantity,
          unit: normalizeUnit(row['Unit']),
          price: price,
          reorder_level: reorderLevel,
          expiry_date: formattedExpiryDate,
          manufacturer: manufacturer || null,
          batch_number: batchNumber || null,
          last_updated_by: user.id,
        };

        const { error: insertError } = await supabaseClient
          .from('inventory')
          .insert(inventoryItem);

        if (insertError) {
          console.error(`Error inserting ${productName}:`, insertError);
          errors.push(`${productName}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error processing row:`, error);
        const productName = row['Product Name'] || 'Unknown product'
        errors.push(`${productName}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`Upload complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    
    // Sanitize error message
    const safeErrorMessage = error.message?.includes('database') || error.message?.includes('query')
      ? 'A system error occurred. Please try again.'
      : error.message || 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: safeErrorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
