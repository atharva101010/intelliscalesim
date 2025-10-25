import React from 'react';
import { Server, Plus, Play, Pause, Trash2 } from 'lucide-react';

const ManageSimulationsPage = () => {
  const simulations = [
    { id: 1, name: 'HPA Basics', status: 'Active', students: 12 },
    { id: 2, name: 'Load Balancing', status: 'Inactive', students: 0 },
    { id: 3, name: 'Resource Limits', status: 'Active', students: 8 },
  ];

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Simulation Manager
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Create and manage learning simulations
          </p>
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          <Plus size={20} />
          New Simulation
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gap: '20px' 
      }}>
        {simulations.map((sim) => (
          <div key={sim.id} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#7c3aed15',
                color: '#7c3aed'
              }}>
                <Server size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  {sim.name}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  {sim.students} students enrolled
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: sim.status === 'Active' ? '#10b98115' : '#e5e7eb',
                color: sim.status === 'Active' ? '#10b981' : '#6b7280',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {sim.status}
              </span>
              <button style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f615',
                color: '#3b82f6',
                cursor: 'pointer'
              }}>
                {sim.status === 'Active' ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: '#ef444415',
                color: '#ef4444',
                cursor: 'pointer'
              }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageSimulationsPage;
