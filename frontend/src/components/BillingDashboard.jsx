import React, { useState } from 'react';
import { DollarSign, Activity, Calculator } from 'lucide-react';
import ScenarioBilling from './student/ScenarioBilling';
import RealTimeBilling from './RealTimeBilling';

const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div style={{ padding: '30px', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header Section - EXACT Deploy style */}
      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
            <DollarSign size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Billing & Cost Management
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Track real-time container costs and simulate cloud resource expenses
            </p>
          </div>
        </div>
      </div>

      {/* Tab Buttons Section - EXACT Deploy style */}
      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('realtime')}
            style={{ 
              padding: '12px 24px', 
              background: activeTab === 'realtime' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'realtime' ? 'white' : '#6b7280', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <Activity size={20} /> Real-Time Billing
          </button>
          
          <button 
            onClick={() => setActiveTab('simulator')}
            style={{ 
              padding: '12px 24px', 
              background: activeTab === 'simulator' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'simulator' ? 'white' : '#6b7280', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <Calculator size={20} /> Scenario-Based Billing
          </button>
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'realtime' ? (
            <RealTimeBilling />
          ) : (
            <ScenarioBilling />
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
