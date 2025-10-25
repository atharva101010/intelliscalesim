import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Gauge, BookOpen, BarChart3, Zap, LogOut, TrendingUp, DollarSign, Activity } from 'lucide-react';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/student' },
    { name: 'Deploy', icon: <Package size={20} />, path: '/student/deploy' },
    { name: 'Containers', icon: <Package size={20} />, path: '/student/containers' },
    { name: 'Auto-Scaling', icon: <Gauge size={20} />, path: '/student/auto-scaling' },
    { name: 'Load Testing', icon: <Zap size={20} />, path: '/student/load-testing' },
    { name: 'Trends', icon: <TrendingUp size={20} />, path: '/student/trends' },
    { name: 'Billing', icon: <DollarSign size={20} />, path: '/student/billing' },
    { name: 'Documentation', icon: <BookOpen size={20} />, path: '/student/documentation' },
    { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/student/analytics' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: '260px', background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)', padding: '20px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '20px', marginBottom: '30px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>IntelliScaleSim</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>Student Portal</p>
        </div>
        <nav style={{ flex: 1 }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={index} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', margin: '6px 0', borderRadius: '8px', cursor: 'pointer', background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent', transition: 'all 0.2s' }}>
                {item.icon}
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>
        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.2)', transition: 'all 0.2s' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
      <div style={{ marginLeft: '260px', flex: 1, background: '#f3f4f6' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;
