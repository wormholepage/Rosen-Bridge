import { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { Transaction } from '../lib/supabase';
import { maskAddress } from '../utils/mockData';

interface ActivityLogProps {
    transactions: Transaction[];
}

type ChainFilter = 'all' | 'SOL' | 'BSC' | 'TRON' | 'ETH' | 'BTC';
type StatusFilter = 'all' | 'pending' | 'bridging' | 'confirmed';

export const ActivityLog = ({ transactions }: ActivityLogProps) => {
    const [filter, setFilter] = useState<ChainFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredTransactions = transactions.filter((tx) => {
        const chainMatch =
            filter === 'all' || tx.source_chain === filter || tx.target_chain === filter;
        const statusMatch = statusFilter === 'all' || tx.status === statusFilter;
        return chainMatch && statusMatch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'text-green-400 bg-green-500/20 border-green-500/50';
            case 'bridging':
                return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50 animate-pulse';
            case 'pending':
                return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
            default:
                return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'CONFIRMED';
            case 'bridging':
                return 'BRIDGING...';
            case 'pending':
                return 'PENDING';
            default:
                return status.toUpperCase();
        }
    };

    const getChainColor = (chain: string) => {
        switch (chain) {
            case 'SOL':
                return 'text-purple-400';
            case 'BSC':
                return 'text-yellow-400';
            case 'TRON':
                return 'text-emerald-400';
            case 'ETH':
                return 'text-blue-400';
            case 'BTC':
                return 'text-orange-400';
            default:
                return 'text-gray-400';
        }
    };

    const getExplorerUrl = (chain: string, txHash: string | null) => {
        if (!txHash) return '#';
        switch (chain) {
            case 'SOL':
                return `https://solscan.io/tx/${txHash}`;
            case 'BSC':
                return `https://bscscan.com/tx/${txHash}`;
            case 'ETH':
                return `https://etherscan.io/tx/${txHash}`;
            case 'TRON':
                return `https://tronscan.org/#/transaction/${txHash}`;
            case 'BTC':
                return `https://mempool.space/tx/${txHash}`;
            default:
                return '#';
        }
    };

    const formatAmount = (tx: Transaction) => {
        const asset = tx.asset || 'USDT';
        const decimals = asset === 'USDT' ? 2 : 4;
        const value = tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return `${value} ${asset}`;
    };

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live Activity Stream
                </h2>
                <div className="flex flex-wrap gap-2 justify-end">
                    <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-gray-700">
                        {(['all', 'SOL', 'BSC', 'TRON', 'ETH', 'BTC'] as ChainFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${filter === f ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-gray-700">
                        {(['all', 'pending', 'bridging', 'confirmed'] as StatusFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${statusFilter === f ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredTransactions.slice(0, 50).map((tx) => {
                    const time = new Date(tx.created_at).toLocaleTimeString('en-US', {
                        hour12: false,
                    });

                    return (
                        <div
                            key={tx.id}
                            className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/50 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-xs text-gray-500 font-mono w-20">{time}</span>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${getChainColor(tx.source_chain)}`}>
                                            {tx.source_chain}
                                        </span>
                                        <ArrowRight size={16} className="text-cyan-400" />
                                        <span className={`text-sm font-bold ${getChainColor(tx.target_chain)}`}>
                                            {tx.target_chain}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex items-center gap-3">
                                        <span className="text-xs text-gray-400 font-mono">
                                            {maskAddress(tx.source_address)}
                                        </span>
                                        <ArrowRight size={12} className="text-gray-600" />
                                        <span className="text-xs text-gray-400 font-mono">
                                            {maskAddress(tx.target_address)}
                                        </span>
                                    </div>

                                    <span className="text-lg font-bold text-green-400">
                                        {formatAmount(tx)}
                                    </span>

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                                            tx.status,
                                        )}`}
                                    >
                                        {getStatusText(tx.status)}
                                    </span>
                                </div>

                                <a
                                    href={getExplorerUrl(tx.source_chain, tx.tx_hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink size={16} className="text-cyan-400" />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
