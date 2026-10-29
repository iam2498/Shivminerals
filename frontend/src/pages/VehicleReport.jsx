import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { api, del } from '../api';
import { n, cur, dateOnly, monthStart, today } from '../utils';
import BackBar from '../components/BackBar';
import PrintHead from '../components/PrintHead';
import DatePresets from '../components/DatePresets';

export default function VehicleReport() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [vehicleList, setVehicleList] = useState([]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const vl = await api('vehicles');
        setVehicleList(vl || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchVehicles();
  }, []);

  const loadReport = async (v = vehicleNo, fr = fromDate, to = toDate) => {
    if (!v.trim()) {
      toast('Enter vehicle number');
      return;
    }
    setLoading(true);
    try {
      const data = await api(`vehicle?vehicle=${encodeURIComponent(v.trim().toUpperCase())}&from=${fr}&to=${to}`);
      setReport(data);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (loadId) => {
    if (!window.confirm(t('del'))) return;
    try {
      await del('loads', loadId);
      toast('Deleted successfully');
      loadReport();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div>
      <BackBar to="/rep" label="← Back to Reports" />

      {/* Filter Card */}
      <div className="panel-card noprint">
        <div className="panel-title">
          <span>🚛</span>
          <span>{t('vehr')}</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="veh-input">{t('veh')} *</label>
            <div className="input-wrap">
              <span className="input-icon">🚛</span>
              <input
                id="veh-input"
                list="veh-list"
                type="text"
                placeholder={t('searchVeh')}
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              />
              <datalist id="veh-list">
                {vehicleList.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="veh-from">{t('from')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="veh-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="veh-to">{t('to')}</label>
            <div className="input-wrap">
              <span className="input-icon">📅</span>
              <input
                id="veh-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DatePresets
          onSelect={(f, to) => {
            setFromDate(f);
            setToDate(to);
            if (vehicleNo.trim()) loadReport(vehicleNo, f, to);
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => loadReport(vehicleNo, fromDate, toDate)}
          >
            <span>🔍</span>
            <span>{t('show')}</span>
          </button>
        </div>
      </div>

      {/* Report Output */}
      {report && (
        <div className="panel-card" style={{ marginTop: '20px' }}>
          <PrintHead />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚛</span>
                <span className="badge-plate" style={{ fontSize: '20px' }}>{report.vehicle}</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {dateOnly(fromDate)} &rarr; {dateOnly(toDate)} &bull; {report.loads?.length || 0} Trips
              </p>
            </div>

            <button
              type="button"
              className="btn-primary noprint"
              onClick={() => window.print()}
            >
              <span>🖨️</span>
              <span>{t('print')}</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('party')}</th>
                  <th>{t('pass')}</th>
                  <th className="num">{t('net')}</th>
                  <th className="num">{t('amt')} (Credit)</th>
                  <th className="num">{t('cashnow')} (Debit)</th>
                  <th className="noprint" style={{ textAlign: 'center' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {report.loads && report.loads.length > 0 ? (
                  report.loads.map((l) => (
                    <tr key={l._id}>
                      <td>{dateOnly(l.date)}</td>
                      <td><b>{l.party?.name || '-'}</b></td>
                      <td style={{ color: 'var(--text-muted)' }}>{l.royaltyPassNo || '-'}</td>
                      <td className="num font-mono">{Number(l.netTon || 0).toFixed(2)} T</td>
                      <td className="num font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                        {cur(l.amount)}
                      </td>
                      <td className="num font-mono" style={{ color: 'var(--success)' }}>
                        {l.cash ? cur(l.cash) : '-'}
                      </td>
                      <td className="noprint" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-del"
                          title={t('del')}
                          onClick={() => handleDelete(l._id)}
                        >
                          ✕
                        </button>
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
              <tfoot>
                <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: '800' }}>
                  <th colSpan="4">{t('total')}</th>
                  <th className="num font-mono" style={{ color: 'var(--primary)', fontSize: '15px' }}>
                    {cur(report.credit)}
                  </th>
                  <th className="num font-mono" style={{ color: 'var(--success)', fontSize: '15px' }}>
                    {cur(report.debit)}
                  </th>
                  <th className="noprint" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
