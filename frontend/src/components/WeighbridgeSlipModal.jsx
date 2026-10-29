import React from 'react';
import { B, useI18n } from '../i18n';
import { n, cur, dt, generateWhatsAppSlip } from '../utils';

export default function WeighbridgeSlipModal({ load, onClose }) {
  const { lang, t } = useI18n();

  if (!load) return null;

  const partyName = typeof load.party === 'object' ? (load.party?.name || '-') : (load.party || '-');
  const ticketId = (load._id || '').slice(-6).toUpperCase() || '000000';

  const handleWhatsApp = () => {
    const text = generateWhatsAppSlip(load, lang);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="slip-modal-backdrop" onClick={onClose}>
      <div className="slip-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Printable Official Slip Content */}
        <div className="slip-card">
          <div className="slip-header">
            <h1 className="slip-brand">{lang === 'gu' ? B.nameGu : B.name}</h1>
            <p className="slip-tagline">{lang === 'gu' ? B.taglineGu : B.tagline}</p>
            <p className="slip-meta">{B.addr} | Mo: <b>{B.tel}</b></p>
            <div className="slip-title-badge">
              <span>{t('slip')}</span>
            </div>
          </div>

          <div className="slip-meta-grid">
            <div className="slip-meta-item">
              <span className="sm-label">{t('ticket')}:</span>
              <span className="sm-val font-mono">#SM-{ticketId}</span>
            </div>
            <div className="slip-meta-item" style={{ textAlign: 'right' }}>
              <span className="sm-label">{t('dateTime')}:</span>
              <span className="sm-val">{dt(load.date)}</span>
            </div>
            <div className="slip-meta-item">
              <span className="sm-label">{t('veh')}:</span>
              <span className="sm-val badge-plate">{load.vehicleNo}</span>
            </div>
            <div className="slip-meta-item" style={{ textAlign: 'right' }}>
              <span className="sm-label">{t('party')}:</span>
              <span className="sm-val"><b>{partyName}</b></span>
            </div>
            <div className="slip-meta-item">
              <span className="sm-label">{t('sand')}:</span>
              <span className="sm-val">{load.sandType || 'Sand'}</span>
            </div>
            <div className="slip-meta-item" style={{ textAlign: 'right' }}>
              <span className="sm-label">{t('pass')}:</span>
              <span className="sm-val">{load.royaltyPassNo || '-'}</span>
            </div>
            {load.district && (
              <div className="slip-meta-item" style={{ gridColumn: '1 / -1' }}>
                <span className="sm-label">{t('dist')}:</span>
                <span className="sm-val">{load.district}</span>
              </div>
            )}
          </div>

          {/* Weights & Calculation Table */}
          <table className="slip-table">
            <tbody>
              <tr>
                <td>{t('gross')} ({t('full')})</td>
                <td className="num font-mono"><b>{n(load.loadedKg)} kg</b></td>
              </tr>
              <tr>
                <td>{t('tare')} ({t('empty')})</td>
                <td className="num font-mono"><b>{n(load.emptyKg)} kg</b></td>
              </tr>
              <tr className="slip-highlight">
                <td><b>{t('net')}</b></td>
                <td className="num font-mono" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                  <b>{n(load.netTon)} Ton</b>
                </td>
              </tr>
              {Number(load.royaltyTon || 0) > 0 && (
                <tr>
                  <td>{t('rton')}</td>
                  <td className="num font-mono">{n(load.royaltyTon)} Ton</td>
                </tr>
              )}
              <tr>
                <td>{t('rate')}</td>
                <td className="num font-mono">{cur(load.rate)}</td>
              </tr>
              <tr className="slip-total-row">
                <td><b>{t('total')} {t('amt')}</b></td>
                <td className="num font-mono" style={{ fontSize: '19px', color: 'var(--success)' }}>
                  <b>{cur(load.amount)}</b>
                </td>
              </tr>
              {Number(load.cash || 0) > 0 && (
                <tr style={{ background: 'var(--success-light)' }}>
                  <td style={{ color: 'var(--success-text)' }}>{t('cashnow')}</td>
                  <td className="num font-mono" style={{ color: 'var(--success)' }}>
                    <b>{cur(load.cash)}</b>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {load.notes && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <b>{t('notes')}:</b> {load.notes}
            </div>
          )}

          {/* Official Signatures */}
          <div className="slip-signatures">
            <div className="slip-sign-box">
              <div className="sign-line" />
              <span>{t('operatorSign')}</span>
            </div>
            <div className="slip-sign-box">
              <div className="sign-line" />
              <span>{t('driverSign')}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Screen Only) */}
        <div className="slip-actions noprint">
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <span>🖨️</span>
            <span>{t('print')}</span>
          </button>
          <button type="button" className="btn-wa" onClick={handleWhatsApp}>
            <span>💬</span>
            <span>{t('shareWa')}</span>
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <span>✕</span>
            <span>{t('close')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
