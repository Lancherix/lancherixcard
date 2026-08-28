import React from 'react';
import { ICONS } from '../icons';
import Icon from './Icon';
import BootstrapIcon from './BootstrapIcon';

export default function AnyIcon({ name, size = 18, color = 'currentColor', className, ...rest }) {
  if (ICONS[name]) {
    return <Icon name={name} size={size} color={color} className={className} {...rest} />;
  }
  return <BootstrapIcon name={name} size={size} color={color} className={className} {...rest} />;
}