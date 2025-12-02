// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (!isAdmin) {
        // Redirect to login if not authenticated
        return <Navigate to="/admin/login" replace />;
    }
    
    return children;
}