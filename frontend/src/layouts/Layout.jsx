import { LogOut } from 'lucide-react';

const Layout = ({ children, role, onLogout, navigation, activePage, setActivePage }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>IntelliScaleSim</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
            {role}
          </p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navigation.map((item) => (
            <div
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`sidebar-item ${activePage === item.id ? 'sidebar-item-active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: '#06b6d4',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#0891b2'}
          onMouseOut={(e) => e.target.style.background = '#06b6d4'}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '2rem', 
        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
        overflowY: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
