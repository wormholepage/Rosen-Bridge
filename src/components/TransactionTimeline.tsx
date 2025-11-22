import { useEffect, useState } from 'react';
import { Transaction } from '../lib/supabase';
import { maskAddress } from '../utils/mockData';

interface TimelineTransaction extends Transaction {
    progress: number;
}

export const TransactionTimeline = ({
    transactions,
}: {
    transactions: Transaction[];
}) => {
    const [timelineTransactions, setTimelineTransactions] =
        useState<TimelineTransaction[]>([]);

    useEffect(() => {
        const recent = transactions.slice(0, 20);
        const withProgress: TimelineTransaction[] = recent.map((tx) => {
            let progress = 0;
            if (tx.status === 'confirmed') progress = 100;
            else if (tx.status === 'bridging') progress = 50 + Math.random() * 30;
            else if (tx.status === 'pending') progress = 10 + Math.random() * 20;

            return { ...tx, progress };
        });
        setTimelineTransactions(withProgress);

        const interval = setInterval(() => {
            setTimelineTransactions((prev) =>
                prev.map((tx) => {
                    if (tx.status === 'confirmed') return tx;

                    let newProgress = tx.progress + Math.random() * 5;
                    let newStatus: Transaction['status'] = tx.status;

                    if (newProgress >= 100) {
                        newProgress = 100;
                        newStatus = 'confirmed';
                    } else if (newProgress >= 45 && tx.status === 'pending') {
                        newStatus = 'bridging';
                    }

                    return { ...tx, progress: newProgress, status: newStatus };
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [transactions]);

    const getStageStatus = (progress: number, stage: number) => {
        const stageProgress = stage * 33.33;
        if (progress >= stageProgress + 33.33) return 'complete';
        if (progress >= stageProgress) return 'active';
        return 'pending';
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

    const formatAmount = (tx: Transaction) => {
        const decimals = tx.asset === 'USDT' ? 2 : 4;
        const value = tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return `${value} ${tx.asset}`;
    };

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Transaction Pipeline
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {timelineTransactions.map((tx) => (
                    <div
                        key={tx.id}
                        className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-sm font-bold ${getChainColor(
                                        tx.source_chain
                                    )}`}
                                >
                                    {tx.source_chain}
                                </span>
                                <span className="text-gray-600">→</span>
                                <span
                                    className={`text-sm font-bold ${getChainColor(
                                        tx.target_chain
                                    )}`}
                                >
                                    {tx.target_chain}
                                </span>
                                <span className="text-gray-600">|</span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {maskAddress(tx.source_address)}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-green-400">
                                {formatAmount(tx)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {[0, 1, 2].map((stage) => {
                                const status = getStageStatus(tx.progress, stage);
                                const labels = [
                                    'Source Confirmed',
                                    'Bridging',
                                    'Target Confirmed',
                                ];

                                return (
                                    <div
                                        key={stage}
                                        className="flex-1 flex items-center gap-2"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-400">
                                                    {labels[stage]}
                                                </span>
                                                {status === 'active' && (
                                                    <span className="text-xs text-cyan-400 animate-pulse">
                                                        Processing...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${status === 'complete'
                                                            ? 'bg-gradient-to-r from-green-500 to-green-400 w-full'
                                                            : status === 'active'
                                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse'
                                                                : 'bg-gray-700 w-0'
                                                        }`}
                                                    style={{
                                                        width:
                                                            status === 'active'
                                                                ? `${((tx.progress - stage * 33.33) / 33.33) * 100}%`
                                                                : undefined,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${status === 'complete'
                                                    ? 'bg-green-500 border-green-400'
                                                    : status === 'active'
                                                        ? 'bg-cyan-500 border-cyan-400 animate-pulse'
                                                        : 'bg-gray-800 border-gray-700'
                                                }`}
                                        >
                                            {status === 'complete' && (
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                            {status === 'active' && (
                                                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                                            )}
                                        </div>
                                        {stage < 2 && <div className="w-8 h-0.5 bg-gray-700" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
