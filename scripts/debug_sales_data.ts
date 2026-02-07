
import { createClient } from "@supabase/supabase-js";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
} catch (error) {
    console.warn("Could not load .env file", error.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSales() {
    console.log("Fetching latest 5 sales...");

    const { data: sales, error } = await supabase
        .from("sales")
        .select("id, created_at, cashier_name, cashier_id, status, sale_type")
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching sales:", error);
        return;
    }

    console.log("Latest Sales Data:");
    sales.forEach((sale) => {
        console.log(`Date: ${sale.created_at}`);
        console.log(`ID: ${sale.id}`);
        console.log(`Cashier Name: "${sale.cashier_name}" (Type: ${typeof sale.cashier_name})`);
        console.log(`Cashier ID: ${sale.cashier_id}`);
        console.log(`Status: ${sale.status}`);
        console.log("-------------------");
    });
}

checkSales();
