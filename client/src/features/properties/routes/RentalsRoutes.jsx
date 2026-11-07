import ProtectedRoute from '../../../app/routes/ProtectedRoute';
import ManagersPage from '../../landlord/ManagersPage';
import PropertiesHome from '../../landlord/PropertiesHome';
import PropertyOperationsPage from '../../landlord/PropertyOperationsPage';
import SettingsPage from '../../landlord/SettingsPage';
import PropertyRedirect from '../pages/PropertyRedirect';

const shortcuts = [
  { path: '/rooms', section: 'rooms' },
  { path: '/contracts', section: 'contracts' },
  { path: '/rental-requests', section: 'rental-requests' },
  { path: '/tenants', section: 'tenants' },
];

const shortcutRoutes = shortcuts.map(({ path, section }) => ({
  path,
  element: <PropertyRedirect section={section} />,
}));

const landlordRoutes = [
  {
    path: '/properties',
    element: (
      <ProtectedRoute roles={['landlord', 'manager']}>
        <PropertiesHome />
      </ProtectedRoute>
    ),
  },
  {
    path: '/managers',
    element: (
      <ProtectedRoute roles={['landlord']}>
        <ManagersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute roles={['landlord']}>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/properties/:propertyId/operations',
    element: (
      <ProtectedRoute roles={['landlord', 'manager']}>
        <PropertyOperationsPage />
      </ProtectedRoute>
    ),
  },
];

export default [...shortcutRoutes, ...landlordRoutes];
