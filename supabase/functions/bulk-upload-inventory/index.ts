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

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing CSV content...');
    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Parse and format expiry date (YYYY-MM-DD)
        const expiryDate = row['Expiry Date'];
        const [year, month, day] = expiryDate.split('-');
        const formattedExpiryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const inventoryItem = {
          name: row['Product Name'],
          sku: row['SKU'],
          category: row['Category'],
          quantity: parseInt(row['Quantity']),
          unit: normalizeUnit(row['Unit']),
          price: parseFloat(row['Price (₦)']),
          reorder_level: parseInt(row['Reorder Level']),
          expiry_date: formattedExpiryDate,
          manufacturer: row['Manufacturer'] || null,
          batch_number: row['Batch Number'] || null,
          last_updated_by: user.id,
        };

        const { error: insertError } = await supabaseClient
          .from('inventory')
          .insert(inventoryItem);

        if (insertError) {
          console.error(`Error inserting ${row['Product Name']}:`, insertError);
          errors.push(`${row['Product Name']}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error processing row:`, error);
        errors.push(`${row['Product Name']}: ${error.message}`);
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
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
