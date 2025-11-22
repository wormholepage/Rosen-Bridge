import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AssetSymbol = 'USDT' | 'BTC' | 'ETH';

export interface Transaction {
    id: string;
    source_chain: string;
    target_chain: string;
    source_address: string;
    target_address: string;
    amount: number;
    asset: AssetSymbol;
    status: 'pending' | 'bridging' | 'confirmed' | 'failed';
    tx_hash: string | null;
    created_at: string;
    confirmed_at: string | null;
}

export interface PoolStats {
    id: string;
    total_volume_usd: number;
    tx_count_24h: number;
    active_addresses: number;
    sol_tx_count: number;
    bsc_tx_count: number;
    sol_node_status: string;
    bsc_node_status: string;
    bridge_status: string;
    last_block_height: number;
    updated_at: string;
}
