import ComingSoon from '../components/ComingSoon.jsx';

export default function NotificationsPage() {
  return (
    <ComingSoon
      icon="🔔"
      title="Notification Center"
      description="The Notification Service handles all system event notifications for HomeEssentials+. Triggered by the Payment Service, it sends order confirmations, payment receipts, low-stock warnings, and delivery updates to users."
      port={3006}
      features={[
        { icon: '✅', label: 'Order Confirmed' },
        { icon: '💳', label: 'Payment Received' },
        { icon: '❌', label: 'Payment Failed' },
        { icon: '⚠️', label: 'Low Stock Alert' },
        { icon: '📧', label: 'Email Alerts' },
        { icon: '📱', label: 'SMS Alerts' },
      ]}
    />
  );
}
