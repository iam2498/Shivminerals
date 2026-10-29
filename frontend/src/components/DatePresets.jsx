import React from 'react';
import { useI18n } from '../i18n';
import { today, monthStart } from '../utils';

export default function DatePresets({ onSelect }) {
  const { t } = useI18n();

  const handlePreset = (type) => {
    const pad = (num) => String(num).padStart(2, '0');
    const now = new Date();
    let f = today();
    let to = today();

    if (type === 'today') {
      f = today();
      to = today();
    } else if (type === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      f = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
      to = f;
    } else if (type === 'thisMonth') {
      f = monthStart();
      to = today();
    } else if (type === 'lastMonth') {
      const lmFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmLast = new Date(now.getFullYear(), now.getMonth(), 0);
      f = `${lmFirst.getFullYear()}-${pad(lmFirst.getMonth() + 1)}-${pad(lmFirst.getDate())}`;
      to = `${lmLast.getFullYear()}-${pad(lmLast.getMonth() + 1)}-${pad(lmLast.getDate())}`;
    }

    if (onSelect) {
      onSelect(f, to);
    }
  };

  return (
    <div className="date-presets noprint">
      <span className="preset-label">{t('quickDates')}:</span>
      <button type="button" className="preset-btn" onClick={() => handlePreset('today')}>
        {t('today')}
      </button>
      <button type="button" className="preset-btn" onClick={() => handlePreset('yesterday')}>
        {t('yesterday')}
      </button>
      <button type="button" className="preset-btn" onClick={() => handlePreset('thisMonth')}>
        {t('thisMonth')}
      </button>
      <button type="button" className="preset-btn" onClick={() => handlePreset('lastMonth')}>
        {t('lastMonth')}
      </button>
    </div>
  );
}
