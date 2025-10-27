import { Rocket } from 'lucide-react';
import DeploymentForm from '../components/deployments/DeploymentForm';

const DeployPage = () => {
  return (
    <div style={{ padding: '30px', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', color: 'white' }}>
            <Rocket size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Deploy Your Application
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Deploy applications from Docker Hub or GitHub. Supports both public and private repositories.
            </p>
          </div>
        </div>
      </div>

      <DeploymentForm />
    </div>
  );
};

export default DeployPage;
