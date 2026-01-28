
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser since we don't have dotenv
const loadEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            content.split('\n').forEach(line => {
                const [key, val] = line.split('=');
                if (key && val && !process.env[key.trim()]) {
                    process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
                }
            });
        }
    } catch (e) {
        console.log('Could not load .env file, relying on process.env');
    }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; // Ideally SERVICE_ROLE for full backup

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY (or VITE_...) must be set in .env or environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = [
    'inventory',
    'inventory_batches',
    'sales',
    'sales_items',
    'stock_movements',
    'profiles',
    'store_settings',
    'suppliers',
    'audit_logs'
];

async function backup() {
    console.log(`Starting backup at ${new Date().toISOString()}...`);
    const backupData = {};

    for (const table of TABLES) {
        try {
            console.log(`Fetching ${table}...`);
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw error;
            backupData[table] = data;
        } catch (err) {
            console.error(`Failed to fetch ${table}:`, err.message);
            // We continue to other tables
            backupData[table] = { error: err.message };
        }
    }

    // Ensure backup directory exists
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(backupDir, `backup-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${filename}`);
}

backup();
