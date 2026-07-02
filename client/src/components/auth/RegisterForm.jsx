import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye, EyeOff, User, Lock, Building, MapPin,
  Phone, Mail, Upload, FolderSync, Check, Zap,
} from 'lucide-react';
import { userRegisterSchema, employeeRegisterSchema } from '../../utils/validators';
import AvatarSelector from './AvatarSelector';
import toast from 'react-hot-toast';

/* ── Premium field label ── */
function FieldLabel({ children, required, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.65)' }}>
        {children}
      </span>
      {required && <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 900 }}>*</span>}
      {hint && (
        <span style={{ fontSize: 9, color: 'rgba(100,116,139,0.6)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 5 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

/* ── Premium glowing input ── */
function GlowInput({ icon: Icon, rightEl, error, textarea, rows = 2, style: extraStyle, ...rest }) {
  const [focused, setFocused] = useState(false);
  const borderC = error ? 'rgba(239,68,68,0.5)' : focused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.09)';
  const shadowC = error
    ? '0 0 0 3px rgba(239,68,68,0.1)'
    : focused ? '0 0 0 3px rgba(99,102,241,0.12), inset 0 0 20px rgba(99,102,241,0.03)' : 'none';

  const wrapStyle = {
    position: 'relative', display: 'flex',
    alignItems: textarea ? 'flex-start' : 'center',
    background: focused ? 'rgba(12,15,38,0.9)' : 'rgba(8,11,26,0.8)',
    border: `1px solid ${borderC}`,
    borderRadius: 11,
    boxShadow: shadowC,
    transition: 'all 0.22s ease',
    ...extraStyle,
  };
  const inputStyle = {
    width: '100%', background: 'transparent', outline: 'none', border: 'none',
    color: '#f1f5f9', fontSize: 12.5, fontFamily: 'inherit',
    padding: textarea ? '9px 12px' : '9px 12px',
    paddingLeft: Icon ? 34 : 12,
    paddingRight: rightEl ? 36 : 12,
    height: textarea ? 'auto' : 34,
    resize: 'none', lineHeight: 1.5,
    caretColor: '#818cf8',
  };

  const events = {
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
  };

  return (
    <div style={wrapStyle}>
      {Icon && (
        <Icon style={{
          position: 'absolute', left: 10, width: 13, height: 13, flexShrink: 0,
          color: focused ? 'rgba(129,140,248,0.85)' : 'rgba(99,102,241,0.45)',
          transition: 'color 0.2s',
          ...(textarea ? { top: 10 } : { top: '50%', transform: 'translateY(-50%)' }),
          pointerEvents: 'none',
        }} />
      )}
      {textarea
        ? <textarea rows={rows} {...rest} {...events} style={inputStyle} />
        : <input {...rest} {...events} style={inputStyle} />
      }
      {rightEl && (
        <div style={{
          position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(100,116,139,0.7)', display: 'flex', alignItems: 'center',
        }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

/* ── Section divider ── */
function SectionDivider({ emoji, label }) {
  return (
    <div style={{
      gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6,
    }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(99,102,241,0.35),rgba(255,255,255,0.04))' }} />
      <span style={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(129,140,248,0.8)', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {emoji} {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.04),rgba(6,182,212,0.3))' }} />
    </div>
  );
}

export function RegisterForm({ activeRole, onToggleForm, onSubmitSuccess }) {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  const schema = activeRole === 'user' ? userRegisterSchema : employeeRegisterSchema;
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: activeRole === 'user'
      ? { fullName: '', username: '', password: '', confirmPassword: '', avatar: '', companyName: '', companyAddress: '', contactNumber: '', companyEmail: '' }
      : { fullName: '', username: '', email: '', password: '', confirmPassword: '', avatar: 'avatar1', department: '' },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File exceeds 5MB'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (activeRole === 'user') {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => fd.append(k, v));
        if (logoFile) fd.append('logo', logoFile);
        await onSubmitSuccess('registerUser', fd);
      } else {
        await onSubmitSuccess('registerEmployee', data);
      }
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isUser = activeRole === 'user';
  const errTip = (err) => err && (
    <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600, marginTop: 2, display: 'block' }}>
      {err.message || 'Required'}
    </span>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Avatar strip ── */}
      <Controller name="avatar" control={control}
        render={({ field }) => (
          <AvatarSelector
            selectedAvatar={field.value}
            onChange={(v) => setValue('avatar', v, { shouldValidate: true })}
            error={errors.avatar}
          />
        )}
      />

      {/* ── Two-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14, rowGap: 9 }}>

        <SectionDivider emoji="👤" label="Profile Details" />

        {/* Full Name */}
        <div>
          <FieldLabel required>Full Name</FieldLabel>
          <GlowInput {...register('fullName')} icon={User} placeholder="John Doe" disabled={loading} error={errors.fullName} />
          {errTip(errors.fullName)}
        </div>

        {/* Username */}
        <div>
          <FieldLabel required>Username</FieldLabel>
          <GlowInput {...register('username')} icon={User} placeholder="johndoe_99" disabled={loading} error={errors.username} />
          {errTip(errors.username)}
        </div>

        {/* Password */}
        <div>
          <FieldLabel required>Password</FieldLabel>
          <GlowInput
            {...register('password')} icon={Lock}
            type={showPw ? 'text' : 'password'}
            placeholder="Strong password"
            disabled={loading} error={errors.password}
            style={{ boxShadow: errors.password ? undefined : '0 0 10px rgba(99,102,241,0.1)' }}
            rightEl={
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}>
                {showPw
                  ? <EyeOff style={{ width: 13, height: 13 }} />
                  : <Eye style={{ width: 13, height: 13 }} />}
              </button>
            }
          />
          {errTip(errors.password)}
        </div>

        {/* Confirm Password */}
        <div>
          <FieldLabel required>Confirm Password</FieldLabel>
          <GlowInput
            {...register('confirmPassword')} icon={Lock}
            type={showPw ? 'text' : 'password'}
            placeholder="Confirm password"
            disabled={loading} error={errors.confirmPassword}
            style={{ boxShadow: errors.confirmPassword ? undefined : '0 0 10px rgba(99,102,241,0.1)' }}
          />
          {errTip(errors.confirmPassword)}
        </div>

        {/* Email (employee) */}
        {!isUser && (
          <div>
            <FieldLabel required>Email Address</FieldLabel>
            <GlowInput {...register('email')} icon={Mail} type="email" placeholder="john@ticketflow.com" disabled={loading} error={errors.email} />
            {errTip(errors.email)}
          </div>
        )}

        {/* Department (employee) */}
        {!isUser && (
          <div>
            <FieldLabel required>Department</FieldLabel>
            <GlowInput {...register('department')} icon={FolderSync} placeholder="Technical Support" disabled={loading} error={errors.department} />
            {errTip(errors.department)}
          </div>
        )}

        {/* ── Company section ── */}
        {isUser && (
          <>
            <SectionDivider emoji="🏢" label="Company Details" />

            <div>
              <FieldLabel required>Company Name</FieldLabel>
              <GlowInput {...register('companyName')} icon={Building} placeholder="Acme Corp" disabled={loading} error={errors.companyName} />
              {errTip(errors.companyName)}
            </div>

            <div>
              <FieldLabel required>Contact Number</FieldLabel>
              <GlowInput {...register('contactNumber')} icon={Phone} placeholder="9876543210" disabled={loading} error={errors.contactNumber} />
              {errTip(errors.contactNumber)}
            </div>

            {/* Address — spans 2 cols */}
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel required>Company Address</FieldLabel>
              <GlowInput {...register('companyAddress')} icon={MapPin} textarea rows={2}
                placeholder="Enter full company address..." disabled={loading} error={errors.companyAddress} />
              {errTip(errors.companyAddress)}
            </div>

            <div>
              <FieldLabel hint="Optional">Company Email</FieldLabel>
              <GlowInput {...register('companyEmail')} icon={Mail} type="email" placeholder="billing@acme.com" disabled={loading} error={errors.companyEmail} />
            </div>

            {/* Logo upload */}
            <div>
              <FieldLabel hint="Optional">Company Logo</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Preview */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0, overflow: 'hidden',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Building style={{ width: 14, height: 14, color: 'rgba(99,102,241,0.45)' }} />
                  }
                </div>
                {/* Label */}
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 7, height: 34, paddingInline: 10,
                  background: 'rgba(8,11,26,0.8)', border: '1px dashed rgba(99,102,241,0.3)',
                  borderRadius: 11, cursor: 'pointer', transition: 'all 0.22s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(8,11,26,0.8)'; }}
                >
                  <Upload style={{ width: 12, height: 12, color: 'rgba(6,182,212,0.75)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'rgba(100,116,139,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {logoFile ? logoFile.name : 'Upload logo...'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} disabled={loading} />
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Submit ── */}
      <div style={{ marginTop: 8 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)',
            background: 'linear-gradient(135deg,rgba(6,182,212,1) 0%,rgba(99,102,241,1) 50%,rgba(168,85,247,1) 100%)',
            color: '#fff', fontSize: 13.5, fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            boxShadow: '0 0 35px rgba(99,102,241,0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
            transition: 'all 0.35s cubic-bezier(0.2,1,0.3,1)',
            position: 'relative', overflow: 'hidden',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.7), inset 0 2px 0 rgba(255,255,255,0.3)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 35px rgba(99,102,241,0.5), inset 0 2px 0 rgba(255,255,255,0.2)'; }}
        >
          {loading ? (
            <>
              <svg className="animate-spin" style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </>
          ) : (
            <>
              <Zap style={{ width: 15, height: 15 }} />
              Complete Registration
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: 'rgba(100,116,139,0.7)', fontWeight: 600 }}>
          Already have an account?{' '}
          <a href="#login" onClick={(e) => { e.preventDefault(); onToggleForm(); }}
            style={{ color: 'rgba(129,140,248,0.9)', fontWeight: 800 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(129,140,248,0.9)'; }}
          >
            Sign in here
          </a>
        </div>
      </div>
    </form>
  );
}

export default RegisterForm;
