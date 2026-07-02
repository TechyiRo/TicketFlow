import React, { useState } from 'react';
import { Check } from 'lucide-react';

import avatar1 from '../../assets/avatars/avatar1.svg';
import avatar2 from '../../assets/avatars/avatar2.svg';
import avatar3 from '../../assets/avatars/avatar3.svg';
import avatar4 from '../../assets/avatars/avatar4.svg';
import avatar5 from '../../assets/avatars/avatar5.svg';
import avatar6 from '../../assets/avatars/avatar6.svg';
import avatar7 from '../../assets/avatars/avatar7.svg';
import avatar8 from '../../assets/avatars/avatar8.svg';

const avatarList = [
  { id: 'avatar1', src: avatar1, name: 'Tech Face' },
  { id: 'avatar2', src: avatar2, name: 'Bot' },
  { id: 'avatar3', src: avatar3, name: 'Astronaut' },
  { id: 'avatar4', src: avatar4, name: 'Cyber Cat' },
  { id: 'avatar5', src: avatar5, name: 'Ninja' },
  { id: 'avatar6', src: avatar6, name: 'Mage' },
  { id: 'avatar7', src: avatar7, name: 'Bear' },
  { id: 'avatar8', src: avatar8, name: 'Fox Pro' },
];

export function AvatarSelector({ selectedAvatar, onChange, error }) {
  const [hoverId, setHoverId] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.65)' }}>
            Profile Avatar <span style={{ color: '#818cf8' }}>*</span>
          </span>
        </div>
        {error && <span style={{ fontSize: 9.5, color: '#f87171', fontWeight: 700 }}>{error.message || 'Select an avatar'}</span>}
      </div>

      {/* Horizontal avatar strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(8,11,26,0.75)',
        border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        backdropFilter: 'blur(8px)',
        gap: 6,
      }}>
        {avatarList.map((av) => {
          const isSel = selectedAvatar === av.id;
          const isHov = hoverId === av.id;

          return (
            <button
              key={av.id}
              type="button"
              onClick={() => onChange(av.id)}
              onMouseEnter={() => setHoverId(av.id)}
              onMouseLeave={() => setHoverId(null)}
              title={av.name}
              style={{
                position: 'relative', padding: 0, border: 'none', background: 'none',
                cursor: 'pointer', flexShrink: 0,
                width: 38, height: 38,
                outline: 'none',
              }}
            >
              {/* Glow ring */}
              <div style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                background: isSel
                  ? 'linear-gradient(135deg,#6366f1,#06b6d4)'
                  : isHov ? 'rgba(99,102,241,0.5)' : 'transparent',
                transition: 'all 0.22s ease',
                boxShadow: isSel ? '0 0 14px rgba(99,102,241,0.6), 0 0 28px rgba(6,182,212,0.3)' : 'none',
                padding: isSel ? 2 : isHov ? 1.5 : 0,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'rgba(10,13,34,0.9)',
                  transform: isSel ? 'scale(0.94)' : isHov ? 'scale(0.97)' : 'scale(1)',
                  transition: 'transform 0.22s ease',
                }}>
                  <img src={av.src} alt={av.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
              </div>

              {/* Selected checkmark overlay */}
              {isSel && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <Check style={{ width: 14, height: 14, color: '#fff', strokeWidth: 3 }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AvatarSelector;
