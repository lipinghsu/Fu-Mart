// PriceHistory.jsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import './PriceHistory.scss';

/* ---------- helpers ---------- */
const toISO = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
};
const addMonths = (d, n) => {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + n);
  return dt;
};
const startOfYear = (d) => new Date(new Date(d).getFullYear(), 0, 1);
const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return String(d);
  }
};
const fmtMoney = (v) => {
  const n = Number(v);
  return Number.isNaN(n)
    ? `$${v}`
    : `$${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

/** Daily series filling gaps with previous value, within [start, end] */
const buildDailySeriesBetween = (raw = [], start, end) => {
  if (!raw.length) return [];
  const sorted = [...raw]
    .map((p) => ({ date: toISO(p.date), price: Number(p.price) }))
    .filter((p) => !Number.isNaN(p.price))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const map = new Map(sorted.map((p) => [p.date, p.price]));
  // seed
  let seedPrice = sorted[0].price;
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    if (d <= start) seedPrice = sorted[i].price;
    else break;
  }

  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const out = [];
  let lastKnown = seedPrice;
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const iso = toISO(d);
    if (map.has(iso)) lastKnown = map.get(iso);
    out.push({ date: iso, price: lastKnown });
  }
  return out;
};

const CustomXAxisTick = ({ x, y, payload }) => {
  const label = fmtDate(payload?.value);
  return (
    <g transform={`translate(${x},${y})`} className="ph-x-tick">
      <line x1={0} y1={-8} x2={0} y2={0} stroke="var(--ph-axis)" strokeWidth={1} />
      <text dy={18} textAnchor="middle" fill="currentColor" className="ph-x-text" fontSize="0.9rem">
        {label}
      </text>
    </g>
  );
};

const CustomYAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`} className="ph-y-tick">
    <text x={2} y={3} textAnchor="end" fill="currentColor" className="ph-y-text" fontSize="0.9rem">
      {fmtMoney(payload?.value)}
    </text>
  </g>
);

const RANGES = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'];
const filterByRange = (raw, rangeKey) => {
  if (!raw.length) return [];
  const lastDate = new Date(toISO(raw[raw.length - 1].date));
  let start;
  switch (rangeKey) {
    case '1M': start = addMonths(lastDate, -1); break;
    case '3M': start = addMonths(lastDate, -3); break;
    case '6M': start = addMonths(lastDate, -6); break;
    case 'YTD': start = startOfYear(lastDate); break;
    case '1Y': start = addMonths(lastDate, -12); break;
    case 'ALL':
    default:   start = new Date(toISO(raw[0].date));
  }
  const end = lastDate;
  return buildDailySeriesBetween(raw, start, end);
};
const humanRangeLabel = (t, key) => ({
  '1M': t('charts:rangeLabel.pastMonth'),
  '3M': t('charts:rangeLabel.past3Months'),
  '6M': t('charts:rangeLabel.past6Months'),
  'YTD': t('charts:rangeLabel.ytd'),
  '1Y': t('charts:rangeLabel.pastYear'),
  'ALL': t('charts:rangeLabel.allTime'),
}[key] || '');

const isDateInRaw = (raw, iso) => raw.some((p) => toISO(p.date) === iso);

