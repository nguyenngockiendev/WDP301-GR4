import PropertiesPage from './PropertiesPage';
import ManagedPropertiesPage from './ManagedPropertiesPage';
import { getCurrentUser } from '../../shared/utils/auth';

export default function PropertiesHome() {
  const user = getCurrentUser();
  return user?.role === 'manager' ? <ManagedPropertiesPage /> : <PropertiesPage />;
}
