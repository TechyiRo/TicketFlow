import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Users, Briefcase, KeyRound, Search, X, Plus, Trash2, Shield, Mail, Calendar, FolderSync, Ticket as TicketIcon } from 'lucide-react';
import toast from 'react-hot-toast';

// Import SVG avatars
import avatar1 from '../../assets/avatars/avatar1.svg';
import avatar2 from '../../assets/avatars/avatar2.svg';
import avatar3 from '../../assets/avatars/avatar3.svg';
import avatar4 from '../../assets/avatars/avatar4.svg';
import avatar5 from '../../assets/avatars/avatar5.svg';
import avatar6 from '../../assets/avatars/avatar6.svg';
import avatar7 from '../../assets/avatars/avatar7.svg';
import avatar8 from '../../assets/avatars/avatar8.svg';

const avatarMap = {
  avatar1, avatar2, avatar3, avatar4,
  avatar5, avatar6, avatar7, avatar8
};

// 1. Password Reset Modal
function PasswordResetModal({ isOpen, onClose, user, type }) {
  const { resetPassword } = useAdmin();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      toast.error('Password must be at least 5 characters');
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(type, user._id, newPassword);
      setNewPassword('');
      onClose();
    } catch (err) {
      // Error is toasted in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        style={{
          background: 'rgba(6, 10, 26, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: '0 0 50px rgba(0, 229, 255, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
        className="w-full max-w-md rounded-2xl p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <KeyRound className="text-[#00E5FF] w-5 h-5" /> Overwrite Password
        </h2>
        <p className="text-xs text-text-secondary mb-6">
          Directly set and display a new plaintext password for <strong className="text-[#00E5FF]">{user.fullName}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">New Password</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Type new password directly"
              className="w-full bg-[#030612] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold bg-[#00E5FF] text-[#020308] hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_#00E5FF] transition-all disabled:opacity-50 mt-2 text-xs uppercase tracking-wider"
          >
            {loading ? 'Overwriting...' : 'Overwrite Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. Create Employee Modal
function CreateEmployeeModal({ isOpen, onClose }) {
  const { createEmployee } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    temporaryPassword: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.department || !formData.temporaryPassword) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await createEmployee(formData);
      setFormData({ fullName: '', email: '', department: '', temporaryPassword: '' });
      onClose();
    } catch (err) {
      // Error is toasted
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        style={{
          background: 'rgba(6, 10, 26, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: '0 0 50px rgba(0, 229, 255, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
        className="w-full max-w-md rounded-2xl p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <Plus className="text-[#00E5FF] w-5 h-5" /> Provision Employee
        </h2>
        <p className="text-xs text-text-secondary mb-6">
          Register a support employee account in the security database.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Rohidas Kadam"
              className="w-full bg-[#030612] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g. rohidas@company.com"
              className="w-full bg-[#030612] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g. Technical Support"
              className="w-full bg-[#030612] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Temporary Password</label>
            <input
              type="text"
              value={formData.temporaryPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
              placeholder="Enter temp plain password"
              className="w-full bg-[#030612] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold bg-[#00E5FF] text-[#020308] hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_#00E5FF] transition-all disabled:opacity-50 mt-2 text-xs uppercase tracking-wider"
          >
            {loading ? 'Creating...' : 'Create Employee Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 3. Profile Details Modal
function ProfileDetailsModal({ isOpen, onClose, user, type }) {
  if (!isOpen || !user) return null;

  const isEmployee = type === 'employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        style={{
          background: 'rgba(6, 10, 26, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          boxShadow: '0 0 60px rgba(0, 229, 255, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
        className="w-full max-w-2xl rounded-2xl p-6 relative flex flex-col max-h-[85vh] overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            <img 
              src={avatarMap[user.avatar] || user.avatar || avatarMap.avatar1} 
              alt={user.fullName} 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white">{user.fullName}</h2>
            <span className="text-xs text-[#00E5FF] font-semibold">@{user.username}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
              {isEmployee ? 'Support Representative' : 'Registered Client'}
            </span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <Mail className="w-5 h-5 text-[#00E5FF]" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-text-secondary">Email address</span>
                <span className="text-xs font-semibold text-white truncate">{isEmployee ? user.email : (user.company?.email || 'N/A')}</span>
              </div>
            </div>

            {isEmployee ? (
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <FolderSync className="w-5 h-5 text-[#00E5FF]" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Department</span>
                  <span className="text-xs font-semibold text-white">{user.department}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <Calendar className="w-5 h-5 text-[#00E5FF]" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Company Name</span>
                  <span className="text-xs font-semibold text-white">{user.company?.name || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 col-span-1 md:col-span-2">
              <KeyRound className="w-5 h-5 text-[#FFB347]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#FFB347] tracking-widest">Plain-Text Password (Visible)</span>
                <span className="text-sm font-mono font-black text-white">{user.plainTextPassword || 'WinRo'}</span>
              </div>
            </div>
          </div>

          {/* Tickets list */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#00E5FF] mb-3 flex items-center gap-2">
              <TicketIcon className="w-4 h-4" /> {isEmployee ? 'Currently Assigned Tickets' : 'Ticket History Log'}
            </h3>
            
            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase font-black tracking-widest text-text-secondary border-b border-white/5">
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold text-white/90">
                  {isEmployee ? (
                    user.assignedTickets && user.assignedTickets.length > 0 ? (
                      user.assignedTickets.map(t => (
                        <tr key={t._id}>
                          <td className="py-2.5 px-4 font-mono text-[#00E5FF]">{t.ticketId}</td>
                          <td className="py-2.5 px-4 truncate max-w-[200px]">{t.title}</td>
                          <td className="py-2.5 px-4 uppercase text-[9px]">{t.priority}</td>
                          <td className="py-2.5 px-4 uppercase text-[9px] text-accent-success">{t.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-text-secondary uppercase text-[10px]">No tickets assigned</td>
                      </tr>
                    )
                  ) : (
                    user.tickets && user.tickets.length > 0 ? (
                      user.tickets.map(t => (
                        <tr key={t._id}>
                          <td className="py-2.5 px-4 font-mono text-[#00E5FF]">{t.ticketId}</td>
                          <td className="py-2.5 px-4 truncate max-w-[200px]">{t.title}</td>
                          <td className="py-2.5 px-4 uppercase text-[9px]">{t.priority}</td>
                          <td className="py-2.5 px-4 uppercase text-[9px] text-accent-success">{t.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-text-secondary uppercase text-[10px]">No ticket history found</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminManageUsers() {
  const { users, employees, loading, fetchUsers, fetchEmployees, deleteEmployee } = useAdmin();
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'employees'
  const [search, setSearch] = useState('');
  
  // Modals state
  const [resetModal, setResetModal] = useState({ isOpen: false, user: null, type: '' });
  const [createModal, setCreateModal] = useState(false);
  const [profileModal, setProfileModal] = useState({ isOpen: false, user: null, type: '' });

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, [fetchUsers, fetchEmployees]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the Employee "${name}"? This will return all their assigned tickets back to Unassigned.`)) {
      try {
        await deleteEmployee(id);
      } catch (err) {
        // Handled in context
      }
    }
  };

  const displayedList = activeTab === 'clients' ? users : employees;
  const filteredList = displayedList.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020308] text-white overflow-hidden p-2">
      
      {/* Header Panel */}
      <div 
        style={{
          background: 'rgba(6, 9, 24, 0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        className="rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#00E5FF]">System Audits Node</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Directory</h1>
          <p className="text-xs text-text-secondary mt-0.5 font-semibold">
            View profiles, audits, plain-text passwords, and delete or create employee records.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#040612] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'clients' 
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white shadow-[0_0_12px_rgba(0,229,255,0.35)]' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Clients
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'employees' 
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white shadow-[0_0_12px_rgba(0,229,255,0.35)]' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Employees
            </button>
          </div>

          {/* Provision Employee Button */}
          {activeTab === 'employees' && (
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[#00E5FF] text-[#020308] hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_#00E5FF] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Provision
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab} by name or username...`}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
        />
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-10 text-text-secondary font-bold uppercase tracking-widest text-xs">
            No active directories found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map(item => {
              const userAvatar = avatarMap[item.avatar] || item.avatar || avatarMap.avatar1;
              return (
                <div 
                  key={item._id} 
                  style={{
                    background: 'rgba(6, 9, 24, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  className="p-5 rounded-2xl flex flex-col gap-4 group hover:border-[#00E5FF]/30 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div 
                      onClick={() => setProfileModal({ isOpen: true, user: item, type: activeTab === 'clients' ? 'user' : 'employee' })}
                      className="w-11 h-11 rounded-full bg-white/5 border border-white/15 p-0.5 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img src={userAvatar} alt={item.fullName} className="w-full h-full object-contain" />
                    </div>
                    <div 
                      onClick={() => setProfileModal({ isOpen: true, user: item, type: activeTab === 'clients' ? 'user' : 'employee' })}
                      className="flex flex-col min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="text-sm font-extrabold text-white truncate hover:text-[#00E5FF] transition-colors">
                        {item.fullName}
                      </span>
                      <span className="text-[10px] text-text-secondary truncate font-semibold">@{item.username}</span>
                    </div>
                  </div>

                  <div className="flex-1 text-[11px] text-text-secondary flex flex-col gap-1.5 font-semibold">
                    {activeTab === 'clients' ? (
                      <>
                        <div className="flex justify-between"><span>Company:</span> <span className="text-white truncate max-w-[140px]">{item.company?.name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Submitted Tickets:</span> <span className="text-[#00E5FF] font-black">{item.ticketCount || 0}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between"><span>Dept:</span> <span className="text-white truncate max-w-[140px]">{item.department}</span></div>
                        <div className="flex justify-between"><span>Assigned Tickets:</span> <span className="text-[#00E5FF] font-black">{item.assignedTickets?.length || 0}</span></div>
                      </>
                    )}
                    {/* Plaintext Password - VISIBLY DISPLAYED */}
                    <div className="flex justify-between border-t border-white/5 pt-2 mt-1">
                      <span className="text-[#FFB347] font-bold">PLAIN PASSWORD:</span> 
                      <span className="text-white font-mono font-black">{item.plainTextPassword || 'WinRo'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-white/5 pt-3">
                    <button
                      onClick={() => setResetModal({ isOpen: true, user: item, type: activeTab === 'clients' ? 'user' : 'employee' })}
                      className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#FFB347] bg-[#FFB347]/10 border border-[#FFB347]/20 hover:bg-[#FFB347]/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Reset Pw
                    </button>
                    {activeTab === 'employees' && (
                      <button
                        onClick={() => handleDelete(item._id, item.fullName)}
                        className="py-1.5 px-3 rounded-xl text-[10px] font-black uppercase text-[#FF4C4C] bg-[#FF4C4C]/10 border border-[#FF4C4C]/20 hover:bg-[#FF4C4C]/20 transition-all flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal containers */}
      <PasswordResetModal 
        isOpen={resetModal.isOpen} 
        onClose={() => setResetModal({ isOpen: false, user: null, type: '' })}
        user={resetModal.user}
        type={resetModal.type}
      />

      <CreateEmployeeModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
      />

      <ProfileDetailsModal
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, user: null, type: '' })}
        user={profileModal.user}
        type={profileModal.type}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}} />
    </div>
  );
}
