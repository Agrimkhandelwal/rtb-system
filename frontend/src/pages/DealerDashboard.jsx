import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import AuctionLostView from '../components/AuctionLostView';

const DealerDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    const [auctions, setAuctions] = useState([]);
    const [activeAuction, setActiveAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidError, setBidError] = useState('');
    const [bidSuccess, setBidSuccess] = useState('');

    const bidsEndRef = useRef(null);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else if (user?.role !== 'DEALER') {
            navigate('/admin');
        } else {
            fetchAuctions();
        }
    }, [user, token, navigate]);

    useEffect(() => {
        if (socket) {
            const handlePriceUpdate = (payload) => {
                if (payload.type === 'NEW_BID' && activeAuction && payload.auctionId === activeAuction.id) {
                    setActiveAuction(prev => ({
                        ...prev,
                        current_price: payload.current_price,
                        bids: [payload.bid, ...(prev.bids || [])]
                    }));
                } else if (payload.type === 'AUCTION_STARTED') {
                    setAuctions(prev => prev.map(a => a.id === payload.auction.id ? payload.auction : a));
                } else if (payload.type === 'AUCTION_CLOSED') {
                    setAuctions(prev => prev.map(a => a.id === payload.auction.id ? payload.auction : a));
                    if (activeAuction && activeAuction.id === payload.auction.id) {
                        setActiveAuction(prev => ({ ...prev, status: 'CLOSED' }));
                    }
                }
            };

            socket.on('price_update', handlePriceUpdate);
            socket.on('message', handlePriceUpdate); // Also listen on generic message if emitted directly

            return () => {
                socket.off('price_update', handlePriceUpdate);
                socket.off('message', handlePriceUpdate);
            };
        }
    }, [socket, activeAuction]);

    const fetchAuctions = async () => {
        try {
            const res = await api.get('/auctions');
            // Dealers primarily see ACTIVE and CLOSED (to see results), maybe INACTIVE too.
            setAuctions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const joinAuction = async (auctionId) => {
        try {
            const res = await api.get(`/auctions/${auctionId}`);
            setActiveAuction(res.data);
            setBidAmount((Number(res.data.current_price) + 1).toFixed(2));
            setBidError('');
            setBidSuccess('');

            if (socket) {
                socket.emit('joinAuction', auctionId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const leaveAuction = () => {
        if (socket && activeAuction) {
            socket.emit('leaveAuction', activeAuction.id);
        }
        setActiveAuction(null);
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setBidError('');
        setBidSuccess('');

        try {
            await api.post(`/auctions/${activeAuction.id}/bid`, {
                amount: parseFloat(bidAmount)
            });
            setBidSuccess('Bid placed successfully!');
            setTimeout(() => setBidSuccess(''), 3000);
            setBidAmount((parseFloat(bidAmount) + 1).toFixed(2));
        } catch (err) {
            setBidError(err.response?.data?.error || 'Failed to place bid');
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

    if (activeAuction?.status === 'CLOSED' && activeAuction?.bids?.length > 0) {
        console.log('--- WINNER DEBUG ---');
        console.log('Auction Bids:', activeAuction.bids);
        console.log('Top Bidder ID:', activeAuction.bids[0].dealer_id);
        console.log('Top Bidder Type:', typeof activeAuction.bids[0].dealer_id);
        console.log('Current User object:', user);
        console.log('Current user.userId:', user?.userId);
        console.log('Current user.userId Type:', typeof user?.userId);
        console.log('Current user.id:', user?.id);
        console.log('Match?', String(activeAuction.bids[0].dealer_id) === String(user?.userId || user?.id));
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-gray-200 flex flex-col font-sans selection:bg-indigo-500/30">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Auction List */}
                <div className={`space-y-6 flex flex-col h-[calc(100vh-8rem)] ${activeAuction ? 'hidden lg:flex lg:col-span-1' : 'lg:col-span-1'}`}>
                    <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 flex-shrink-0">Live & Upcoming</h2>

                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {auctions.map(auction => (
                            <div
                                key={auction.id}
                                className={`bg-white/[0.02] backdrop-blur-xl border ${activeAuction?.id === auction.id ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-indigo-500/[0.02]' : 'border-white/5 hover:border-white/20'} rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl`}
                                onClick={() => joinAuction(auction.id)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{auction.item_name}</h3>
                                    {auction.status === 'ACTIVE' && (
                                        <span className="flex h-3 w-3 relative shrink-0 mt-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm items-end relative z-10">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Current Bid</p>
                                        <p className="text-2xl font-mono text-indigo-400 font-bold tracking-tight">${Number(auction.current_price).toFixed(2)}</p>
                                        {auction.status === 'CLOSED' && (
                                            <p className="text-sm mt-3 text-gray-400 border-t border-white/5 pt-3 flex items-center gap-2">
                                                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Winner</span>
                                                {String(auction.highest_bid?.dealer_id) === String(user?.id) ? (
                                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(52,211,153,0.1)]">You</span>
                                                ) : (
                                                    <span className="text-gray-300 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md truncate max-w-[120px] inline-block">{auction.highest_bid ? auction.highest_bid.dealer_name : 'None'}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg border ${auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                        auction.status === 'CLOSED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            'bg-white/5 text-gray-400 border-white/10'
                                        }`}>
                                        {auction.status}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {auctions.length === 0 && (
                            <div className="text-center py-12 text-gray-500 bg-white/[0.01] border border-white/5 rounded-2xl">
                                <div className="text-4xl mb-3 opacity-20">📭</div>
                                No auctions found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Active Auction View */}
                {activeAuction ? (
                    <div className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)] relative">
                        {/* Decorative background glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden h-full relative z-10">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                            {/* Header (Sticky at top of right panel) */}
                            <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-black/20 gap-4 shrink-0 relative z-20">
                                <div className="w-full md:w-auto">
                                    <button onClick={leaveAuction} className="text-indigo-400 text-sm hover:text-indigo-300 mb-2 sm:mb-3 flex items-center transition-colors font-medium">
                                        <span className="mr-2">←</span> Back to list
                                    </button>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex flex-wrap items-center gap-3 tracking-tight">
                                        {activeAuction.item_name}
                                        <span className={`px-3 py-1 text-xs uppercase tracking-wider font-bold rounded-full border ${activeAuction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                                            activeAuction.status === 'CLOSED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                'bg-white/5 text-gray-400 border-white/10'
                                            }`}>
                                            {activeAuction.status}
                                        </span>
                                    </h2>
                                </div>
                                <div className="text-left md:text-right bg-black/30 px-5 py-3 sm:px-6 sm:py-4 rounded-2xl border border-white/5 w-full md:w-auto shadow-inner">
                                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-1">Highest Bid</p>
                                    <p className="text-3xl sm:text-4xl md:text-5xl font-mono text-emerald-400 font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                        ${Number(activeAuction.current_price).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Scrollable Content Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-black/20 relative z-10 w-full">
                                {/* Bidding Area / Status */}
                                {activeAuction.status === 'ACTIVE' ? (
                                    <div className="p-5 sm:p-8 border-b border-white/10 bg-black/40 relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                                        <form onSubmit={handlePlaceBid} className="flex flex-col sm:flex-row gap-4 relative z-10 w-full">
                                            <div className="flex-1 relative group">
                                                <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xl sm:text-2xl group-active:text-indigo-400 transition-colors pointer-events-none">$</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min={(Number(activeAuction.current_price) + 0.01).toFixed(2)}
                                                    step="0.01"
                                                    value={bidAmount}
                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 sm:pl-12 pr-4 sm:pr-6 py-4 sm:py-5 text-white text-2xl sm:text-3xl font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder:text-gray-700 font-bold"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95 whitespace-nowrap text-lg sm:w-auto w-full"
                                            >
                                                Place Bid
                                            </button>
                                        </form>
                                        {bidError && <p className="text-rose-400 text-sm mt-4 font-medium bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl flex items-center gap-2 relative z-10"><span className="text-lg">⚠️</span> {bidError}</p>}
                                        {bidSuccess && <p className="text-emerald-400 text-sm mt-4 font-medium bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center gap-2 relative z-10"><span className="text-lg">✅</span> {bidSuccess}</p>}
                                    </div>
                                ) : activeAuction.status === 'CLOSED' ? (
                                    <div className="p-6 md:p-10 border-b border-white/10 bg-black/60 flex flex-col items-center justify-center space-y-4 sm:space-y-6 relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
                                        <div className="text-6xl sm:text-7xl mb-1 sm:mb-2 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-bounce-slow">🏆</div>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight">Auction Ended</h3>
                                        {activeAuction.bids && activeAuction.bids.length > 0 ? (
                                            String(activeAuction.bids[0].dealer_id) === String(user?.id) ? (
                                                <div className="text-center w-full max-w-lg relative z-10">
                                                    <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6">
                                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                                                        <p className="text-gray-400 uppercase tracking-widest text-[10px] sm:text-xs font-bold">Winning Bid</p>
                                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                                                    </div>
                                                    <p className="text-emerald-400 font-mono font-bold text-4xl sm:text-5xl mb-6 sm:mb-8 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">${Number(activeAuction.bids[0].amount).toFixed(2)}</p>

                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border-2 border-emerald-500/50 text-emerald-300 px-6 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-[0_0_40px_rgba(52,211,153,0.2)] animate-pulse-slow backdrop-blur-md w-full">
                                                            <p className="font-extrabold text-xl sm:text-2xl mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-200">🎉 You won! 🎉</p>
                                                            <p className="text-xs sm:text-sm font-medium text-emerald-300">Congratulations on your winning bid.</p>
                                                        </div>
                                                        <p className="text-gray-400 text-xs font-medium bg-black/40 px-4 py-2 rounded-xl border border-white/5 space-x-3 flex items-center justify-center">
                                                            <span>Closed at: {new Date(activeAuction.end_time || activeAuction.updated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className="opacity-30">•</span>
                                                            <span>Total bids: {activeAuction.bids.length}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <AuctionLostView activeAuction={activeAuction} user={user} onBackToList={leaveAuction} />
                                            )
                                        ) : (
                                            <div className="bg-white/5 border border-white/10 px-8 py-6 rounded-2xl backdrop-blur-md z-10 w-full max-w-[300px] text-center">
                                                <p className="text-gray-400 font-medium">No bids were placed on this item.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 sm:p-12 border-b border-white/10 bg-black/40 text-center text-gray-500 font-medium text-lg shrink-0">
                                        <span className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-white/5 bg-white/5 shadow-inner">Bidding hasn't started yet.</span>
                                    </div>
                                )}

                                {/* Live Bid History */}
                                <div className="flex flex-col p-0 bg-black/20 relative shrink-0">
                                    <div className="px-6 py-4 bg-black/80 border-b border-white/10 sticky top-0 z-20 flex justify-between items-center backdrop-blur-xl">
                                        <span className="font-bold text-gray-300 uppercase tracking-wider text-xs">Live Bid History</span>
                                        <span className="bg-white/5 text-gray-400 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/10">Latest 50</span>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-3">
                                        {activeAuction.bids && activeAuction.bids.length > 0 ? (
                                            activeAuction.bids.map((bid, i) => (
                                                <div key={bid.id || i} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${i === 0 && activeAuction.status === 'ACTIVE' ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_4px_20px_rgba(99,102,241,0.1)]' :
                                                    i === 0 && activeAuction.status === 'CLOSED' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_20px_rgba(52,211,153,0.1)]' :
                                                        'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                                    }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${i === 0 && activeAuction.status === 'ACTIVE' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                            i === 0 && activeAuction.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                                'bg-white/10 text-gray-400 border border-white/5'
                                                            }`}>
                                                            {bid.dealer_name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className={`font-semibold ${i === 0 ? 'text-white' : 'text-gray-300'}`}>
                                                                    {bid.dealer_name}
                                                                </p>
                                                                {String(bid.dealer_id) === String(user?.id) && <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">You</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium">{new Date(bid.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`font-mono font-bold tracking-tight ${i === 0 && activeAuction.status === 'ACTIVE' ? 'text-indigo-400 text-xl' :
                                                        i === 0 && activeAuction.status === 'CLOSED' ? 'text-emerald-400 text-xl drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                                                            'text-gray-400 text-lg'
                                                        }`}>
                                                        ${Number(bid.amount).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 py-16 flex flex-col items-center justify-center bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
                                                <div className="text-4xl mb-4 opacity-30 grayscale">🔨</div>
                                                <p className="font-medium text-gray-400">No bids placed yet.</p>
                                                <p className="text-sm mt-1 opacity-70">Be the first to step up.</p>
                                            </div>
                                        )}
                                        <div ref={bidsEndRef} />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex col-span-2 items-center justify-center bg-white/[0.01] border border-white/5 border-dashed rounded-3xl relative overflow-hidden group h-[calc(100vh-8rem)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                        <div className="text-center text-gray-400">
                            <div className="text-8xl mb-8 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-30 transition-all duration-700 transform group-hover:scale-110 drop-shadow-2xl">⚡</div>
                            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 mb-2 tracking-tight">Select an auction</p>
                            <p className="text-base mt-2 text-gray-500 font-medium">Join the floor and compete in real-time.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DealerDashboard;
