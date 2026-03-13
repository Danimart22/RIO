import healthData from '../../../health.json';
import './HealthCheck.css';

export const HealthCheck = () => {
  return (
    <div className="health-container">
      <h1>Health Check</h1>
      <pre className="health-pre">
        {JSON.stringify(healthData, null, 2)}
      </pre>
    </div>
  );
};