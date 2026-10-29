import React from 'react';
import { B, useI18n } from '../i18n';

export default function PrintHead() {
  const { lang } = useI18n();

  return (
    <div className="print-letterhead bhead">
      <h1>{lang === 'gu' ? B.nameGu : B.name}</h1>
      <p><b>{lang === 'gu' ? B.taglineGu : B.tagline}</b></p>
      <p>{B.addr} | Mo: {B.tel}</p>
    </div>
  );
}
