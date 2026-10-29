import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post } from '../api';
import { cur, now } from '../utils';
import BackBar from '../components/BackBar';

export default function PaymentIn() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [date, setDate] = useState(now());
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadParties = async () => {
    try {
      const ps = await api('parties');
      setParties(ps || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const selectedParty = parties.find((p) => p._id === partyId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyId) {
      toast(t('pick'));
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast('Enter valid payment amount');
      return;
    }

    setSaving(true);
    try {
      await post('payments', {
        date,
        party: partyId,
        amount: numAmount,
        mode,
        notes,
      });

      toast(t('saved'));
      setAmount('');
      setNotes('');
      loadParties();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BackBar />

      <div className="panel-card">
        <div className="panel-title">
          <span>💰</span>
          <span>{t('pay')} &bull; {lang === 'gu' ? 'જમા રકમ નોંધો' : 'Record Inward Payment'}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Date & Time */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-date">{t('dateTime')}</label>
              <div className="input-wrap">
                <span className="input-icon">📅</span>
                <input
                  id="pay-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Party Select */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-party">
                <span>{t('party')} *</span>
                <span className="label-hint">{t('pick')}</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">👥</span>
                <select
                  id="pay-party"
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  required
                >
                  <option value="">-- {t('pick')} --</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Party Pending Balance Alert Badge */}
            {selectedParty && (
              <div className="form-group full">
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                    {t('pend')}:
                  </span>
                  <span style={{
                    fontSize: '17px',
                    fontWeight: '800',
                    color: selectedParty.pending > 0 ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {cur(selectedParty.pending)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="form-group full">
              <label className="form-label" htmlFor="pay-amount">
                <span>{t('amt')} *</span>
                <span className="label-hint">Received Amount (₹)</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">₹</span>
                <input
                  id="pay-amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: '18px', fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-mode">{t('mode')}</label>
              <div className="input-wrap">
                <span className="input-icon">💳</span>
                <select
                  id="pay-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="Cash">{t('cash')}</option>
                  <option value="Bank">{t('bank')}</option>
                  <option value="UPI">{t('upi')}</option>
                  <option value="Cheque">{t('chq')}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-notes">{t('notes')}</label>
              <div className="input-wrap">
                <span className="input-icon">📝</span>
                <input
                  id="pay-notes"
                  type="text"
                  placeholder="Txn ID / Bank name / Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <span>💾</span>
              <span>{saving ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
