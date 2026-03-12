import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/userApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { getRoleBadgeColor, formatDate, getInitials, extractErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    city: user?.address?.city ?? '',
    country: user?.address?.country ?? 'Sri Lanka',
    line1: user?.address?.line1 ?? '',
    district: user?.address?.district ?? '',
    postalCode: user?.address?.postalCode ?? '',
  });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const userId = user?.id ?? user?._id;

  const setP = (field) => (e) => setProfileForm((f) => ({ ...f, [field]: e.target.value }));
  const setW = (field) => (e) => setPwForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile(userId, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        address: {
          line1: profileForm.line1,
          city: profileForm.city,
          district: profileForm.district,
          postalCode: profileForm.postalCode,
          country: profileForm.country,
        },
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.oldPassword) errs.oldPassword = 'Current password required';
    if (pwForm.newPassword.length < 6) errs.newPassword = 'Min. 6 characters';
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(userId, {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {getInitials(user?.firstName, user?.lastName)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className={getRoleBadgeColor(user?.role) + ' border-transparent'}>
              {user?.role}
            </Badge>
            <span className="text-xs text-gray-400">Joined {formatDate(user?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={profileForm.firstName} onChange={setP('firstName')} required />
            <Input label="Last Name" value={profileForm.lastName} onChange={setP('lastName')} required />
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <p className="text-xs text-gray-500">Email (cannot be changed)</p>
            <p className="text-sm font-medium text-gray-700">{user?.email}</p>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Address</p>
            <div className="space-y-3">
              <Input label="Address Line 1" value={profileForm.line1} onChange={setP('line1')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" value={profileForm.city} onChange={setP('city')} />
                <Input label="District" value={profileForm.district} onChange={setP('district')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Postal Code" value={profileForm.postalCode} onChange={setP('postalCode')} />
                <Input label="Country" value={profileForm.country} onChange={setP('country')} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>Save Profile</Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showOld ? 'text' : 'password'}
              value={pwForm.oldPassword}
              onChange={setW('oldPassword')}
              error={pwErrors.oldPassword}
              required
            />
            <button type="button" onClick={() => setShowOld((s) => !s)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={pwForm.newPassword}
              onChange={setW('newPassword')}
              error={pwErrors.newPassword}
              required
            />
            <button type="button" onClick={() => setShowNew((s) => !s)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Input
            label="Confirm New Password"
            type="password"
            value={pwForm.confirm}
            onChange={setW('confirm')}
            error={pwErrors.confirm}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={pwLoading}>Change Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
