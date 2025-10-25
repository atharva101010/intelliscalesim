import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, BarChart3, FileEdit, LogOut } from 'lucide-react';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Simulations', icon: <Settings size={20} />, path: '/dashboard/manage-simulations' },
    { name: 'Progress', icon: <BarChart3 size={20} />, path: '/dashboard/view-progress' },
    { name: 'Assignments', icon: <FileEdit size={20} />, path: '/dashboard/create-assignments' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: 'linear-gradient(180deg, #7c3aed 0%, #4c1d95 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            IntelliScaleSim
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            Teacher Portal
          </p>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1 }}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  margin: '6px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'rgba(239, 68, 68, 0.2)',
            color: 'white',
            marginTop: '20px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>

      {/* Main Content Area with Outlet */}
      <div style={{ marginLeft: '260px', flex: 1, background: '#f3f4f6' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default TeacherLayout;
