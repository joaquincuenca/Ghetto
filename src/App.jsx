import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./views/pages/LandingPage";
import BookingPage from "./views/pages/BookingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<BookingPage />} />
      </Routes>
    </Router>
  );
}

export default App;