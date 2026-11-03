import { useOutletContext } from 'react-router-dom';
import PropertiesPage from './PropertiesPage';
import ManagedPropertiesPage from './ManagedPropertiesPage';

export default function PropertiesHome() {
  const { user } = useOutletContext();
  return user.role === 'manager' ? <ManagedPropertiesPage /> : <PropertiesPage />;
}
