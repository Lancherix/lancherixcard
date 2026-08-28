import React from 'react';
import { ICON_REGISTRY } from '../icons/registry';

export default function BootstrapIcon({ name, size = 18, color = 'currentColor', className = '', ...rest }) {
  const iconId = ICON_REGISTRY[name] || 'folder-fill';

  return (
    <svg width={size} height={size} fill={color} className={className} {...rest}>
      <use href={`/icons/bootstrap-icons.svg#${iconId}`} />
    </svg>
  );
}