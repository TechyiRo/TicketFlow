import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../pwa/useNotifications';
import Avatar from '../../components/shared/Avatar';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import { FolderSync, Mail, Bell, ShieldCheck } from 'lucide-react';
import { getAccessToken } from '../../services/api';
import toast from 'react-hot-toast';

export function EmployeeProfile() {
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
        showLocalNotification('Notifications Active', 'You will now receive alerts for new ticket assignments.');
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
          Support Profile
        </h2>
        <p className="text-[10px] text-text-secondary mt-0.5">
          View your support specialist details and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Summary Card */}
        <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col items-center text-center gap-4 select-none">
          <Avatar avatar={user.avatar} size="xl" />
          
          <div>
            <h3 className="text-base font-extrabold text-text-primary leading-none">{user.fullName}</h3>
            <span className="text-xs text-text-secondary mt-2 block font-medium">@{user.username}</span>
          </div>

          <Badge variant="warning" className="py-1">
            Support Team Specialist
          </Badge>
        </div>

        {/* Details Card (Colspan 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Support contexts */}
          <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col gap-5 select-none">
            <div className="flex items-center gap-3 border-b border-borderColor pb-3 mb-1">
              <FolderSync className="w-4.5 h-4.5 text-accent-warning" />
              <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">
                Support Identity
              </h4>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Specialist:</span>
              <span className="text-xs text-text-primary font-semibold">{user.fullName}</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Official Email:</span>
              <span className="text-xs text-text-primary font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-text-secondary" />
                {user.email || 'N/A'}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-28 shrink-0">Department:</span>
              <span className="text-xs text-text-primary font-semibold capitalize bg-background-elevated px-2.5 py-0.5 rounded border border-borderColor">
                {user.department || 'N/A'}
              </span>
            </div>
          </div>

          {/* Web Push configuration */}
          <div className="bg-background-surface border border-borderColor rounded-2xl p-6 flex flex-col gap-4 select-none">
            <div className="flex items-center gap-3 border-b border-borderColor pb-3 mb-1">
              <Bell className="w-4.5 h-4.5 text-accent-warning" />
              <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">
                Push Notification Setup
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div className="flex-1">
                <p className="text-xs text-text-primary font-bold">Push Notifications</p>
                <p className="text-[11px] text-text-secondary mt-1 max-w-sm leading-relaxed">
                  Enable push tokens to receive immediate system notifications when new tickets are assigned to your queue.
                </p>
              </div>

              {permission === 'granted' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-success/15 border border-accent-success/30 text-accent-success font-bold text-xs select-none">
                  <ShieldCheck className="w-4 h-4" />
                  Active / Enabled
                </div>
              ) : (
                <Button
                  variant="warning"
                  size="sm"
                  loading={submittingNotification}
                  onClick={handlePushToggle}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  Enable Push Alerts
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
