import ComingSoon from '../components/ComingSoon.jsx';

export default function PaymentsPage() {
  return (
    <ComingSoon
      icon="💳"
      title="Payment Processing"
      description="The Payment Service simulates secure payment processing for HomeEssentials+. It receives payment requests from the Order Service, processes them, and triggers the Notification Service on success or failure."
      port={3005}
      features={[
        { icon: '💰', label: 'Process Payments' },
        { icon: '📜', label: 'Payment History' },
        { icon: '✅', label: 'Success Handling' },
        { icon: '❌', label: 'Failure Handling' },
        { icon: '🔔', label: 'Trigger Notifications' },
        { icon: '🛡️', label: 'Secure Processing' },
      ]}
    />
  );
}