const PriceHistory = ({
  data = [],
  productName = '',
  isAdmin = false,
  // NOTE: now pass the full record object {date, price, ...} to parent
  onEditPoint, // (record) => Promise<void>|void
  onAddPoint,  // (record) => Promise<void>|void
}) => {
  const { t } = useTranslation(['charts']);
  if (!data.length) return null;

  const [range, setRange] = useState('1M');
  const series = useMemo(() => filterByRange(data, range), [data, range]);

  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(series.length / 8));
    return series.filter((_, i) => i % step === 0).map((d) => d.date);
  }, [series]);

  const first = series[0]?.price ?? 0;
  const last = series[series.length - 1]?.price ?? 0;
  const delta = last - first;
  const pct = first ? (delta / first) * 100 : 0;
  const isUp = delta >= 0;
  const color = isUp ? '#16c784' : '#ea3943';

  const [hovered, setHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const [editor, setEditor] = useState(null);
  // { mode: 'edit'|'add', dateISO, price, info, saving, error }

  const openEditForPoint = useCallback((dateISO, price) => {
    setEditor({
      mode: 'edit',
      dateISO,
      price: String(Number(price).toFixed(2)),
      info: isDateInRaw(data, dateISO)
        ? ''
        : t('charts:admin.willCreateRawOnFilled', 'This day had no raw record; saving will create one.'),
    });
  }, [data, t]);

  const openAddDialog = useCallback(() => {
    const todayISO = toISO(new Date());
    setEditor({
      mode: 'add',
      dateISO: todayISO,
      price: String(Number(series?.[series.length - 1]?.price ?? 0).toFixed(2)),
      info: '',
    });
  }, [series]);

  // ---- CLICKABLE DOTS (reliable click-to-edit) ----
  const ActiveDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={color}
        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isAdmin) return;
          openEditForPoint(payload?.date, payload?.price);
        }}
      />
    );
  };
  const Dot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={color}
        opacity={0.7}
        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isAdmin) return;
          openEditForPoint(payload?.date, payload?.price);
        }}
      />
    );
  };

  const closeEditor = useCallback(() => setEditor(null), []);

  const submitEditor = useCallback(async () => {
    if (!editor) return;
    const dateISO = toISO(editor.dateISO);
    const price = Number(editor.price);
    if (Number.isNaN(price)) {
      setEditor((s) => ({ ...s, error: t('charts:admin.invalidPrice', 'Please enter a valid number.') }));
      return;
    }
    setEditor((s) => ({ ...s, saving: true, error: '' }));
    try {
      const record = {
        date: dateISO,
        price,
        // other fields are filled in parent (currency, quantity, soldBy, soldTo, time)
      };
      if (editor.mode === 'edit') {
        await onEditPoint?.(record);
      } else {
        await onAddPoint?.(record);
      }
      setEditor(null);
    } catch (err) {
      setEditor((s) => ({
        ...s,
        saving: false,
        error: err?.message || t('charts:admin.saveFailed', 'Save failed. Please try again.'),
      }));
    }
  }, [editor, onEditPoint, onAddPoint, t]);

  const { nForTitle, unitForTitle } = useMemo(() => {
    switch (range) {
      case '1M':  return { nForTitle: 30,  unitForTitle: t('charts:unit.days') };
      case '3M':  return { nForTitle: 90,  unitForTitle: t('charts:unit.days') };
      case '6M':  return { nForTitle: 180, unitForTitle: t('charts:unit.days') };
      case '1Y':  return { nForTitle: 365, unitForTitle: t('charts:unit.days') };
      case 'YTD': return { nForTitle: t('charts:ytdShort'), unitForTitle: '' };
      case 'ALL': return { nForTitle: t('charts:allShort'), unitForTitle: '' };
      default:    return { nForTitle: 30,  unitForTitle: t('charts:unit.days') };
    }
  }, [range, t]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="price-tooltip">
        <div className="price-tooltip__price">{fmtMoney(payload[0].value)}</div>
        <div className="price-tooltip__date">{fmtDate(label)}</div>
      </div>
    );
  };

  return (
    <div className='ph-section'>
      <div className="price-history__header">
        <h2 className="ph-title">
          {t('charts:priceTitleWithWindow', {
            name: productName,
            n: nForTitle,
            unit: unitForTitle
          })}
        </h2>

        <div className="ph-right">
          <div className="ph-tabs" role="tablist" aria-label={t('charts:range.label')}>
            {RANGES.map((key) => (
              <div
                key={key}
                role="tab"
                aria-selected={range === key}
                className={`ph-tab ${range === key ? 'active' : ''}`}
                onClick={() => setRange(key)}
              >
                <span>{t(`charts:range.${key}`)}</span>
              </div>
            ))}
            {isAdmin && (
            <div className="ph-admin-bar">
              <button className="ph-btn" onClick={openAddDialog}>
                {t('charts:admin.addPoint', 'Add')}
              </button>
            </div>
          )}
          </div>


        </div>
      </div>

      <div className="price-history">
        <div className="price-history__summary">
          <div className="summary-row summary-current">
            <span className="value">{fmtMoney(last)}</span>
            <span className="label">({t('charts:lastSold')})</span>
          </div>

          <div className="summary-row summary-change">
            <span className={`value ${isUp ? 'up' : 'down'}`}>
              {isUp ? '+' : '-'}{fmtMoney(Math.abs(delta))}
            </span>
            <span className={`pct ${isUp ? 'up' : 'down'}`}>
              ({Math.abs(pct).toFixed(2)}%)
            </span>
            <div className="summary-row summary-range">
              <span className="range-label">{humanRangeLabel(t, range)}</span>
            </div>
          </div>
        </div>

        <div className="price-history__chart">
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart
              data={series}
              onMouseMove={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              margin={{ top: 20, right: 12, bottom: 6, left: 12 }}
            >
              <defs>
                <linearGradient id="hoverFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                ticks={xTicks}
                tick={<CustomXAxisTick />}
                axisLine={{ stroke: 'var(--ph-axis)' }}
                tickLine={false}
              />

              <YAxis
                domain={['dataMin', 'dataMax']}
                tick={<CustomYAxisTick />}
                axisLine={{ stroke: 'var(--ph-axis)' }}
                tickLine={false}
                width={60}
                padding={{ top: 12, bottom: 8 }}
                tickMargin={8}
              />

              <Tooltip
                content={<CustomTooltip />}
                isAnimationActive={false}
                position={{ y: 8 }}
                cursor={{ stroke: 'var(--ph-cursor)', strokeWidth: 1 }}
              />

              {hovered && (
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="none"
                  fill="url(#hoverFill)"
                  isAnimationActive={false}
                />
              )}

              <Line
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={3}
                dot={<Dot />}
                activeDot={<ActiveDot />}
                isAnimationActive={!hasAnimated}
                onAnimationEnd={() => setHasAnimated(true)}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isAdmin && editor && (
        <div className="ph-modal" role="dialog" aria-modal="true">
          <div className="ph-modal__card">
            <div className="ph-modal__header">
              <h3 className="ph-modal__title">
                {editor.mode === 'edit' ? t('charts:admin.editPointTitle','Edit Data Point') : t('charts:admin.addPointTitle','Add Data Point')}
              </h3>
              <button className="ph-icon-btn" onClick={closeEditor} aria-label={t('charts:admin.close','Close')}>✕</button>
            </div>

            {editor.info ? <div className="ph-modal__info">{editor.info}</div> : null}

            <div className="ph-modal__body">
              <label className="ph-field">
                <span>{t('charts:admin.dateLabel','Date')}</span>
                <input
                  type="date"
                  value={editor.dateISO}
                  onChange={(e) => setEditor((s) => ({ ...s, dateISO: e.target.value }))}
                />
              </label>

              <label className="ph-field">
                <span>{t('charts:admin.priceLabel','Price')}</span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editor.price}
                  onChange={(e) => setEditor((s) => ({ ...s, price: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitEditor();
                    if (e.key === 'Escape') closeEditor();
                  }}
                />
              </label>

              {editor.error ? <div className="ph-modal__error">{editor.error}</div> : null}
            </div>

            <div className="ph-modal__footer">
              <button className="ph-btn ghost" onClick={closeEditor} disabled={editor.saving}>{t('charts:admin.cancel','Cancel')}</button>
              <button className="ph-btn primary" onClick={submitEditor} disabled={editor.saving}>
                {editor.mode === 'edit' ? t('charts:admin.save','Save') : t('charts:admin.add','Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistory;
