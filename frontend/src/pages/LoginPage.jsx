import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'teacher') {
      navigate('/dashboard');
    } else {
      navigate('/student');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '420px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>IntelliScaleSim</h1>
        <form onSubmit={handleLogin}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px' }}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button type="submit" style={{ width: '100%', padding: '14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
