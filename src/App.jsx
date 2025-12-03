import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./views/pages/LandingPage";
import BookingPage from "./views/pages/BookingPage";
import AdminLoginPage from "./views/pages/AdminLoginPage";
import AdminDashboard from "./views/pages/AdminDashboard";
import BookingTrackingPage from "./views/pages/BookingTrackingPage";
import { ProtectedRoute } from "./views/components/ProtectedRoute";
import RiderLogin from './views/pages/rider/RiderLogin';
import RiderDashboard from './views/pages/rider/RiderDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/track/:bookingNumber" element={<BookingTrackingPage />} />
        <Route path="/rider/login" element={<RiderLogin />} />
        <Route path="/rider/dashboard" element={<RiderDashboard />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;