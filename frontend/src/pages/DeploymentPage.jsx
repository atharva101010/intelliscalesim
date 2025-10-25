import { Rocket } from 'lucide-react';
import DeploymentForm from '../components/deployments/DeploymentForm';

const DeploymentPage = ({ onNavigate }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Rocket style={{ width: '2.5rem', height: '2.5rem', color: '#8b5cf6' }} />
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
            Deploy Your Application
          </h1>
          <p style={{ color: '#6b7280' }}>
            Deploy applications from Docker Hub or GitHub. Supports both public and private repositories.
          </p>
        </div>
      </div>

      <DeploymentForm onNavigate={onNavigate} />
    </div>
  );
};

export default DeploymentPage;
