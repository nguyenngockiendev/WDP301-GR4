import ProtectedRoute from '../../../app/routes/ProtectedRoute';
import CreateInvoicePage from '../pages/CreateInvoicePage';

const invoiceRoutes = [
  {
    path: '/invoices/new',
    element: (
      <ProtectedRoute roles={['landlord', 'manager']}>
        <CreateInvoicePage />
      </ProtectedRoute>
    ),
  },
];

export default invoiceRoutes;
