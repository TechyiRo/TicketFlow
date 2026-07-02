import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../pwa/useNotifications';
import Avatar from '../../components/shared/Avatar';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import { Building, Phone, Mail, MapPin, Bell, BellOff, ShieldCheck } from 'lucide-react';
import { getAccessToken } from '../../services/api';
import toast from 'react-hot-toast';

export function UserProfile() {
  const { user } = useAuth();
  const token = getAccessToken();
  
  // Connect to PWA Push Notifications hook
  const { permission, requestPermission, showLocalNotification } = useNotifications(token);
  const [submittingNotification, setSubmittingNotification] = useState(false);

  const handlePushToggle = async () => {
    setSubmittingNotification(true);
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        toast.success('Push notifications successfully enabled!');
        showLocalNotification('Notifications Active', 'You will now receive alerts for status changes and ticket updates.');
      } else {
        toast.error('Permission denied or dismissed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Notification configuration failed.');
    } finally {
      setSubmittingNotification(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 select-none animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-sm font-black uppercase text-text-secondary tracking-widest">
          My Profile
        </h2>
        <p className="text-[10px] text-text-secondary mt-0.5">
          View your profile details and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: User Summary Card */}
        <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col items-center text-center gap-4 select-none">
          <Avatar avatar={user.avatar} size="xl" />
          
          <div>
            <h3 className="text-base font-extrabold text-text-primary leading-none">{user.fullName}</h3>
            <span className="text-xs text-text-secondary mt-2 block font-medium">@{user.username}</span>
          </div>

          <Badge variant="primary" className="py-1">
            Authorized Client User
          </Badge>
        </div>

        {/* MIDDLE COLUMN: Company & Credentials Details (Colspan 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section 1: Company Profile */}
          <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col gap-5 select-none">
            <div className="flex items-center gap-3 border-b border-borderColor pb-3 mb-1">
              <Building className="w-4.5 h-4.5 text-accent-glow" />
              <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">
                Company Details
              </h4>
            </div>

            {user.logo && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Company Logo:</span>
                <div className="w-12 h-12 rounded-lg border border-borderColor bg-background-primary overflow-hidden p-0.5">
                  <img src={user.logo} alt="Company Logo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Company Name:</span>
              <span className="text-xs text-text-primary font-semibold">{user.company?.name || 'N/A'}</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Address:</span>
              <span className="text-xs text-text-primary font-semibold flex items-start gap-1 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-text-secondary mt-0.5" />
                {user.company?.address || 'N/A'}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Phone contact:</span>
              <span className="text-xs text-text-primary font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-text-secondary" />
                {user.company?.contactNumber || 'N/A'}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Company Email:</span>
              <span className="text-xs text-text-primary font-semibold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-text-secondary" />
                {user.company?.email || 'Not configured'}
              </span>
            </div>
          </div>

          {/* Section 2: PWA Push Preferences */}
          <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col gap-4 select-none">
            <div className="flex items-center gap-3 border-b border-borderColor pb-3 mb-1">
              <Bell className="w-4.5 h-4.5 text-accent-glow" />
              <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">
                Notification Subscriptions
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div className="flex-1">
                <p className="text-xs text-text-primary font-bold">Push Notifications</p>
                <p className="text-[11px] text-text-secondary mt-1 max-w-sm leading-relaxed">
                  Receive critical real-time alerts for ticket assignment updates, comments, and resolutions.
                </p>
              </div>

              {permission === 'granted' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-success/15 border border-accent-success/30 text-accent-success font-bold text-xs select-none">
                  <ShieldCheck className="w-4 h-4" />
                  Active / Enabled
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  loading={submittingNotification}
                  onClick={handlePushToggle}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  Enable Push Alert
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
