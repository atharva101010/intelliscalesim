import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './student-components/StudentLayout';
import StudentDashboard from './student-pages/StudentDashboard';
import DeployPage from './student-pages/DeployPage';
import ContainersPage from './student-pages/ContainersPage';
import AutoScalingPage from './student-pages/AutoScalingPage';
import DocumentationPage from './student-pages/DocumentationPage';
import AnalyticsPage from './student-pages/AnalyticsPage';
import AssignmentsPage from './student-pages/AssignmentsPage';

function StudentApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="deploy" element={<DeployPage />} />
          <Route path="containers" element={<ContainersPage />} />
          <Route path="auto-scaling" element={<AutoScalingPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="documentation" element={<DocumentationPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default StudentApp;
