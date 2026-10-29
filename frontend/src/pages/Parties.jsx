import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post } from '../api';
import { cur } from '../utils';
import BackBar from '../components/BackBar';

export default function Parties() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
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

  const handleAddParty = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Party name is required');
      return;
    }

    setSaving(true);
    try {
      await post('parties', {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingBalance: Number(openingBalance) || 0,
      });

      toast(t('saved'));
      setName('');
      setPhone('');
      setAddress('');
      setOpeningBalance('0');
      loadParties();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredParties = parties.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  });

  const totalReceivables = parties.reduce((sum, p) => sum + (Number(p.pending) || 0), 0);

  return (
    <div>
      <BackBar />

      {/* Add New Party Panel */}
      <div className="panel-card noprint">
        <div className="panel-title">
          <span>👥</span>
          <span>{t('addp')}</span>
        </div>

        <form onSubmit={handleAddParty}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="party-name">{t('name')} *</label>
              <div className="input-wrap">
                <span className="input-icon">🏢</span>
                <input
                  id="party-name"
                  type="text"
                  placeholder="e.g. Ramesh Bhai / Somnath Infra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="party-phone">{t('phone')}</label>
              <div className="input-wrap">
                <span className="input-icon">📞</span>
                <input
                  id="party-phone"
                  type="tel"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="party-address">{t('addr')}</label>
              <div className="input-wrap">
                <span className="input-icon">📍</span>
                <input
                  id="party-address"
                  type="text"
                  placeholder="Village / City / Location"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="party-open">{t('open')}</label>
              <div className="input-wrap">
                <span className="input-icon">₹</span>
                <input
                  id="party-open"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
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

      {/* Registered Parties Directory */}
      <div className="panel-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div className="panel-title" style={{ margin: 0 }}>
            <span>📋</span>
            <span>{t('allParties')} ({parties.length})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              {t('receivables')}: <b style={{ color: 'var(--danger)', fontSize: '15px' }}>{cur(totalReceivables)}</b>
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="input-wrap noprint" style={{ marginBottom: '16px', maxWidth: '400px' }}>
          <span className="input-icon">🔍</span>
          <input
            type="text"
            placeholder={t('searchParty')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('party')}</th>
                <th>{t('phone')}</th>
                <th>{t('addr')}</th>
                <th className="num">{t('total')}</th>
                <th className="num">{t('paid')}</th>
                <th className="num">{t('pend')}</th>
                <th style={{ textAlign: 'center' }} className="noprint">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.length > 0 ? (
                filteredParties.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <Link to={`/stmt/${p._id}`} style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      {p.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{p.phone}</span>
                          <a href={`tel:${p.phone}`} className="noprint action-icon-btn" title="Call">📞</a>
                          <a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noreferrer" className="noprint action-icon-btn" title="WhatsApp">💬</a>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.address || '-'}</td>
                    <td className="num font-mono">{cur(p.total)}</td>
                    <td className="num font-mono" style={{ color: 'var(--success)' }}>{cur(p.paid)}</td>
                    <td className="num font-mono" style={{ color: p.pending > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>
                      {cur(p.pending)}
                    </td>
                    <td style={{ textAlign: 'center' }} className="noprint">
                      <Link to={`/stmt/${p._id}`} className="btn-action-view">
                        📊 {t('ledger')}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {t('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
