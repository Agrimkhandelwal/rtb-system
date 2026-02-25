import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const AdminDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [newStartPrice, setNewStartPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [auctionToClose, setAuctionToClose] = useState(null);

    useEffect(() => {
        if (socket) {
            const handlePriceUpdate = (payload) => {
                if (payload.type === 'NEW_BID') {
                    setAuctions(prev => prev.map(a =>
                        a.id === payload.auctionId
                            ? { ...a, current_price: payload.current_price }
                            : a
                    ));
                } else if (payload.type === 'AUCTION_STARTED' || payload.type === 'AUCTION_CLOSED') {
                    setAuctions(prev => prev.map(a => a.id === payload.auction.id ? payload.auction : a));
                }
            };

            socket.on('price_update', handlePriceUpdate);
            return () => {
                socket.off('price_update', handlePriceUpdate);
            };
        }
    }, [socket]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else if (user?.role !== 'ADMIN') {
            navigate('/dealer');
        } else {
            fetchAuctions();
        }
    }, [user, token, navigate]);

    const fetchAuctions = async () => {
        try {
            const res = await api.get('/auctions');
            setAuctions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auctions', {
                item_name: newItemName,
                start_price: parseFloat(newStartPrice)
            });
            setAuctions([res.data, ...auctions]);
            setNewItemName('');
            setNewStartPrice('');
        } catch (err) {
            console.error(err);
        }
    };

    const updateAuctionStatus = async (id, action) => {
        try {
            const res = await api.post(`/auctions/${id}/${action}`);
            setAuctions(auctions.map(a => a.id === id ? res.data : a));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-gray-200 font-sans selection:bg-indigo-500/30 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 space-y-12">
                <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                    <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>

                    <h2 className="text-3xl font-extrabold text-white mb-8 relative z-10 tracking-tight">Create New Auction</h2>
                    <form onSubmit={handleCreateAuction} className="flex flex-col md:flex-row gap-6 relative z-10">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Item Name</label>
                            <input
                                type="text"
                                required
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder:text-gray-600 font-medium"
                                placeholder="e.g. Vintage Rolex Submariner"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Starting Price ($)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                value={newStartPrice}
                                onChange={(e) => setNewStartPrice(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder:text-gray-600"
                                placeholder="100.00"
                            />
                        </div>
                        <div className="md:pt-6">
                            <button
                                type="submit"
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95 text-lg h-[60px]"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </section>

                <section>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-8 tracking-tight">Manage Auctions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auctions.map(auction => (
                            <div key={auction.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between group transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">{auction.item_name}</h3>
                                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg border ${auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                            auction.status === 'CLOSED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                'bg-white/5 text-gray-400 border-white/10'
                                            }`}>
                                            {auction.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-8 bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-gray-400 flex justify-between items-center text-xs uppercase tracking-wider font-semibold">Start Price: <span className="text-white font-mono text-base">${Number(auction.start_price).toFixed(2)}</span></p>
                                        <p className="text-gray-400 flex justify-between items-center text-xs uppercase tracking-wider font-semibold">Current Price: <span className="text-indigo-400 font-mono font-bold text-xl drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">${Number(auction.current_price).toFixed(2)}</span></p>

                                        <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                                            <p className="text-gray-500 flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold">
                                                Created: <span className="text-gray-400 font-medium">{new Date(auction.created_at || Date.now()).toLocaleDateString()}</span>
                                            </p>
                                            <p className="text-gray-500 flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold">
                                                Total Bids: <span className="text-gray-400 font-medium">{auction.bids ? auction.bids.length : 0}</span>
                                            </p>
                                        </div>

                                        {auction.status === 'CLOSED' && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-gray-400 flex justify-between items-center text-xs uppercase tracking-wider font-semibold">
                                                    Winner:
                                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                        {auction.highest_bid ? auction.highest_bid.dealer_name : 'No bids'}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    {auction.status === 'INACTIVE' && (
                                        <button
                                            onClick={() => updateAuctionStatus(auction.id, 'start')}
                                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 text-sm uppercase tracking-wider"
                                        >
                                            Start Auction
                                        </button>
                                    )}
                                    {auction.status === 'ACTIVE' && (
                                        <button
                                            onClick={() => {
                                                setAuctionToClose(auction);
                                                setShowConfirmModal(true);
                                            }}
                                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] active:scale-95 text-sm uppercase tracking-wider"
                                        >
                                            Close Auction
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {auctions.length === 0 && (
                            <div className="col-span-full text-center py-16 flex flex-col items-center justify-center bg-white/[0.01] rounded-3xl border border-white/5 border-dashed">
                                <div className="text-4xl mb-4 opacity-30 grayscale">🔨</div>
                                <p className="font-medium text-gray-400 text-lg">No auctions created yet.</p>
                                <p className="text-sm mt-1 opacity-70 text-gray-500">Create one above to get started.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && auctionToClose && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-rose-500"></div>
                        <h3 className="text-2xl font-bold text-white mb-4">Close Auction?</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Are you sure you want to close <span className="text-white font-medium">"{auctionToClose.item_name}"</span>?
                            This action cannot be undone and will determine the final winner.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setAuctionToClose(null);
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-3.5 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    updateAuctionStatus(auctionToClose.id, 'close');
                                    setShowConfirmModal(false);
                                    setAuctionToClose(null);
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3.5 font-bold transition-colors shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                            >
                                Confirm Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
