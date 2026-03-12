import { useState } from 'react';
import { usersApi } from '../../api/userApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ROLES } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = Object.values(ROLES).map((r) => ({ value: r, label: r }));

export default function EditUserForm({ user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? 'Customer',
    city: user?.address?.city ?? '',
    country: user?.address?.country ?? 'Sri Lanka',
    line1: user?.address?.line1 ?? '',
    line2: user?.address?.line2 ?? '',
    district: user?.address?.district ?? '',
    postalCode: user?.address?.postalCode ?? '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = user?.id ?? user?._id;
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        address: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          district: form.district,
          postalCode: form.postalCode,
          country: form.country,
        },
      };
      await usersApi.update(userId, payload);
      toast.success('User updated successfully');
      onSaved();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Identity */}
      <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 mb-1">
        <p className="text-xs text-gray-500">Email (read-only)</p>
        <p className="text-sm font-medium text-gray-700">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value={form.firstName} onChange={set('firstName')} required />
        <Input label="Last Name" value={form.lastName} onChange={set('lastName')} required />
      </div>

      <Select label="Role" value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />

      {/* Address section */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Address</p>
        <div className="space-y-3">
          <Input label="Address Line 1" value={form.line1} onChange={set('line1')} />
          <Input label="Address Line 2" value={form.line2} onChange={set('line2')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="District" value={form.district} onChange={set('district')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Postal Code" value={form.postalCode} onChange={set('postalCode')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </div>
    </form>
  );
}
