// src/components/SearchResult/FilterSidebar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import closeIcon from '../../../assets/Icons/closeImage.png';
import arrowIcon from '../../../assets/Icons/arrowIcon.png';
import { useTranslation } from 'react-i18next';
import './FilterSidebar.scss';

const toNumberOrEmpty = (s) => {
  if (s === '' || s == null) return '';
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : '';
};

const isTypingNumber = (s) => /^(\d+(\.\d*)?|\.\d*)?$/.test(s);

const floorTo = (n, step) => Math.floor(n / step) * step;
const ceilTo = (n, step) => Math.ceil(n / step) * step;

export default function FilterSidebar({
  open,
  onClose,
  onChange,
  allBrands = [],
  allOrigins = [],
  brandMetaMap = {},
  availablePriceRanges = ['under5', 'r5_20', 'r20_50', 'over50'],
  allPrices = [],
  value = { priceMin: '', priceMax: '', priceRanges: [], brands: [], origins: [] }
}) {
  const MAX_VISIBLE_CHIPS = 6;
  const { t } = useTranslation(['storefront', 'common']);

  const [priceMinInput, setPriceMinInput] = useState(
    value.priceMin === '' || value.priceMin == null ? '' : String(value.priceMin)
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    value.priceMax === '' || value.priceMax == null ? '' : String(value.priceMax)
  );

  const [brands, setBrands] = useState(new Set(value.brands ?? []));
  const [origins, setOrigins] = useState(new Set(value.origins ?? []));
  const [priceRanges, setPriceRanges] = useState(new Set(value.priceRanges ?? []));
  const [showAllOrigins, setShowAllOrigins] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const isEditingPriceRef = useRef(false);
  const priceMinRef = useRef(priceMinInput);
  const priceMaxRef = useRef(priceMaxInput);

  useEffect(() => { priceMinRef.current = priceMinInput; }, [priceMinInput]);
  useEffect(() => { priceMaxRef.current = priceMaxInput; }, [priceMaxInput]);

  const { sliderMin, sliderMax } = useMemo(() => {
    const prices = (allPrices || []).map(Number).filter((n) => Number.isFinite(n) && n >= 0);
    const rawMin = prices.length ? Math.min(...prices) : 0;
    const rawMax = prices.length ? Math.max(...prices) : 100;

    const step = 0.5;
    const niceMin = floorTo(rawMin, step);
    const niceMax = ceilTo(rawMax, step);
    return { sliderMin: niceMin, sliderMax: niceMax };
  }, [allPrices]);

  const brandKey = (s = '') =>
    String(s)
      .normalize('NFKC')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
      

  const computeFinalPriceRange = (minStr, maxStr) => {
    const minTyped = toNumberOrEmpty(minStr);
    const maxTyped = toNumberOrEmpty(maxStr);

    const minVal = minTyped === '' ? '' : Math.max(sliderMin, Math.min(minTyped, sliderMax));
    const maxVal = maxTyped === '' ? '' : Math.max(sliderMin, Math.min(maxTyped, sliderMax));

    const lo = minVal === '' ? sliderMin : minVal;
    const hi = maxVal === '' ? sliderMax : maxVal;

    const finalMin = minVal === '' ? '' : Math.min(lo, hi);
    const finalMax = maxVal === '' ? '' : Math.max(lo, hi);

    return { finalMin, finalMax };
  };

  const emitNow = (override = {}) => {
    const { finalMin, finalMax } = computeFinalPriceRange(priceMinRef.current, priceMaxRef.current);
    onChange?.({
      priceMin: finalMin === '' ? '' : Number(finalMin),
      priceMax: finalMax === '' ? '' : Number(finalMax),
      priceRanges: [...priceRanges],
      brands: [...brands],
      origins: [...origins],
      ...override,
    });
  };

  const debounceRef = useRef(null);
  const emitDebounced = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => emitNow(), 150);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (isEditingPriceRef.current) return;

    setPriceMinInput(value.priceMin === '' || value.priceMin == null ? '' : String(value.priceMin));
    setPriceMaxInput(value.priceMax === '' || value.priceMax == null ? '' : String(value.priceMax));
    setBrands(new Set(value.brands ?? []));
    setOrigins(new Set(value.origins ?? []));
    setPriceRanges(new Set(value.priceRanges ?? []));
    setShowAllOrigins(false);
    setShowAllBrands(false);
  }, [open, value.priceMin, value.priceMax, value.brands, value.origins, (value.priceRanges || []).join(',')]);

  const sortedBrands = useMemo(
    () => [...new Set(allBrands)].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))),
    [allBrands]
  );
  const sortedOrigins = useMemo(
    () => [...new Set(allOrigins)].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))),
    [allOrigins]
  );

  const orderedOrigins = useMemo(() => {
    const selected = [];
    const rest = [];
    for (const o of sortedOrigins) (origins.has(o) ? selected : rest).push(o);
    return [...selected, ...rest];
  }, [sortedOrigins, origins]);

  const visibleOrigins = useMemo(() => {
    if (showAllOrigins) return orderedOrigins;
    const selectedCount = orderedOrigins.filter((o) => origins.has(o)).length;
    const take = Math.max(MAX_VISIBLE_CHIPS, selectedCount);
    return orderedOrigins.slice(0, take);
  }, [orderedOrigins, showAllOrigins, origins]);

  const orderedBrands = useMemo(() => {
    const selected = [];
    const rest = [];
    for (const b of sortedBrands) (brands.has(b) ? selected : rest).push(b);
    return [...selected, ...rest];
  }, [sortedBrands, brands]);

  const visibleBrands = useMemo(() => {
    if (showAllBrands) return orderedBrands;
    const selectedCount = orderedBrands.filter((b) => brands.has(b)).length;
    const take = Math.max(MAX_VISIBLE_CHIPS, selectedCount);
    return orderedBrands.slice(0, take);
  }, [orderedBrands, showAllBrands, brands]);

  const PRICE_PRESETS = useMemo(
    () => [
      { key: 'under5', label: t('priceUnder5') },
      { key: 'r5_20', label: t('price5to20') },
      { key: 'r20_50', label: t('price20to50') },
      { key: 'over50', label: t('priceOver50') },
    ],
    [t]
  );

  const togglePriceRange = (key) => {
    const next = new Set(priceRanges);
    next.has(key) ? next.delete(key) : next.add(key);
    setPriceRanges(next);

    setPriceMinInput('');
    setPriceMaxInput('');
    priceMinRef.current = '';
    priceMaxRef.current = '';

    onChange?.({
      priceMin: '',
      priceMax: '',
      priceRanges: [...next],
      brands: [...brands],
      origins: [...origins],
    });
  };

  return (
    <aside className={`filter-sidebar ${open ? 'open' : 'closed'}`} aria-hidden={!open}>
      <div className="fs-header">
        <div className="fs-header-title">{t('Filters') || 'Filters'}</div>
        <button type="button" className="fs-close" onClick={onClose} aria-label={t('common:close') || 'Close'}>
          <img src={closeIcon} alt="" />
        </button>
      </div>

      <div className="fs-body">
        <section className="fs-section">
          <div className="fs-title">{t('Price Range') || 'Price Range'}</div>

          <div className="fs-price-presets" role="group" aria-label={t('Price presets') || 'Price presets'}>
            {PRICE_PRESETS
              .filter((p) => availablePriceRanges.includes(p.key))
              .sort((a, b) => (priceRanges.has(a.key) ? 0 : 1) - (priceRanges.has(b.key) ? 0 : 1))
              .map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`fs-chip fs-price-preset ${priceRanges.has(p.key) ? 'active' : ''}`}
                  onClick={() => togglePriceRange(p.key)}
                >
                  {p.label}
                </button>
              ))}
          </div>

          <div className="fs-price-row">
            <label className="fs-price-input">
              <span>{t('Minimum') || 'Minimum'}</span>
              <input
                inputMode="decimal"
                value={priceMinInput}
                onFocus={() => { isEditingPriceRef.current = true; }}
                onBlur={() => {
                  isEditingPriceRef.current = false;
                  const n = toNumberOrEmpty(priceMinRef.current);
                  if (n !== '') {
                    const clamped = Math.max(sliderMin, Math.min(n, sliderMax));
                    const s = String(clamped);
                    setPriceMinInput(s);
                    priceMinRef.current = s;
                  }
                  emitNow();
                }}
                onChange={(e) => {
                  if (priceRanges.size) {
                    setPriceRanges(new Set());
                    onChange?.({
                      priceMin: '',
                      priceMax: '',
                      priceRanges: [],
                      brands: [...brands],
                      origins: [...origins],
                    });
                  }
                  const v = e.target.value;
                  if (!isTypingNumber(v)) return;
                  setPriceMinInput(v);
                  priceMinRef.current = v;
                  emitDebounced();
                }}
                placeholder="0"
              />
            </label>

            <div className="fs-price-sep">–</div>

            <label className="fs-price-input">
              <span>{t('Maximum') || 'Maximum'}</span>
              <input
                inputMode="decimal"
                value={priceMaxInput}
                onFocus={() => { isEditingPriceRef.current = true; }}
                onBlur={() => {
                  isEditingPriceRef.current = false;
                  const n = toNumberOrEmpty(priceMaxRef.current);
                  if (n !== '') {
                    const clamped = Math.max(sliderMin, Math.min(n, sliderMax));
                    const s = String(clamped);
                    setPriceMaxInput(s);
                    priceMaxRef.current = s;
                  }
                  emitNow();
                }}
                onChange={(e) => {
                  if (priceRanges.size) {
                    setPriceRanges(new Set());
                    onChange?.({
                      priceMin: '',
                      priceMax: '',
                      priceRanges: [],
                      brands: [...brands],
                      origins: [...origins],
                    });
                  }
                  const v = e.target.value;
                  if (!isTypingNumber(v)) return;
                  setPriceMaxInput(v);
                  priceMaxRef.current = v;
                  emitDebounced();
                }}
                placeholder="∞"
              />
            </label>
          </div>
        </section>

        <section className="fs-section">
          <div className="fs-title">{t('Product Origin') || 'Product Origin'}</div>

          <div className="fs-chip-grid">
            {visibleOrigins.map((o) => (
              <button
                key={o}
                className={`fs-chip ${origins.has(o) ? 'active' : ''}`}
                onClick={() => {
                  const next = new Set(origins);
                  next.has(o) ? next.delete(o) : next.add(o);
                  setOrigins(next);

                  const { finalMin, finalMax } = computeFinalPriceRange(priceMinRef.current, priceMaxRef.current);
                  onChange?.({
                    priceMin: finalMin === '' ? '' : Number(finalMin),
                    priceMax: finalMax === '' ? '' : Number(finalMax),
                    priceRanges: [...priceRanges],
                    brands: [...brands],
                    origins: [...next],
                  });
                }}
              >
                {o}
              </button>
            ))}
          </div>

          {sortedOrigins.length > MAX_VISIBLE_CHIPS && (
            <button type="button" className="fs-view-all" onClick={() => setShowAllOrigins((v) => !v)}>
              <span className="fs-view-all-text">
                {showAllOrigins ? t('show less') || 'show less' : t('view all') || 'view all'}
              </span>
              <img className={`fs-view-all-arrow ${showAllOrigins ? 'open' : ''}`} src={arrowIcon} alt="" />
            </button>
          )}
        </section>

        <section className="fs-section">
          <div className="fs-title">{t('Brand') || 'Brand'}</div>

          <div className="fs-chip-grid">
            {visibleBrands.map((b) => {
              const kb = brandKey(b);
              const meta =
                brandMetaMap?.[kb] ??
                brandMetaMap?.[kb.replace(/\s+/g, '')] ??
                brandMetaMap?.[b];
              const imgSrc = meta?.imageUrl;
              const isDarkMode = document.documentElement.classList.contains('dark-mode');
              const shouldInvert = isDarkMode && Boolean(meta?.invert);
              return (
                <button
                  key={b}
                  className={`fs-chip fs-chip--brand ${brands.has(b) ? 'active' : ''}`}
                  onClick={() => {
                    const next = new Set(brands);
                    next.has(b) ? next.delete(b) : next.add(b);
                    setBrands(next);

                    const { finalMin, finalMax } = computeFinalPriceRange(priceMinRef.current, priceMaxRef.current);
                    onChange?.({
                      priceMin: finalMin === '' ? '' : Number(finalMin),
                      priceMax: finalMax === '' ? '' : Number(finalMax),
                      priceRanges: [...priceRanges],
                      brands: [...next],
                      origins: [...origins],
                    });
                  }}
                >
                  <span className="fs-brand-left">
                  {imgSrc ? (
                    <img
                      className={`fs-brand-img ${shouldInvert ? 'invert' : ''}`}
                      src={imgSrc}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="fs-brand-img fs-brand-img--placeholder" aria-hidden="true" />
                  )}
                  </span>

                  <span className="fs-brand-text">{b}</span>
                </button>
              );
            })}
          </div>

          {sortedBrands.length > MAX_VISIBLE_CHIPS && (
            <button type="button" className="fs-view-all" onClick={() => setShowAllBrands((v) => !v)}>
              <span className="fs-view-all-text">
                {showAllBrands ? t('show less') || 'show less' : t('view all') || 'view all'}
              </span>
              <img className={`fs-view-all-arrow ${showAllBrands ? 'open' : ''}`} src={arrowIcon} alt="" />
            </button>
          )}
        </section>
      </div>
    </aside>
  );
}
