import ProtectedRoute from '../../../app/routes/ProtectedRoute';
import UtilityReadingsPage from '../pages/UtilityReadingsPage';

const utilityReadingsRoutes = [
  {
    path: '/utility-readings',
    element: (
      <ProtectedRoute roles={['landlord', 'manager']}>
        <UtilityReadingsPage />
      </ProtectedRoute>
    ),
  },
];

export default utilityReadingsRoutes;
