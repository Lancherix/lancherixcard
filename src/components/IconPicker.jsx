import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../context/I18nContext';
import { ICON_KEYS } from '../icons/registry';
import { ICON_TAGS } from '../icons/iconTags';
import BootstrapIcon from './BootstrapIcon';
import './IconPicker.css';

const IconPicker = ({ value, onChange, triggerClassName = '', size = 18 }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 260 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 6, left: rect.left, width: 260 });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const searchIndex = useMemo(() => {
    const index = {};
    for (const key of ICON_KEYS) {
      const tags = ICON_TAGS[key] || [];
      index[key] = `${key} ${tags.join(' ')}`.toLowerCase();
    }
    return index;
  }, []);

  const filteredKeys = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return ICON_KEYS;
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    return ICON_KEYS.filter((key) => {
      const haystack = searchIndex[key];
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query, searchIndex]);

  return (
    <div className="icon-picker">
      <button
        type="button"
        ref={triggerRef}
        className={`icon-picker-trigger ${triggerClassName}`}
        onClick={() => setOpen(o => !o)}
      >
        {value ? (
          <BootstrapIcon name={value} size={size} />
        ) : (
          <span className="icon-picker-plus">+</span>
        )}
      </button>

      {open && createPortal(
        <div
          className="icon-picker-dropdown icon-picker-dropdown-portal"
          ref={dropdownRef}
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <input
            ref={searchRef}
            type="text"
            className="icon-picker-search"
            placeholder={t('iconPicker.searchIconsPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          <div className="icon-picker-grid">
            {filteredKeys.length > 0 ? (
              filteredKeys.map(key => (
                <button
                  type="button"
                  key={key}
                  className={`icon-picker-option ${value === key ? 'selected' : ''}`}
                  onClick={() => { onChange(key); setOpen(false); }}
                  title={key}
                >
                  <BootstrapIcon name={key} size={20} />
                </button>
              ))
            ) : (
              <div className="icon-picker-empty">{t('iconPicker.noIconsFound')}</div>
            )}
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
};

export default IconPicker;