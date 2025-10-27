import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentLayout from './components/StudentLayout';
import Dashboard from './pages/Dashboard';
import DeployPage from './pages/DeployPage';  // ✅ Import the actual file!
import LoadTesting from './pages/LoadTesting';
import ContainersPage from './pages/ContainersPage';
import BillingSimulator from './pages/BillingSimulator';
import DocumentationPage from './pages/DocumentationPage';
import AutoScaling from './pages/AutoScaling';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Student Routes with Layout */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="deploy" element={<DeployPage />} />
          <Route path="containers" element={<ContainersPage />} />
          <Route path="auto-scaling" element={<AutoScaling />} />
          <Route path="load-testing" element={<LoadTesting />} />
          <Route path="billing" element={<BillingSimulator />} />
          <Route path="documentation" element={<DocumentationPage />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
