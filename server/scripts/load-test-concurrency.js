
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' }); // Adjust path as needed

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// OR use service role if you have it locally, but usually tests run as anon/authenticated user.
// Better to use service role for setup/teardown.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runLoadTest() {
    console.log('Starting Concurrent Sales Load Test...');

    // 1. Setup: Get a product and ensure it has enough stock
    const { data: products, error: prodError } = await supabase
        .from('inventory')
        .select('id, name, quantity, price')
        .gt('quantity', 20)
        .limit(1);

    if (prodError || !products || products.length === 0) {
        console.error('Setup Failed: No suitable product found or error fetching.', prodError);
        return;
    }

    const product = products[0];
    const initialQuantity = product.quantity;
    console.log(`Target Product: ${product.name} (ID: ${product.id})`);
    console.log(`Initial Quantity: ${initialQuantity}`);

    // 2. Define the sale payload
    const concurrencyLevel = 10;
    console.log(`Simulating ${concurrencyLevel} concurrent sales of 1 unit each...`);

    const salePromises = [];

    // Create a dummy cashier ID (or fetch one if foreign key requires it)
    // We'll use the first user found in auth.users or just a known UUID if RLS allows.
    // Ideally we should sign in a user, but calling RPC as service role bypasses RLS on the function execution context if defined as SECURITY DEFINER.
    // The function expects p_cashier_id. We'll use a valid UUID.
    const { data: users } = await supabase.auth.admin.listUsers();
    const cashierId = users.users[0]?.id;

    if (!cashierId) {
        console.error('Setup Failed: No users found to act as cashier.');
        return;
    }

    for (let i = 0; i < concurrencyLevel; i++) {
        const transactionId = `TEST-CONC-${Date.now()}-${i}`;

        // Construct items array as JSONB
        const items = [{
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            price: product.price,
            discount: 0,
            is_wholesale: false,
            total: product.price
        }];

        const payload = {
            p_transaction_id: transactionId,
            p_total: product.price,
            p_discount: 0,
            p_manual_discount: 0,
            p_customer_name: 'Load Test Bot',
            p_customer_phone: '555-0000',
            p_business_name: '',
            p_business_address: '',
            p_sale_type: 'retail',
            p_cashier_id: cashierId,
            p_cashier_name: 'Test Runner',
            p_cashier_email: 'test@example.com',
            p_items: items
        };

        // Push the promise
        salePromises.push(
            supabase.rpc('process_sale_transaction', payload)
                .then(result => ({ status: 'fulfilled', result, id: i }))
                .catch(error => ({ status: 'rejected', error, id: i }))
        );
    }

    // 3. Execute concurrently
    const start = Date.now();
    const results = await Promise.all(salePromises);
    const end = Date.now();
    console.log(`Execution completed in ${end - start}ms`);

    // 4. Analyze Results
    const successful = results.filter(r => r.status === 'fulfilled' && !r.result.error);
    const failed = results.filter(r => r.status === 'rejected' || r.result.error);

    console.log(`Successful Transactions: ${successful.length}`);
    console.log(`Failed Transactions: ${failed.length}`);

    if (failed.length > 0) {
        console.log('Sample Error:', failed[0].error);
    }

    // 5. Verify Final Inventory
    const { data: finalProduct } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', product.id)
        .single();

    const finalQuantity = finalProduct.quantity;
    const expectedQuantity = initialQuantity - successful.length;

    console.log(`Final Quantity: ${finalQuantity}`);
    console.log(`Expected Quantity: ${expectedQuantity}`);

    if (finalQuantity === expectedQuantity) {
        console.log('SUCCESS: Inventory count matches expected value. Concurrency check passed.');
    } else {
        console.error('FAILURE: Inventory count mismatch! Possible race condition detected.');
        console.error(`Discrepancy: ${finalQuantity - expectedQuantity}`);
    }
}

runLoadTest();
