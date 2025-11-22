-- Rosen Bridge Mixing Pool Schema
-- Creates tables to store and track cross-chain mixing transactions

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_chain text NOT NULL,
  target_chain text NOT NULL,
  source_address text NOT NULL,
  target_address text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE IF NOT EXISTS pool_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_volume_usd numeric DEFAULT 0,
  tx_count_24h integer DEFAULT 0,
  active_addresses integer DEFAULT 0,
  sol_tx_count integer DEFAULT 0,
  bsc_tx_count integer DEFAULT 0,
  sol_node_status text DEFAULT 'online',
  bsc_node_status text DEFAULT 'online',
  bridge_status text DEFAULT 'normal',
  last_block_height integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for transactions"
  ON transactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for pool_stats"
  ON pool_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO pool_stats (
  total_volume_usd, 
  tx_count_24h, 
  active_addresses, 
  sol_tx_count, 
  bsc_tx_count
) VALUES (
  8234567.89,
  15847,
  3421,
  8234,
  7613
) ON CONFLICT DO NOTHING;