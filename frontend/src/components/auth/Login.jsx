import { useState } from 'react';
import { Container } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('student');

  const roles = [
    { id: 'student', label: 'Student Dashboard', email: 'student@demo.com', desc: 'View-only access to simulations' },
    { id: 'teacher', label: 'Teacher Dashboard', email: 'teacher@demo.com', desc: 'Design & monitor simulations' },
    { id: 'admin', label: 'Admin Panel', email: 'admin@demo.com', desc: 'Full system access & control' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        maxWidth: '28rem',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Container style={{ width: '3rem', height: '3rem', color: '#7c3aed' }} />
        </div>
        
        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          color: '#4c1d95',
          marginBottom: '0.5rem'
        }}>
          IntelliScaleSim
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          Welcome back! Please sign in to your account.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                width: '100%',
                padding: '1rem',
                marginBottom: '0.75rem',
                borderRadius: '0.5rem',
                border: selectedRole === role.id ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                background: selectedRole === role.id ? '#f5f3ff' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                {role.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                {role.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {role.desc}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onLogin(selectedRole)}
          className="btn-primary"
        >
          Sign In
        </button>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#f9fafb', 
          borderRadius: '0.5rem' 
        }}>
          <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Demo Credentials:
          </p>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
            <p>Student: student@demo.com</p>
            <p>Teacher: teacher@demo.com</p>
            <p>Admin: admin@demo.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
