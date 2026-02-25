import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Client-side validation
        let errors = {};
        if (!email) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Please enter a valid email address";

        if (!password) errors.password = "Password is required";
        else if (password.length < 6) errors.password = "Password must be at least 6 characters";

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dealer');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans text-gray-200">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="bg-white/[0.02] border border-white/5 p-8 sm:p-10 rounded-3xl w-full max-w-md relative z-10 shadow-2xl backdrop-blur-md">

                <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Welcome Back</h2>
                <p className="text-gray-400 text-sm text-center mb-8 font-medium">Sign in to continue to live auctions.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-1.5 ml-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (validationErrors.email) setValidationErrors({ ...validationErrors, email: null });
                            }}
                            className={`w-full bg-black/40 border ${validationErrors.email ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-indigo-500'} rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-1 ${validationErrors.email ? 'focus:ring-red-400' : 'focus:ring-indigo-500'} transition-all shadow-inner`}
                            placeholder="you@example.com"
                        />
                        {validationErrors.email && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{validationErrors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-1.5 ml-1">Password</label>
                        <div className="relative group">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: null });
                                }}
                                className={`w-full bg-black/40 border ${validationErrors.password ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-indigo-500'} rounded-xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-1 ${validationErrors.password ? 'focus:ring-red-400' : 'focus:ring-indigo-500'} transition-all shadow-inner`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {validationErrors.password && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{validationErrors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-gray-500 text-sm font-medium">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold ml-1">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
