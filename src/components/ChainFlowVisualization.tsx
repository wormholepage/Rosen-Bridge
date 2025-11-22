import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Transaction } from '../lib/supabase';

interface ChainFlowVisualizationProps {
    transactions: Transaction[];
}

interface FlowStats {
    solTxPerHour: number;
    bscTxPerHour: number;
    solToBscCount: number;
    solToBscVolume: number;
    bscToSolCount: number;
    bscToSolVolume: number;
    tronUsdtVolume: number;
    ethUsdtVolume: number;
    btcVolume: number;
}

export const ChainFlowVisualization = ({
    transactions,
}: ChainFlowVisualizationProps) => {
    const [stats, setStats] = useState<FlowStats>({
        solTxPerHour: 0,
        bscTxPerHour: 0,
        solToBscCount: 0,
        solToBscVolume: 0,
        bscToSolCount: 0,
        bscToSolVolume: 0,
        tronUsdtVolume: 0,
        ethUsdtVolume: 0,
        btcVolume: 0,
    });

    useEffect(() => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const recent = transactions.filter(
            (tx) => new Date(tx.created_at).getTime() > oneHourAgo
        );

        const solTxPerHour = recent.filter(
            (tx) => tx.source_chain === 'SOL' || tx.target_chain === 'SOL'
        ).length;

        const bscTxPerHour = recent.filter(
            (tx) => tx.source_chain === 'BSC' || tx.target_chain === 'BSC'
        ).length;

        const solToBscUsdt = recent.filter(
            (tx) =>
                tx.asset === 'USDT' &&
                tx.source_chain === 'SOL' &&
                tx.target_chain === 'BSC'
        );

        const bscToSolUsdt = recent.filter(
            (tx) =>
                tx.asset === 'USDT' &&
                tx.source_chain === 'BSC' &&
                tx.target_chain === 'SOL'
        );

        let tronUsdtVolume = 0;
        let ethUsdtVolume = 0;
        let btcVolume = 0;

        recent.forEach((tx) => {
            if (tx.asset === 'USDT') {
                if (tx.source_chain === 'TRON' || tx.target_chain === 'TRON') {
                    tronUsdtVolume += tx.amount;
                }
                if (tx.source_chain === 'ETH' || tx.target_chain === 'ETH') {
                    ethUsdtVolume += tx.amount;
                }
            }

            if (tx.asset === 'BTC') {
                if (tx.source_chain === 'BTC' || tx.target_chain === 'BTC') {
                    btcVolume += tx.amount;
                }
            }
        });

        setStats({
            solTxPerHour,
            bscTxPerHour,
            solToBscCount: solToBscUsdt.length,
            solToBscVolume: solToBscUsdt.reduce((s, tx) => s + tx.amount, 0),
            bscToSolCount: bscToSolUsdt.length,
            bscToSolVolume: bscToSolUsdt.reduce((s, tx) => s + tx.amount, 0),
            tronUsdtVolume,
            ethUsdtVolume,
            btcVolume,
        });
    }, [transactions]);

    const getArrowThickness = (volume: number) => {
        const maxVolume = Math.max(stats.solToBscVolume, stats.bscToSolVolume, 1);
        return Math.max(2, Math.min(8, (volume / maxVolume) * 8));
    };

    const formatUsdt = (value: number) =>
        `$${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatBtc = (value: number) =>
        `${value.toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
        })} BTC`;

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Cross-Chain Flow
            </h2>

            {/* 上：SOL ↔ BSC */}
            <div className="flex items-stretch justify-between gap-8 mb-10">
                {/* SOL */}
                <div className="flex-1">
                    <div className="relative group h-full">
                        <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 border-2 border-purple-500/50 rounded-2xl p-8 text-center hover:scale-105 transition-all h-full flex flex-col justify-center">
                            <div className="absolute inset-0 bg-purple-500/10 rounded-2xl animate-pulse" />
                            <div className="relative z-10">
                                <div className="text-5xl font-bold text-white mb-2">
                                    SOLANA
                                </div>
                                <div className="text-purple-400 text-sm font-medium tracking-wider">
                                    High-Speed Chain
                                </div>
                                <div className="mt-4 text-2xl font-bold text-purple-300">
                                    {stats.solTxPerHour}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Transactions / Hour (all assets)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 中间流向 */}
                <div className="flex-[1.2] space-y-6">
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="bg-gradient-to-r from-purple-500/20 to-yellow-500/20 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/60 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ArrowRight
                                                className="text-purple-400 animate-pulse"
                                                size={24}
                                            />
                                            <span className="text-sm text-gray-400">
                                                SOL → BSC (USDT)
                                            </span>
                                        </div>
                                        <span className="text-xs text-green-400 font-bold">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {stats.solToBscCount} txs
                                    </div>
                                    <div className="text-sm text-green-400 font-medium">
                                        {formatUsdt(stats.solToBscVolume)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-yellow-500 animate-flow"
                            style={{
                                width: `${getArrowThickness(stats.solToBscVolume) * 10}%`,
                            }}
                        />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-lg p-4 border border-yellow-500/30 hover:border-yellow-500/60 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ArrowLeft
                                                className="text-yellow-400 animate-pulse"
                                                size={24}
                                            />
                                            <span className="text-sm text-gray-400">
                                                BSC → SOL (USDT)
                                            </span>
                                        </div>
                                        <span className="text-xs text-green-400 font-bold">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {stats.bscToSolCount} txs
                                    </div>
                                    <div className="text-sm text-green-400 font-medium">
                                        {formatUsdt(stats.bscToSolVolume)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-yellow-500 via-cyan-500 to-purple-500 animate-flow-reverse"
                            style={{
                                width: `${getArrowThickness(stats.bscToSolVolume) * 10}%`,
                            }}
                        />
                    </div>
                </div>

                {/* BSC */}
                <div className="flex-1">
                    <div className="relative group h-full">
                        <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-900/30 border-2 border-yellow-500/50 rounded-2xl p-8 text-center hover:scale-105 transition-all h-full flex flex-col justify-center">
                            <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl animate-pulse" />
                            <div className="relative z-10">
                                <div className="text-5xl font-bold text-white mb-2">BSC</div>
                                <div className="text-yellow-400 text-sm font-medium tracking-wider">
                                    Smart Chain
                                </div>
                                <div className="mt-4 text-2xl font-bold text-yellow-300">
                                    {stats.bscTxPerHour}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Transactions / Hour (all assets)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 下：TRON / ETH / BTC 大卡 */}
            <h3 className="text-sm font-semibold text-gray-400 mb-4 tracking-wide uppercase">
                Multi-Chain Assets (Last Hour)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TRON */}
                <div className="bg-gradient-to-br from-emerald-500/25 to-cyan-900/30 border-2 border-emerald-500/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs text-gray-400">TRON</div>
                            <div className="text-2xl font-bold text-white mt-1">TRON</div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                        USDT Volume (Last Hour)
                    </div>
                    <div className="text-2xl font-bold text-emerald-300">
                        {formatUsdt(stats.tronUsdtVolume)}
                    </div>
                </div>

                {/* ETHEREUM */}
                <div className="bg-gradient-to-br from-blue-500/25 to-indigo-900/30 border-2 border-blue-500/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs text-gray-400">ETHEREUM</div>
                            <div className="text-2xl font-bold text-white mt-1">
                                ETHEREUM
                            </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                        USDT Volume (Last Hour)
                    </div>
                    <div className="text-2xl font-bold text-blue-300">
                        {formatUsdt(stats.ethUsdtVolume)}
                    </div>
                </div>

                {/* BITCOIN */}
                <div className="bg-gradient-to-br from-orange-500/25 to-orange-900/30 border-2 border-orange-500/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs text-gray-400">BITCOIN</div>
                            <div className="text-2xl font-bold text-white mt-1">
                                BITCOIN
                            </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                        BTC Volume (Last Hour)
                    </div>
                    <div className="text-2xl font-bold text-orange-300">
                        {formatBtc(stats.btcVolume)}
                    </div>
                </div>
            </div>
        </div>
    );
};
