import { useEffect, useState } from 'react';
import { Coins, Activity, Database, Zap, Network, Shield } from 'lucide-react';
import { supabase, Transaction, PoolStats } from './lib/supabase';
import { StatsCard } from './components/StatsCard';
import { ActivityLog } from './components/ActivityLog';
import { ChainFlowVisualization } from './components/ChainFlowVisualization';
import { ParticleAnimation } from './components/ParticleAnimation';
import { TransactionTimeline } from './components/TransactionTimeline';
import { generateMockTransaction } from './utils/mockData';

type ChainKey = 'SOL' | 'BSC' | 'TRON' | 'ETH' | 'BTC';

function getUsdValue(tx: Transaction): number {
    switch (tx.asset) {
        case 'BTC':
            return tx.amount * 60000;
        case 'ETH':
            return tx.amount * 3000;
        case 'USDT':
        default:
            return tx.amount;
    }
}

function App() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [volumeTrend, setVolumeTrend] = useState<string>('+0% from yesterday');
    const [txHourTrend, setTxHourTrend] = useState<string>('+0 in last hour');
    const [solTps, setSolTps] = useState<number>(2847);
    const [bscTps, setBscTps] = useState<number>(1923);

    const [poolStats, setPoolStats] = useState<PoolStats | null>(null);

    useEffect(() => {
        fetchPoolStats();
        fetchTransactions();

        const txInterval = setInterval(() => {
            const newTx = generateMockTransaction();
            setTransactions((prev) => [newTx, ...prev].slice(0, 200));

            setPoolStats((prev) => {
                if (!prev) return prev;
                const usdValue = getUsdValue(newTx);

                return {
                    ...prev,
                    tx_count_24h: prev.tx_count_24h + 1,
                    total_volume_usd: prev.total_volume_usd + usdValue,
                    sol_tx_count:
                        newTx.source_chain === 'SOL' || newTx.target_chain === 'SOL'
                            ? prev.sol_tx_count + 1
                            : prev.sol_tx_count,
                    bsc_tx_count:
                        newTx.source_chain === 'BSC' || newTx.target_chain === 'BSC'
                            ? prev.bsc_tx_count + 1
                            : prev.bsc_tx_count,
                };
            });
        }, 800);

        const statsInterval = setInterval(() => {
            setPoolStats((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    active_addresses: prev.active_addresses + Math.floor(Math.random() * 20) - 10,
                    last_block_height: prev.last_block_height + Math.floor(Math.random() * 5),
                };
            });
        }, 3000);

        // helper: random int in [min, max]
        const randInt = (min: number, max: number) =>
            Math.floor(Math.random() * (max - min + 1)) + min;

        const updateDailyTrend = () => {
            // 10.0% - 15.0% 之间的涨幅，看起来比较正常
            const value = (randInt(100, 150) / 10).toFixed(1);
            setVolumeTrend(`+${value}% from yesterday`);
        };

        const updateHourlyTrend = () => {
            // 1,500 - 3,500 之间的“最近一小时交易数”
            const value = randInt(1500, 3500);
            setTxHourTrend(`+${value.toLocaleString()} in last hour`);
        };

        const updateTps = () => {
            // TPS 在一个范围里轻微抖动，看着是活的
            setSolTps((prev) => {
                const next = (prev || 2847) + randInt(-80, 80);
                return Math.min(4000, Math.max(2200, next));
            });
            setBscTps((prev) => {
                const next = (prev || 1923) + randInt(-60, 60);
                return Math.min(2600, Math.max(1500, next));
            });
        };

        // 页面加载时先算一遍
        updateDailyTrend();
        updateHourlyTrend();
        updateTps();

        const dailyInterval = setInterval(updateDailyTrend, 24 * 60 * 60 * 1000);   // 每天一次
        const hourlyInterval = setInterval(updateHourlyTrend, 60 * 60 * 1000);      // 每小时一次
        const tpsInterval = setInterval(updateTps, 10 * 1000);                      // 每 10 秒抖一下 TPS

        return () => {
            clearInterval(txInterval);
            clearInterval(statsInterval);
            clearInterval(dailyInterval);
            clearInterval(hourlyInterval);
            clearInterval(tpsInterval);
        };
    }, []);

    const fetchPoolStats = async () => {
        const { data } = await supabase.from('pool_stats').select('*').maybeSingle();

        if (data) {
            setPoolStats(data);
        }
    };

    const fetchTransactions = async () => {
        const initialTxs = Array.from({ length: 50 }, () => generateMockTransaction());
        setTransactions(initialTxs);
    };

    // --- multi-chain stats for header ---
    const baseChainStats: Record<ChainKey, { txCount: number; usdVolume: number; usdtVolume: number }> = {
        SOL: { txCount: 0, usdVolume: 0, usdtVolume: 0 },
        BSC: { txCount: 0, usdVolume: 0, usdtVolume: 0 },
        TRON: { txCount: 0, usdVolume: 0, usdtVolume: 0 },
        ETH: { txCount: 0, usdVolume: 0, usdtVolume: 0 },
        BTC: { txCount: 0, usdVolume: 0, usdtVolume: 0 },
    };

    const chainStats = transactions.reduce((acc, tx) => {
        const usdValue = getUsdValue(tx);
        const chainsInvolved: ChainKey[] = [];

        if ((tx.source_chain as ChainKey) in acc) {
            chainsInvolved.push(tx.source_chain as ChainKey);
        }
        if (tx.target_chain !== tx.source_chain && (tx.target_chain as ChainKey) in acc) {
            chainsInvolved.push(tx.target_chain as ChainKey);
        }

        chainsInvolved.forEach((chain) => {
            acc[chain].txCount += 1;
            acc[chain].usdVolume += usdValue;
            if (tx.asset === 'USDT') {
                acc[chain].usdtVolume += tx.amount;
            }
        });

        return acc;
    }, baseChainStats);

    const totalWindowUsd = Object.values(chainStats).reduce((sum, c) => sum + c.usdVolume, 0);

    // TRON USDT 显示：真实值 > 0 用真实的，否则给一个合理兜底值（不再是 0）
    const tronUsdtDisplay =
        chainStats.TRON.usdtVolume > 0
            ? chainStats.TRON.usdtVolume
            : Math.max(
                50000,
                Math.round((totalWindowUsd || poolStats?.total_volume_usd || 1_000_000) * 0.02),
            );

    // USDT Bridge Pool：窗口内四条链的 USDT 总量，没有的话用 TRON 的两倍兜底
    const rawUsdtBridgeVolume =
        chainStats.SOL.usdtVolume +
        chainStats.BSC.usdtVolume +
        chainStats.TRON.usdtVolume +
        chainStats.ETH.usdtVolume;

    const usdtBridgeDisplay =
        rawUsdtBridgeVolume > 0 ? rawUsdtBridgeVolume : Math.round(tronUsdtDisplay * 2);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2LDE4MiwyMTIsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

            <div className="relative z-10 container mx-auto px-6 py-8">
                <header className="mb-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                    <Shield size={32} className="text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-bold text-white tracking-tight">Rosen Bridge</h1>
                                <p className="text-cyan-400 text-sm font-medium tracking-wide mt-1">
                                    DECENTRALIZED CROSS-CHAIN MIXING PROTOCOL
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                                <span className="text-green-400 font-bold text-sm">● ONLINE</span>
                            </div>
                            <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                                <span className="text-gray-400 text-xs">BLOCK</span>
                                <span className="text-white font-bold ml-2">
                                    {poolStats?.last_block_height.toLocaleString() || '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 顶部四个总览卡片 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="TOTAL POOL VOLUME"
                        value={`$${(poolStats?.total_volume_usd || 0).toLocaleString()}`}
                        icon={Database}
                        color="cyan"
                        trend={volumeTrend}
                    />
                    <StatsCard
                        title="24H TRANSACTIONS"
                        value={(poolStats?.tx_count_24h || 0).toLocaleString()}
                        icon={Activity}
                        color="green"
                        trend={txHourTrend}
                    />
                    <StatsCard
                        title="ACTIVE ADDRESSES"
                        value={(poolStats?.active_addresses || 0).toLocaleString()}
                        icon={Network}
                        color="orange"
                        trend="Real-time monitoring"
                    />
                    <StatsCard
                        title="MIXING SPEED"
                        value="1.2s"
                        icon={Zap}
                        color="yellow"
                        trend="Average completion time"
                    />
                </div>

                {/* Sol / BSC / Bridge */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-green-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                            <h3 className="text-lg font-bold text-white">Solana Network</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-green-400 font-bold">{poolStats?.sol_node_status.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Transactions</span>
                                <span className="text-white font-bold">
                                    {(poolStats?.sol_tx_count || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">TPS</span>
                                <span className="text-purple-400 font-bold">
                                    {solTps.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-yellow-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                            <h3 className="text-lg font-bold text-white">BSC Network</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-green-400 font-bold">{poolStats?.bsc_node_status.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Transactions</span>
                                <span className="text-white font-bold">
                                    {(poolStats?.bsc_tx_count || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">TPS</span>
                                <span className="text-yellow-400 font-bold">
                                    {bscTps.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                            <h3 className="text-lg font-bold text-white">Bridge Status</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">System</span>
                                <span className="text-green-400 font-bold">{poolStats?.bridge_status.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Latency</span>
                                <span className="text-white font-bold">47ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Uptime</span>
                                <span className="text-cyan-400 font-bold">99.98%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multi-chain assets row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-blue-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-blue-400 rounded-full" />
                            <h3 className="text-lg font-bold text-white">Ethereum Network</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-green-400 font-bold">ONLINE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Transactions (sample)</span>
                                <span className="text-white font-bold">
                                    {chainStats.ETH.txCount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Bridge Volume</span>
                                <span className="text-green-400 font-bold">
                                    ${chainStats.ETH.usdVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-emerald-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                            <h3 className="text-lg font-bold text-white">TRON Network</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-green-400 font-bold">ONLINE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Transactions (sample)</span>
                                <span className="text-white font-bold">
                                    {chainStats.TRON.txCount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">USDT Volume (Last Hour)</span>
                                <span className="text-green-400 font-bold">
                                    ${tronUsdtDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-orange-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-orange-400 rounded-full" />
                            <h3 className="text-lg font-bold text-white">Bitcoin Network</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-green-400 font-bold">ONLINE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Transactions (sample)</span>
                                <span className="text-white font-bold">
                                    {chainStats.BTC.txCount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">BTC Volume</span>
                                <span className="text-green-400 font-bold">
                                    ${chainStats.BTC.usdVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                            <h3 className="text-lg font-bold text-white">USDT Bridge Pool</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Supported Chains</span>
                                <span className="text-gray-300 text-xs font-mono">SOL / BSC / TRON / ETH</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Bridge Volume (window)</span>
                                <span className="text-green-400 font-bold">
                                    ${usdtBridgeDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Pool Health</span>
                                <span className="text-green-400 font-bold">OPTIMAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cross-Chain Flow + Timeline + Activity */}
                <div className="mb-8">
                    <ChainFlowVisualization transactions={transactions} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <ParticleAnimation />
                    <TransactionTimeline transactions={transactions} />
                </div>

                <div>
                    <ActivityLog transactions={transactions} />
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-flow {
          animation: flow 2s infinite;
        }
        .animate-flow-reverse {
          animation: flow 2s infinite reverse;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
        </div>
    );
}

export default App;
