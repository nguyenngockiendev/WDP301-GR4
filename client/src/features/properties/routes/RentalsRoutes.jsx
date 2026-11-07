import PropertyRedirect from '../pages/PropertyRedirect';

const shortcuts = [
  { path: '/rooms', section: 'rooms' },
  { path: '/contracts', section: 'contracts' },
  { path: '/rental-requests', section: 'rental-requests' },
  { path: '/tenants', section: 'tenants' },
];

export default shortcuts.map(({ path, section }) => ({
  path,
  element: <PropertyRedirect section={section} />,
}));