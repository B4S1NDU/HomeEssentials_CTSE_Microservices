import ComingSoon from '../components/ComingSoon.jsx';

export default function OrdersPage() {
  return (
    <ComingSoon
      icon="🛒"
      title="Order Management"
      description="The Order Service is the core orchestrator of HomeEssentials+. It manages the full order lifecycle by coordinating with User, Product, Inventory, and Payment services — from stock reservation to final confirmation."
      port={3004}
      features={[
        { icon: '📝', label: 'Place Orders' },
        { icon: '🔍', label: 'Track Status' },
        { icon: '📋', label: 'Order History' },
        { icon: '❌', label: 'Cancel Orders' },
        { icon: '👤', label: 'User Validation' },
        { icon: '📦', label: 'Stock Reservation' },
      ]}
    />
  );
}
