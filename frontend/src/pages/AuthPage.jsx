import { useState } from 'react';

export default function AuthPage({ onLogin }) {
  const [role, setRole] = useState('student');

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(role);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '10px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
        maxWidth: '400px', 
        width: '100%' 
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem', 
          color: '#333' 
        }}>
          IntelliScaleSim
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 'bold' 
            }}>
              Select Role:
            </label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                fontSize: '1rem' 
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Login as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
}
/* Cache clear: Sun Oct 19 01:23:54 PM IST 2025 */
