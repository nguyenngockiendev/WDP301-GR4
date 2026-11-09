import ProtectedRoute from '../../../app/routes/ProtectedRoute';
import CreateInvoicePage from '../pages/CreateInvoicePage';
import TenantInvoicesPage from '../pages/TenantInvoicesPage';
import ManageInvoicesPage from '../pages/ManageInvoicesPage';
import InvoicePaymentResultPage from '../pages/InvoicePaymentResultPage';

const invoiceRoutes = [
  {
    path: '/invoices',
    element: <ProtectedRoute roles={['landlord', 'manager']}><ManageInvoicesPage /></ProtectedRoute>,
  },
  {
    path: '/invoices/:invoiceId',
    element: <ProtectedRoute roles={['landlord', 'manager']}><ManageInvoicesPage /></ProtectedRoute>,
  },
  {
    path: '/invoices/my',
    element: <ProtectedRoute roles={['tenant']}><TenantInvoicesPage /></ProtectedRoute>,
  },
  {
    path: '/invoices/my/:invoiceId',
    element: <ProtectedRoute roles={['tenant']}><TenantInvoicesPage /></ProtectedRoute>,
  },
  {
    path: '/invoices/payment-result/:paymentCode',
    element: <ProtectedRoute roles={['tenant']}><InvoicePaymentResultPage /></ProtectedRoute>,
  },
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
