import React from 'react';

const AuctionLostView = ({ activeAuction, user, onBackToList }) => {
    // Calculate user's highest bid
    const userBid = activeAuction.bids.find(b => String(b.dealer_id) === String(user?.id));
    const userHighestAmount = userBid ? Number(userBid.amount) : 0;
    const winningAmount = Number(activeAuction.bids[0].amount);
    const difference = Math.max(0, winningAmount - userHighestAmount);

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto gap-6 relative z-10">
            {/* Status Indicator Badge */}
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 w-full shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                You did not win this auction
            </div>

            {/* Winner Info & Details Block */}
            <div className="bg-white/5 border border-white/10 text-gray-300 px-6 sm:px-8 py-6 sm:py-8 rounded-2xl backdrop-blur-md w-full relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex flex-col relative z-20 w-full mb-6 border-b border-white/5 pb-6">
                    <p className="font-medium text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 mb-1">Winner</p>
                    <p className="text-xl sm:text-2xl text-white font-bold truncate w-full" title={activeAuction.bids[0].dealer_name}>{activeAuction.bids[0].dealer_name}</p>
                </div>

                {/* Comparison Details Grid */}
                <div className="grid grid-cols-2 gap-4 relative z-20 w-full mb-6">
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center shadow-inner">
                        <p className="text-[10px] sm:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-wider">Winning Bid</p>
                        <p className="font-mono text-emerald-400 font-bold text-xl sm:text-2xl drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">${winningAmount.toFixed(2)}</p>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center shadow-inner">
                        <p className="text-[10px] sm:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-wider">Your Highest</p>
                        {userHighestAmount > 0 ? (
                            <p className="font-mono text-white font-bold text-xl sm:text-2xl">${userHighestAmount.toFixed(2)}</p>
                        ) : (
                            <p className="font-mono text-gray-500 font-medium text-lg sm:text-xl py-0.5">No bids</p>
                        )}
                    </div>
                </div>

                {/* Difference Badge */}
                {userHighestAmount > 0 && difference > 0 && (
                    <div className="w-full flex justify-center mb-6 relative z-20">
                        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest">
                            Difference: ${difference.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Auction Stats */}
                <div className="relative z-20 bg-black/40 px-5 py-3 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Closed</span>
                        <span className="text-gray-300 text-xs font-medium bg-black/50 px-2.5 py-1 rounded border border-white/5 shadow-inner">
                            {new Date(activeAuction.end_time || activeAuction.updated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Bids</span>
                        <span className="text-gray-300 text-xs font-medium bg-black/50 px-2.5 py-1 rounded border border-white/5 shadow-inner">
                            {activeAuction.bids.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10 mt-2">
                <button
                    onClick={onBackToList}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] active:scale-95 text-sm uppercase tracking-wider"
                >
                    Browse Live Auctions
                </button>
                <button
                    onClick={onBackToList}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-white/20 rounded-xl py-3.5 sm:py-4 font-bold transition-all active:scale-95 text-sm uppercase tracking-wider shadow-inner"
                >
                    Back to List
                </button>
            </div>
        </div>
    );
};

export default AuctionLostView;
