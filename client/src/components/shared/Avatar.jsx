import React from 'react';

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

/**
 * Shared Avatar component
 */
export function Avatar({
  avatar,
  name = 'Profile',
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const imageSrc = avatarMap[avatar] || avatar || avatarMap.avatar1;

  return (
    <div
      className={`rounded-full border border-borderColor p-0.5 bg-background-primary overflow-hidden shrink-0 select-none ${sizes[size]} ${className}`}
      {...props}
    >
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-full object-contain rounded-full"
        loading="lazy"
      />
    </div>
  );
}

export default Avatar;
