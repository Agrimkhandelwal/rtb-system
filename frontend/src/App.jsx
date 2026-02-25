import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DealerDashboard from './pages/DealerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/dealer/*" element={<DealerDashboard />} />
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Routes>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
