import { Link } from 'react-router-dom';

const Navbar = () => (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] text-white">⚡</span>
                RTB System
            </div>
            <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
                    Login
                </Link>
                <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                    Create Account
                </Link>
            </div>
        </div>
    </nav>
);

const FeatureCard = ({ icon, title, description }) => (
    <div className="flex flex-col items-start p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 hover:bg-white/[0.04]">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const Footer = () => (
    <footer className="w-full py-8 border-t border-white/5 mt-auto relative z-10">
        <div className="text-center text-xs text-gray-600 space-y-1">
            <p>© 2026 Real-Time Bidding System</p>
            <p>Production-Grade Auction Platform</p>
        </div>
    </footer>
);

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-gray-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">

            <Navbar />

            {/* Subtle Hero Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[100px] pointer-events-none"></div>

            <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-6 relative z-10 w-full max-w-7xl mx-auto">

                {/* Hero Section */}
                <div className="text-center space-y-8 max-w-3xl mx-auto flex flex-col items-center">

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                        Next-Gen <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Real-Time Bidding</span>
                    </h1>

                    <div className="space-y-4">
                        <p className="text-lg md:text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                            Experience ultra-low latency auctions powered by WebSockets.
                            Built for scale, speed, and absolute reliability.
                        </p>
                        <p className="text-sm text-gray-500 font-medium max-w-xl mx-auto">
                            Designed for high-demand competitive auctions and real-time bidding environments.
                        </p>
                        <p className="text-sm text-indigo-400/80 font-medium mt-2">
                            Updates instantly across all connected users.
                        </p>

                        <div className="pt-4">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 shadow-inner border-dashed">
                                👋 Open multiple tabs to see real-time bidding in action
                            </span>
                        </div>
                    </div>
                </div>

                {/* Call To Action Area */}
                <div className="flex flex-col items-center space-y-6 w-full max-w-xl mt-12">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white text-center shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 group"
                        >
                            <span>Login & Join Auction</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-semibold text-white text-center border border-white/10 hover:border-white/20"
                        >
                            Create Account
                        </Link>
                    </div>

                    {/* Role Guidance inline with layout */}
                    <div className="text-xs text-gray-500 font-medium text-center bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
                        Admin can create auctions <span className="opacity-50 mx-2">•</span> Dealers can participate in live bidding
                    </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
                    <FeatureCard
                        icon="⚡"
                        title="Live Real-Time Updates"
                        description="Bids update instantly across all clients using optimized WebSocket connections."
                    />
                    <FeatureCard
                        icon="🔒"
                        title="Secure Bidding Engine"
                        description="Role-based access control and authenticated channels ensure bid integrity."
                    />
                    <FeatureCard
                        icon="🚀"
                        title="High-Concurrency Safe"
                        description="Bulletproof architecture prevents race conditions during high-volume bidding."
                    />
                </div>

            </main>

            <Footer />
        </div>
    );
};

export default Landing;
