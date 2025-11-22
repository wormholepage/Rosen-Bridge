import type { AssetSymbol } from '../lib/supabase';

export type SupportedChain = 'SOL' | 'BSC' | 'TRON' | 'ETH' | 'BTC';

const ALL_CHAINS: SupportedChain[] = ['SOL', 'BSC', 'TRON', 'ETH', 'BTC'];

const randItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateAddress = (chain: SupportedChain): string => {
    if (chain === 'SOL') {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let address = '';
        for (let i = 0; i < 44; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return address;
    }

    if (chain === 'BTC') {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let address = '';
        for (let i = 0; i < 34; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return address;
    }

    // EVM 风格地址（BSC / ETH / TRON 这里统一用 hex）
    const hex = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        address += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return address;
};

export const maskAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const generateTxHash = (chain: SupportedChain): string => {
    if (chain === 'SOL' || chain === 'BTC') {
        return generateAddress(chain);
    }
    const hex = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return hash;
};

const pickAsset = (): AssetSymbol => {
    const r = Math.random();
    if (r < 0.7) return 'USDT'; // 70% USDT
    if (r < 0.85) return 'BTC'; // 15% BTC
    return 'ETH';              // 15% ETH
};

const pickAmount = (asset: AssetSymbol): number => {
    if (asset === 'USDT') {
        const base = randItem([100, 250, 500, 750, 1000, 1500, 2000, 5000, 10000, 25000]);
        return parseFloat((base + Math.random() * 200).toFixed(2));
    }
    if (asset === 'BTC') {
        const base = randItem([0.01, 0.025, 0.05, 0.1, 0.2]);
        return parseFloat((base + Math.random() * 0.02).toFixed(4));
    }
    // ETH
    const base = randItem([0.5, 1, 2, 5, 8]);
    return parseFloat((base + Math.random() * 0.5).toFixed(4));
};

export const generateMockTransaction = () => {
    const asset = pickAsset();
    let source_chain = randItem(ALL_CHAINS);
    let target_chain = randItem(ALL_CHAINS);

    // 保证是跨链
    while (target_chain === source_chain) {
        target_chain = randItem(ALL_CHAINS);
    }

    const statuses: Array<'pending' | 'bridging' | 'confirmed'> = ['pending', 'bridging', 'confirmed'];
    const status = randItem(statuses);
    const amount = pickAmount(asset);

    const createdAt = new Date();
    const confirmedAt =
        status === 'confirmed' ? new Date(createdAt.getTime() + Math.floor(Math.random() * 5000)) : null;

    return {
        id: crypto.randomUUID(),
        source_chain,
        target_chain,
        source_address: generateAddress(source_chain),
        target_address: generateAddress(target_chain),
        amount,
        asset,
        status,
        tx_hash: generateTxHash(source_chain),
        created_at: createdAt.toISOString(),
        confirmed_at: confirmedAt ? confirmedAt.toISOString() : null,
    };
};
