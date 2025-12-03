import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaMotorcycle, FaLock, FaUser } from 'react-icons/fa';
import { RiderAuthService } from '../../../services/RiderAuthService';

export default function RiderLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
        const result = RiderAuthService.login(username, password);
        
        if (result.success) {
            navigate('/rider/dashboard');
        } else {
            setError(result.message);
        }
        } catch (err) {
        setError('An error occurred. Please try again.');
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-yellow-600 p-6 text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-full">
                <FaMotorcycle className="text-4xl text-yellow-600" />
                </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Rider Login</h1>
            <p className="text-gray-200 mt-2">Access your rider dashboard</p>
            </div>

            {/* Login Form */}
            <div className="p-8">
            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                {/* Username */}
                <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm font-medium">
                    <FaUser />
                    Username
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                />
                </div>

                {/* Password */}
                <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm font-medium">
                    <FaLock />
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                />
                </div>

                {/* Submit Button */}
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                {loading ? (
                    <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Logging in...
                    </>
                ) : (
                    <>
                    <FaMotorcycle />
                    Login as Rider
                    </>
                )}
                </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-gray-400 text-sm">
                Not a rider?{' '}
                <Link to="/" className="text-yellow-400 hover:text-yellow-300 font-medium">
                    Return to Home
                </Link>
                </p>
                <p className="text-gray-400 text-sm mt-2">
                Admin?{' '}
                <Link to="/admin/login" className="text-blue-400 hover:text-blue-300 font-medium">
                    Admin Login
                </Link>
                </p>
            </div>
            </div>
        </div>
        </div>
    );
}