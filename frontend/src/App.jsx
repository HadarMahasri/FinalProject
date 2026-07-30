import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistantModal from './components/AIAssistantModal';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VendorsPage from './pages/VendorsPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import CustomerDashboard from './pages/CustomerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const handleOpenAIModal = () => setIsAIModalOpen(true);
  const handleCloseAIModal = () => setIsAIModalOpen(false);

  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            <Navbar onOpenAIModal={handleOpenAIModal} />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage onOpenAIModal={handleOpenAIModal} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/:id" element={<VendorDetailsPage />} />

              {/* Protected Routes */}
              <Route 
                path="/dashboard/customer" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard onOpenAIModal={handleOpenAIModal} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/dashboard/vendor" 
                element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/dashboard/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>

          <Footer />

          {/* AI Assistant Modal */}
          <AIAssistantModal isOpen={isAIModalOpen} onClose={handleCloseAIModal} />

        </div>
      </Router>
    </AuthProvider>
  );
}
