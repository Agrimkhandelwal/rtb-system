import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
            <div className="font-bold text-xl text-white">
                RTB Sys <span className="text-sm font-medium text-gray-400 opacity-80 border border-gray-700 px-2 py-0.5 rounded ml-2">{user?.role}</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-gray-300 hidden sm:inline-block">{user?.name}</span>
                <button
                    onClick={handleLogout}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
