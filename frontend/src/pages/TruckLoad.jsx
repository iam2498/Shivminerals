import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, post } from '../api';
import { n, cur, dt, now } from '../utils';
import BackBar from '../components/BackBar';
import WeighbridgeSlipModal from '../components/WeighbridgeSlipModal';

export default function TruckLoad() {
  const { lang, t } = useI18n();
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [recentLoads, setRecentLoads] = useState([]);
  const [selectedSlipLoad, setSelectedSlipLoad] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [date, setDate] = useState(now());
  const [vehicleNo, setVehicleNo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [sandType, setSandType] = useState('Sand / રેતી');
  const [royaltyPassNo, setRoyaltyPassNo] = useState('');
  const [emptyKg, setEmptyKg] = useState('');
  const [loadedKg, setLoadedKg] = useState('');
  const [royaltyTon, setRoyaltyTon] = useState('');
  const [rate, setRate] = useState('');
  const [cash, setCash] = useState('');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');

  // Load parties and recent loads
  const loadData = async () => {
    try {
      const [ps, rls] = await Promise.all([
        api('parties').catch(() => []),
        api('loads?limit=8').catch(() => []),
      ]);
      setParties(ps || []);
      setRecentLoads(rls || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live Calculations
  const eVal = Number(emptyKg) || 0;
  const fVal = Number(loadedKg) || 0;
  const rVal = Number(rate) || 0;
  const netTon = Math.max(0, (fVal - eVal) / 1000);
  const totalAmount = Math.round(netTon * rVal * 100) / 100;

  const selectedParty = parties.find((p) => p._id === partyId);

  // Handle party change to auto-fill rate
  const handlePartyChange = (selectedId) => {
    setPartyId(selectedId);
    const p = parties.find((item) => item._id === selectedId);
    if (p && p.lastRate && !rate) {
      setRate(String(p.lastRate));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyId) {
      toast(t('pick'));
      return;
    }
    if (!vehicleNo.trim()) {
      toast('Please enter vehicle number');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        party: partyId,
        sandType,
        royaltyPassNo,
        emptyKg: eVal,
        loadedKg: fVal,
        netTon,
        royaltyTon: Number(royaltyTon) || 0,
        rate: rVal,
        amount: totalAmount,
        cash: Number(cash) || 0,
        district,
        notes,
      };

      const savedLoad = await post('loads', payload);
      toast(t('saved'));

      // Reset form fields
      setVehicleNo('');
      setLoadedKg('');
      setRoyaltyPassNo('');
      setCash('');
      setNotes('');

      // Open slip modal for immediate print or WhatsApp share
      setSelectedSlipLoad(savedLoad);

      // Refresh recent loads
      loadData();
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
          <span>🚚</span>
          <span>{t('load')} &bull; New Weighment Entry</span>
        </div>

        {/* Live Digital Scale Indicator */}
        <div className="digital-scale-box">
          <div className="scale-readout-grid">
            <div className="scale-col">
              <span className="scale-label">{t('tare')} (Empty)</span>
              <span className="scale-val">{n(eVal)} <span className="scale-unit">kg</span></span>
            </div>
            <div className="scale-col">
              <span className="scale-label">{t('gross')} (Loaded)</span>
              <span className="scale-val">{n(fVal)} <span className="scale-unit">kg</span></span>
            </div>
            <div className="scale-col highlight">
              <span className="scale-label">{t('net')}</span>
              <span className="scale-val" style={{ color: '#38bdf8' }}>{n(netTon)} <span className="scale-unit">Ton</span></span>
            </div>
            <div className="scale-col highlight">
              <span className="scale-label">{t('amt')}</span>
              <span className="scale-val gold">{cur(totalAmount)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Date & Time */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-date">{t('dateTime')}</label>
              <div className="input-wrap">
                <span className="input-icon">📅</span>
                <input
                  id="load-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-veh">
                <span>{t('veh')}</span>
                <span className="label-hint">UPPERCASE</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">🚛</span>
                <input
                  id="load-veh"
                  className="plate-input"
                  type="text"
                  placeholder={t('vehPlaceholder')}
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            {/* Party Select */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-party">
                <span>{t('party')}</span>
                {selectedParty && selectedParty.pending > 0 && (
                  <span className="label-hint" style={{ color: 'var(--danger)', fontWeight: '700' }}>
                    {t('pend')}: {cur(selectedParty.pending)}
                  </span>
                )}
              </label>
              <div className="input-wrap">
                <span className="input-icon">👥</span>
                <select
                  id="load-party"
                  value={partyId}
                  onChange={(e) => handlePartyChange(e.target.value)}
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

            {/* Sand / Material Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-sand">{t('sand')}</label>
              <div className="input-wrap">
                <span className="input-icon">📦</span>
                <input
                  id="load-sand"
                  type="text"
                  value={sandType}
                  onChange={(e) => setSandType(e.target.value)}
                />
              </div>
            </div>

            {/* Empty Weight */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-empty">
                <span>{t('empty')}</span>
                <span className="label-hint">Tare kg</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">⚖️</span>
                <input
                  id="load-empty"
                  type="number"
                  step="any"
                  placeholder="0"
                  inputMode="decimal"
                  value={emptyKg}
                  onChange={(e) => setEmptyKg(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Loaded Weight */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-full">
                <span>{t('full')}</span>
                <span className="label-hint">Gross kg</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">⚖️</span>
                <input
                  id="load-full"
                  type="number"
                  step="any"
                  placeholder="0"
                  inputMode="decimal"
                  value={loadedKg}
                  onChange={(e) => setLoadedKg(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Rate per Ton */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-rate">
                <span>{t('rate')}</span>
                <span className="label-hint">₹ / Ton</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">₹</span>
                <input
                  id="load-rate"
                  type="number"
                  step="any"
                  placeholder="0"
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Royalty Ton */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-rton">{t('rton')}</label>
              <div className="input-wrap">
                <span className="input-icon">📋</span>
                <input
                  id="load-rton"
                  type="number"
                  step="any"
                  placeholder="0"
                  inputMode="decimal"
                  value={royaltyTon}
                  onChange={(e) => setRoyaltyTon(e.target.value)}
                />
              </div>
            </div>

            {/* Royalty Pass No */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-pass">{t('pass')}</label>
              <div className="input-wrap">
                <span className="input-icon">🎫</span>
                <input
                  id="load-pass"
                  type="text"
                  placeholder="Pass Number"
                  value={royaltyPassNo}
                  onChange={(e) => setRoyaltyPassNo(e.target.value)}
                />
              </div>
            </div>

            {/* Spot Cash Received */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-cash">
                <span>{t('cashnow')}</span>
                <span className="label-hint">Driver / spot cash</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon">💵</span>
                <input
                  id="load-cash"
                  type="number"
                  step="any"
                  placeholder="0"
                  inputMode="decimal"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />
              </div>
            </div>

            {/* District / Destination */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-dist">{t('dist')}</label>
              <div className="input-wrap">
                <span className="input-icon">📍</span>
                <input
                  id="load-dist"
                  type="text"
                  placeholder="City / Site"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="load-notes">{t('notes')}</label>
              <div className="input-wrap">
                <span className="input-icon">📝</span>
                <input
                  id="load-notes"
                  type="text"
                  placeholder="Additional remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <span>💾</span>
              <span>{saving ? t('saving') : t('save')}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => toast('Scale values updated')}
            >
              <span>🔄</span>
              <span>Refresh Scale</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Loads List Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 className="section-title" style={{ margin: 0 }}>📋 {t('recent')}</h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('dateTime')}</th>
                <th>{t('veh')}</th>
                <th>{t('party')}</th>
                <th className="num">{t('empty')}</th>
                <th className="num">{t('full')}</th>
                <th className="num">{t('net')}</th>
                <th className="num">{t('rate')}</th>
                <th className="num">{t('amt')}</th>
                <th className="num">{t('cash')}</th>
                <th style={{ textAlign: 'center' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {recentLoads.length > 0 ? (
                recentLoads.map((l) => (
                  <tr key={l._id}>
                    <td>{dt(l.date)}</td>
                    <td><span className="badge-plate">{l.vehicleNo}</span></td>
                    <td><b>{typeof l.party === 'object' ? l.party?.name : (l.party || '-')}</b></td>
                    <td className="num font-mono">{n(l.emptyKg)} kg</td>
                    <td className="num font-mono">{n(l.loadedKg)} kg</td>
                    <td className="num font-mono">{n(l.netTon)} t</td>
                    <td className="num font-mono">{cur(l.rate)}</td>
                    <td className="num font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                      {cur(l.amount)}
                    </td>
                    <td className="num font-mono" style={{ color: 'var(--success)' }}>
                      {l.cash ? cur(l.cash) : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ctrl-btn"
                        style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                        onClick={() => setSelectedSlipLoad(l)}
                      >
                        🖨️ {t('slip')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {t('none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weighbridge Slip Modal */}
      {selectedSlipLoad && (
        <WeighbridgeSlipModal load={selectedSlipLoad} onClose={() => setSelectedSlipLoad(null)} />
      )}
    </div>
  );
}
