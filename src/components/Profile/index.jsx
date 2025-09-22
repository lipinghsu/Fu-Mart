import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  query,
  where,
  documentId,
  collection,
} from 'firebase/firestore';
import './Profile.scss';
import AccountFooter from '../AccountFooter';
import Header from '../Header';
import MeihuaDragonIcon from '../../assets/Icons/meihua-dragon-icon2.png';
import storeIconActive from '../../assets/Icons/store-icon-m3.png';
import storeIcon from '../../assets/Icons/store-icon-m2.png';
import likeIcon from '../../assets/Icons/shuang-xi.png';
import likeIconActive from '../../assets/Icons/shuang-xi-2.png';

const PAGE_SIZE = 24;

const TABS = {
  SELLING: 'selling',
  LIKES: 'likes',
};

const Profile = ({ userId, firestore, onOpenProduct }) => {
  const { t } = useTranslation(['profile']); // or useTranslation(['common','profile']) if you split namespaces

  // ————————— state
  const [profile, setProfile] = useState(null);

  // data sets per tab
  const [sellingProducts, setSellingProducts] = useState([]); // product + {sellerPrice, sellerQty}
  const [likedProducts, setLikedProducts] = useState([]);

  const [activeTab, setActiveTab] = useState(TABS.SELLING);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [layout] = useState('grid');
  const [queryText, setQueryText] = useState('');
  const [sort, setSort] = useState('new'); // new | top | price_asc | price_desc

  // ————————— pagination & caches (per tab)
  const sellingMapRef = useRef({});            // productId -> [qty, price]
  const sellingIdsRef = useRef([]);            // all product IDs this seller is offering
  const nextSellingIndexRef = useRef(0);       // next index into sellingIdsRef

  const likesIdsRef = useRef([]);              // all liked product IDs for this user
  const nextLikesIndexRef = useRef(0);         // next index into likesIdsRef

  const sentinelRef = useRef(null);

  // ————————— load profile, selling first page (likes are lazy)
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        // Reset everything on user switch
        setSellingProducts([]);
        setLikedProducts([]);
        setHasMore(true);
        setActiveTab(TABS.SELLING);
        nextSellingIndexRef.current = 0;
        nextLikesIndexRef.current = 0;

        // 1) profile
        const snap = await getDoc(doc(firestore, 'users', userId));
        if (!snap.exists()) {
          if (!cancelled) {
            setProfile(null);
            setLoading(false);
            setHasMore(false);
          }
          return;
        }
        const user = { id: snap.id, ...snap.data() };
        if (cancelled) return;
        setProfile(user);

        // 2) SELLING map -> product id list
        const selling = user.selling && typeof user.selling === 'object' ? user.selling : {};
        const sellingIds = Object.keys(selling);
        sellingMapRef.current = selling;
        sellingIdsRef.current = sellingIds;

        // 3) LIKES ids (array of product IDs; tolerate null/objects)
        const likes = Array.isArray(user.likes)
          ? user.likes
          : (user.likes && typeof user.likes === 'object')
            ? Object.keys(user.likes)
            : [];
        likesIdsRef.current = likes;

        // 4) first page for SELLING
        if (sellingIds.length === 0) {
          setSellingProducts([]);
          setHasMore(false);
        } else {
          const first = await fetchProductsByIds(firestore, sellingIds.slice(0, PAGE_SIZE));
          if (cancelled) return;
          const merged = mergeWithSellerData(first, selling);
          setSellingProducts(merged);
          nextSellingIndexRef.current = Math.min(PAGE_SIZE, sellingIds.length);
          setHasMore(nextSellingIndexRef.current < sellingIds.length);
        }
      } catch (e) {
        console.error('Profile load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [userId, firestore]);

  // ————————— infinite scroll (re-arm when tab/hasMore changes)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [ent] = entries;
        if (ent.isIntersecting) loadMore();
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, activeTab]);

  async function loadMore() {
    if (activeTab === TABS.SELLING) {
      const allIds = sellingIdsRef.current;
      const start = nextSellingIndexRef.current;
      if (start >= allIds.length) {
        setHasMore(false);
        return;
      }
      const end = Math.min(start + PAGE_SIZE, allIds.length);
      const slice = allIds.slice(start, end);

      try {
        const docs = await fetchProductsByIds(firestore, slice);
        const merged = mergeWithSellerData(docs, sellingMapRef.current);
        setSellingProducts((prev) => [...prev, ...merged]);
        nextSellingIndexRef.current = end;
        setHasMore(end < allIds.length);
      } catch (e) {
        console.error('loadMore selling failed', e);
      }
    } else {
      const allIds = likesIdsRef.current;
      const start = nextLikesIndexRef.current;
      if (start >= allIds.length) {
        setHasMore(false);
        return;
      }
      const end = Math.min(start + PAGE_SIZE, allIds.length);
      const slice = allIds.slice(start, end);

      try {
        const docs = await fetchProductsByIds(firestore, slice);
        setLikedProducts((prev) => [...prev, ...docs]);
        nextLikesIndexRef.current = end;
        setHasMore(end < allIds.length);
      } catch (e) {
        console.error('loadMore likes failed', e);
      }
    }
  }

  // ————————— lazy-load first page for LIKES on first switch
  useEffect(() => {
    let cancelled = false;
    async function ensureLikesFirstPage() {
      if (activeTab !== TABS.LIKES) return;
      if (likedProducts.length > 0 || likesIdsRef.current.length === 0) {
        setHasMore(nextLikesIndexRef.current < likesIdsRef.current.length);
        return;
      }
      setLoading(true);
      try {
        const ids = likesIdsRef.current;
        const first = await fetchProductsByIds(firestore, ids.slice(0, PAGE_SIZE));
        if (cancelled) return;
        setLikedProducts(first);
        nextLikesIndexRef.current = Math.min(PAGE_SIZE, ids.length);
        setHasMore(nextLikesIndexRef.current < ids.length);
      } catch (e) {
        console.error('likes first page failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    ensureLikesFirstPage();
    return () => { cancelled = true; };
  }, [activeTab, firestore, likedProducts.length]);

  // ————————— derived items per tab (filter + sort)
  const baseItems = activeTab === TABS.SELLING ? sellingProducts : likedProducts;

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter((p) =>
      [p.name, p.subtitle, p.brand, (p.tags || []).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [baseItems, queryText]);

  const items = useMemo(() => {
    const arr = [...filtered];
    const toTs = (v) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : Date.parse(v) || 0);

    if (sort === 'new') arr.sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));
    else if (sort === 'top') arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else if (sort === 'price_asc') arr.sort((a, b) => (num(a.sellerPrice ?? a.price) - num(b.sellerPrice ?? b.price)));
    else if (sort === 'price_desc') arr.sort((a, b) => (num(b.sellerPrice ?? b.price) - num(a.sellerPrice ?? a.price)));
    return arr;
  }, [filtered, sort]);

  // ————————— helpers
  const fmt = (p) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: p.currency || 'USD',
      currencyDisplay: 'narrowSymbol',
    }).format(Number((p.sellerPrice ?? p.price) || 0));

  const fmtWas = (p) => {
    const original = Number(p.price || 0);
    if (!original) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: p.currency || 'USD',
      currencyDisplay: 'narrowSymbol',
    }).format(original);
  };

  const compact = (n) => {
    try { return Intl.NumberFormat(undefined, { notation: 'compact' }).format(n || 0); }
    catch { return n; }
  };

  // ————————— ui
  return (
    <div className="up-root">
      <Header hasSearchBar={false} mainPageHeader={true} />

      {/* Header */}
      <div className="up-header">
        <div className='up-header__left-wrap'>
          <div className="up-header__avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile?.displayName || 'user'} />
            ) : (
              <div className="up-avatar__fallback">
                {(profile?.displayName?.[0] || 'Ü').toUpperCase()}
              </div>
            )}
          </div>

          <div className="up-header__body">
            <div className="up-title">
              <h1>{profile?.name || t('storefront')}</h1>
              {profile?.username && <span className="up-handle">@{profile.username}</span>}
            </div>
            {profile?.bio && <p className="up-bio">{profile.bio}</p>}
            <div className="up-meta">
              {profile?.location && <span>{profile.location}</span>}
              {profile?.joinedAt && (
                <span>{t('joinedFull', { date: new Date(profile.joinedAt).toLocaleDateString() })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="up-stats">
          <Stat number={sellingProducts.length} label={t('products')} />
          <Stat number={sum(sellingProducts, 'sold')} label={t('sold')} />
          <Stat
            number={
              profile?.likes
                ? (Array.isArray(profile.likes) ? profile.likes.length : Object.keys(profile.likes || {}).length)
                : 0
            }
            label={t('likes')}
          />
        </div>
      </div>

      {/* Tabs (new) */}
      <div className="up-tabs">
        <div
          className={`up-tab ${activeTab === TABS.SELLING ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(TABS.SELLING);
            setHasMore(nextSellingIndexRef.current < sellingIdsRef.current.length);
          }}
        >
          <div className='up-tab-img-wrap'>
            <img src={activeTab === TABS.SELLING ? storeIconActive : storeIcon}/>
          </div>
          <div className='up-tab-text'>
            {t('shop')}
          </div>
        </div>
        <div
          className={`up-tab ${activeTab === TABS.LIKES ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(TABS.LIKES);
            setHasMore(nextLikesIndexRef.current < likesIdsRef.current.length);
          }}
        >
          <div className='up-tab-img-wrap'>
            <img src={activeTab === TABS.LIKES ? likeIconActive : likeIcon}/>
          </div>
          <div className='up-tab-text'>
            {t('likes')}
          </div>
        </div>

        <div className="up-tabs__spacer" />
        {/*
        <div className="up-search">
          <input
            type="text"
            placeholder={activeTab === TABS.SELLING ? t('searchShop') : t('searchLikes')}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            aria-label={t('searchShop')}
          />
        </div>

        <div className="up-sort">
          <label htmlFor="sort">{t('sortBy')}</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">{t('sort.new')}</option>
            <option value="price_asc">{t('sort.price_asc')}</option>
            <option value="price_desc">{t('sort.price_desc')}</option>
          </select>
        </div>
        */}
      </div>

      {/* content */}
      <div className="up-content">
        {loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            profile={profile}
            mode={activeTab}
            t={t}
          />
        ) : layout === 'grid' ? (
          <div className="up-grid">
            {items.map((p) => {
              const originalPrice = Number(p.price || 0);
              const current = Number(p.sellerPrice ?? p.price ?? 0);
              const showSale = current < originalPrice && originalPrice > 0;
              const discountPct = showSale ? Math.round((1 - (current / originalPrice)) * 100) : null;

              return (
                <article key={p.id} className="up-card">
                  <div className="up-card__media" onClick={() => onOpenProduct?.(p)}>
                    <img src={p.image || p.images?.[0]} alt={p.name} />

                    {showSale && (
                      <div
                        className="up-btn"
                        onClick={(e) => { e.stopPropagation(); onOpenProduct?.(p); }}
                        aria-label={t('discountOffFumart', { pct: discountPct })}
                      >
                        <span className="up-flip loop">
                          <span className="up-flip__inner">
                            <span className="up-flip__item is-a">
                              {Number.isFinite(p.sellerQty) ? (
                                <div className="up-flip-instock">
                                  <div className="sale-tag">{t('saleTagQty', { qty: p.sellerQty })}</div>
                                </div>
                              ) : (
                                t('discountOffFumart', { pct: discountPct })
                              )}
                            </span>
                            <span className="up-flip__item is-b">
                              {t('discountOffFumart', { pct: discountPct })}
                            </span>
                            <span className="up-flip__item is-a">
                              {Number.isFinite(p.sellerQty) ? (
                                <div className="up-flip-instock">
                                  <div className="sale-tag">{t('saleTagQty', { qty: p.sellerQty })}</div>
                                </div>
                              ) : (
                                t('discountOffFumart', { pct: discountPct })
                              )}
                            </span>
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="up-card__body">
                    <div className="up-card__title" title={p.name}>
                      {p.name}
                    </div>
                    {p.subtitle && (
                      <div className="up-card__subtitle" title={p.subtitle}>
                        {p.subtitle}
                      </div>
                    )}
                    <div className="up-card__price" data-sale={showSale ? 'true' : 'false'}>
                      <span className="current">{fmt(p)}</span>
                      {showSale && <span className="was">{fmtWas(p)}</span>}
                      <span className="currency">
                        {t(`currency.${p.currency || 'USD'}`, { defaultValue: p.currency || 'USD' })}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="up-list">
            {items.map((p) => {
              const originalPrice = Number(p.price || 0);
              const current = Number(p.sellerPrice ?? p.price ?? 0);
              const showSale = current < originalPrice && originalPrice > 0;
              const discountPct = showSale ? Math.round((1 - (current / originalPrice)) * 100) : null;

              const badgeA = showSale
                ? t('pctBelowFumart', { pct: discountPct })
                : Number.isFinite(p.sellerQty)
                ? t('instockQty', { qty: p.sellerQty })
                : t('available');

              const badgeB = showSale
                ? Number.isFinite(p.sellerQty)
                  ? t('instockQty', { qty: p.sellerQty })
                  : (p.brand || t('deal'))
                : (p.brand || p.origin || t('viewBuy'));

              return (
                <article key={p.id} className="up-row">
                  <div className="up-row__media">
                    <img src={p.image || p.images?.[0]} alt={p.name} />
                  </div>
                  <div className="up-row__body">
                    <div className="up-row__top">
                      <h3 className="title" title={p.name}>{p.name}</h3>
                      <span className={`up-badge ${showSale ? 'is-sale' : 'is-normal'}`}>
                        <span className="up-badgeflip loop">
                          <span className="up-badgeflip__inner">
                            <span className="up-badgeflip__item is-a">{badgeA}</span>
                            <span className="up-badgeflip__item is-b">{badgeB}</span>
                            <span className="up-badgeflip__item is-a">{badgeA}</span>
                          </span>
                        </span>
                      </span>
                    </div>

                    <div className="up-row__meta">
                      {typeof p.sold === 'number' && <span>{compact(p.sold)} {t('sold')}</span>}
                      {typeof p.likes === 'number' && <span>{compact(p.likes)} {t('likes')}</span>}
                      {Number.isFinite(p.sellerQty) && <span>{t('instockQty', { qty: p.sellerQty })}</span>}
                    </div>

                    <div className="up-row__price" data-sale={showSale ? 'true' : 'false'}>
                      {showSale && <span className="was">{fmtWas(p)}</span>}
                      <button className="up-btn" onClick={() => onOpenProduct?.(p)}>{t('buy')}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div ref={sentinelRef} />
      </div>

      <AccountFooter />
    </div>
  );
};

/* =========== helpers =========== */

async function fetchProductsByIds(firestore, ids) {
  if (!ids || ids.length === 0) return [];
  const out = [];
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const qy = query(collection(firestore, 'products'), where(documentId(), 'in', chunk), fbLimit(10));
    const snap = await getDocs(qy);
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  }
  return out;
}

function mergeWithSellerData(productDocs, sellingMap) {
  return productDocs.map((p) => {
    const selling = sellingMap[p.id]; // [qty, price]
    const sellerQty = Array.isArray(selling) ? Number(selling[0]) : undefined;
    const sellerPrice = Array.isArray(selling) ? Number(selling[1]) : undefined;
    return {
      ...p,
      sellerQty: Number.isFinite(sellerQty) ? sellerQty : undefined,
      sellerPrice: Number.isFinite(sellerPrice) ? sellerPrice : undefined,
    };
  });
}

function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

// ————————— small bits
const Stat = ({ number = 0, label = '' }) => (
  <div className="up-stat">
    <div className="num">{formatCompact(number)}</div>
    <div className="lab">{label}</div>
  </div>
);

const GridSkeleton = () => (
  <div className="up-grid">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="up-card up-skeleton">
        <div className="up-card__media" />
        <div className="up-card__body">
          <div className="line" />
          <div className="line short" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ profile, mode, t }) => {
  const handle = profile?.username ? `@${profile.username}` : t('thisUser');
  if (mode === TABS.LIKES) {
    return (
      <div className="up-empty">
        <div className='up-empty-image-wrap'>
          <img src={MeihuaDragonIcon}/>
        </div>
        <h3>{t('emptyLikesTitle')}</h3>
        <p>{t('emptyLikesDesc', { handle })}</p>
      </div>
    );
  }
  return (
    <div className="up-empty">
      <div className='up-empty-image-wrap'>
        <img src={MeihuaDragonIcon}/>
      </div>
      <h3>{t('inventoryEmptyTitle')}</h3>
      <p>
        {profile?.username
          ? t('inventoryEmptyDescWithHandle', { handle: `@${profile.username}` })
          : t('inventoryEmptyDescSeller')}
      </p>
    </div>
  );
};

// ————————— utils
function sum(arr, key) {
  return arr.reduce((a, it) => a + (Number(it?.[key]) || 0), 0);
}
function formatCompact(num) {
  try {
    return Intl.NumberFormat(undefined, { notation: 'compact' }).format(num || 0);
  } catch {
    return num;
  }
}

export default Profile;
