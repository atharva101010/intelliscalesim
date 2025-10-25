import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wrench, BarChart3, FileText, LogOut } from 'lucide-react';

const TeacherLayout = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/manage-simulations', icon: Wrench, label: 'Manage Simulations' },
    { path: '/view-progress', icon: BarChart3, label: 'View Progress' },
    { path: '/create-assignments', icon: FileText, label: 'Create Assignments' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        position: 'fixed',
        height: '100vh'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            IntelliScaleSim
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Teacher Dashboard</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'white',
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <LogOut style={{ width: '20px', height: '20px' }} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '2rem',
        overflow: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;
