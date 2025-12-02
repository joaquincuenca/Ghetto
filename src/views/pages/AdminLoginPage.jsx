// src/views/pages/AdminLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Static credentials (you can change these)
const ADMIN_CREDENTIALS = {
    username: 'ghettorider',
    password: 'callepogi'
};

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate loading delay
        setTimeout(() => {
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                // Set admin session
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminUsername', username);
                
                // Redirect to admin dashboard
                navigate('/admin');
            } else {
                setError('Invalid username or password');
                setLoading(false);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => navigate('/')}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← Back to Home
                </button>
            </div>

            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-800">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className="text-3xl font-bold text-yellow-400 mb-2">Admin Login</h1>
                    <p className="text-gray-400">Ghetto Riders Dashboard</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter admin username"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter admin password"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                            <p className="text-red-300 text-sm flex items-center gap-2">
                                <span>❌</span>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Logging in...
                            </>
                        ) : (
                            <>
                                Login
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Authorized personnel only</p>
                </div>
            </div>
        </div>
    );
}