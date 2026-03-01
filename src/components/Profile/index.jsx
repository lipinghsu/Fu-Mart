// src/components/Profile/Profile.jsx
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
  updateDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import './Profile.scss';
import AccountFooter from '../AccountFooter';
import ProductModal from '../ProductModal';
import Header from '../Header';
import MeihuaDragonIcon from '../../assets/Icons/meihua-dragon-icon2.png';
import storeIconActive from '../../assets/Icons/store-icon-m3.png';
import storeIcon from '../../assets/Icons/store-icon-m2.png';
import likeIcon from '../../assets/Icons/shuang-xi.png';
import likeIconActive from '../../assets/Icons/shuang-xi-2.png';

import { useCurrency } from '../../context/CurrencyContext';
import { auth, storage } from '../../firebase/utils';

const PAGE_SIZE = 24;

const TABS = {
  SELLING: 'selling',
  LIKES: 'likes',
};

const Profile = ({ userId, firestore, onOpenProduct }) => {
  const { t } = useTranslation(['profile']);

  // ————————— state
  const [profile, setProfile] = useState(null);

  const [sellingProducts, setSellingProducts] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);

  const [activeTab, setActiveTab] = useState(TABS.SELLING);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [totalSellingCount, setTotalSellingCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [layout] = useState('grid');
  const [queryText, setQueryText] = useState('');
  const [sort, setSort] = useState('new');

  const [currentUid, setCurrentUid] = useState(null);
  const isOwner = !!currentUid && currentUid === userId;

  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const handleOpenProduct = (product) => setSelectedProduct(product);
  const handleCloseProduct = () => setSelectedProduct(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    avatar: '',
  });

  const convertPrice = (usdPrice, selectedCurrency) => {
    const rates = {
      USD: 1,
      TWD: 32,
      JPY: 150,
      KRW: 1380,
    };
    const rate = rates[selectedCurrency] || 1;
    return usdPrice * rate;
  };

  const currencySymbols = {
    USD: '$',
    TWD: 'NT$',
    JPY: '¥',
    KRW: '₩',
  };
  const { selectedCurrency } = useCurrency();

  // ————————— pagination & caches
  const sellingMapRef = useRef({});
  const sellingIdsRef = useRef([]);           // 已按照 createdAt 由新到舊排序的 ID list
  const nextSellingIndexRef = useRef(0);

  const likesIdsRef = useRef([]);
  const nextLikesIndexRef = useRef(0);

  const sentinelRef = useRef(null);

  // ————————— watch auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setCurrentUid(u?.uid || null);
    });
    return () => off();
  }, []);

  // 將 createdAt 轉成 timestamp（更穩健）
  const toTs = (v) => {
    if (!v) return 0;
    if (v?.toMillis) return v.toMillis();
    if (typeof v === 'number') return v;
    const parsed = Date.parse(v);
    return isNaN(parsed) ? 0 : parsed;
  };

  // ————————— load profile
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setSellingProducts([]);
        setLikedProducts([]);
        setHasMore(true);
        setActiveTab(TABS.SELLING);
        nextSellingIndexRef.current = 0;
        nextLikesIndexRef.current = 0;
        setTotalSellingCount(0);
        setIsLoadingMore(false);

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

        setForm({
          name: String(user.name || user.displayName || '').trim(),
          username: String(user.username || user.userName || '').replace(/^@/, '').trim(),
          bio: String(user.bio || '').trim(),
          location: String(user.location || '').trim(),
          avatar: String(user.avatar || ''),
        });

        // SELLING
        const selling = user.selling && typeof user.selling === 'object' ? user.selling : {};
        const rawIds = Object.keys(selling);
        sellingMapRef.current = selling;
        setTotalSellingCount(rawIds.length);

        // LIKES
        const likes = Array.isArray(user.likes)
          ? user.likes
          : user.likes && typeof user.likes === 'object'
            ? Object.keys(user.likes)
            : [];
        likesIdsRef.current = likes;

        if (rawIds.length === 0) {
          setSellingProducts([]);
          setHasMore(false);
        } else {
          // 1. 取得所有產品
          const allDocs = await fetchProductsByIds(firestore, rawIds);

          // 2. 按照 createdAt 由新到舊排序
          const sortedDocs = [...allDocs].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));

          // 3. 儲存排序後的 ID list
          const sortedIds = sortedDocs.map(p => p.id);
          sellingIdsRef.current = sortedIds;

          // 4. 第一頁
          const firstSlice = sortedDocs.slice(0, PAGE_SIZE);
          const merged = mergeWithSellerData(firstSlice, selling);
          setSellingProducts(merged);

          nextSellingIndexRef.current = PAGE_SIZE;
          setHasMore(PAGE_SIZE < sortedIds.length);
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

  // ————————— infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [ent] = entries;
        if (ent.isIntersecting && !isLoadingMore) loadMore();
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, activeTab, isLoadingMore]);

  // ————————— load more（嚴格按照 sortedIds 順序）
  async function loadMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      if (activeTab === TABS.SELLING) {
        const allIds = sellingIdsRef.current;   // 已排序的 ID list
        const start = nextSellingIndexRef.current;
        if (start >= allIds.length) {
          setHasMore(false);
          setIsLoadingMore(false);
          return;
        }
        const end = Math.min(start + PAGE_SIZE, allIds.length);
        const slice = allIds.slice(start, end);

        const docs = await fetchProductsByIds(firestore, slice);
        const merged = mergeWithSellerData(docs, sellingMapRef.current);

        // 再次確保排序（保險）
        const sortedMerged = [...merged].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));

        setSellingProducts((prev) => [...prev, ...sortedMerged]);
        nextSellingIndexRef.current = end;
        setHasMore(end < allIds.length);
      } else {
        const allIds = likesIdsRef.current;
        const start = nextLikesIndexRef.current;
        if (start >= allIds.length) {
          setHasMore(false);
          setIsLoadingMore(false);
          return;
        }
        const end = Math.min(start + PAGE_SIZE, allIds.length);
        const slice = allIds.slice(start, end);

        const docs = await fetchProductsByIds(firestore, slice);
        setLikedProducts((prev) => [...prev, ...docs]);
        nextLikesIndexRef.current = end;
        setHasMore(end < allIds.length);
      }
    } catch (e) {
      console.error('loadMore failed', e);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // ————————— lazy-load first page for LIKES
  useEffect(() => {
    let cancelled = false;
    async function ensureLikesFirstPage() {
      if (activeTab !== TABS.LIKES) return;
      if (likedProducts.length > 0 || likesIdsRef.current.length === 0) return;

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

  // ————————— derived items
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
    if (sort === 'new') {
      arr.sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));
    } else if (sort === 'top') {
      arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sort === 'price_asc') {
      arr.sort((a, b) => (num(a.sellerPrice ?? a.price) - num(b.sellerPrice ?? b.price)));
    } else if (sort === 'price_desc') {
      arr.sort((a, b) => (num(b.sellerPrice ?? b.price) - num(a.sellerPrice ?? b.price)));
    }
    return arr;
  }, [filtered, sort]);

  // ————————— handlers
  const sanitizeUsername = (u) => String(u || '').replace(/^@/, '').trim();

  const handlePickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;
    try {
      setAvatarUploading(true);
      const key = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const ref = storageRef(storage, `avatars/${userId}/${key}`);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);

      setForm((s) => ({ ...s, avatar: url }));
      setProfile((p) => (p ? { ...p, avatar: url } : p));

      await updateDoc(doc(firestore, 'users', userId), { avatar: url, updatedAt: new Date().toISOString() });
      setSaveMsg('Avatar updated.');
      setTimeout(() => setSaveMsg(''), 1800);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwner || savingProfile) return;

    const updates = {
      name: String(form.name || '').trim(),
      displayName: String(form.name || '').trim(),
      username: sanitizeUsername(form.username),
      userName: sanitizeUsername(form.username),
      bio: String(form.bio || '').trim(),
      location: String(form.location || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    if (!updates.name) return alert('Please enter your name.');
    if (updates.username.length < 2) return alert('Username should be at least 2 characters.');

    try {
      setSavingProfile(true);

      const newHandle = updates.username;
      const oldHandle = String(profile?.username || profile?.userName || '')
        .replace(/^@/, '')
        .trim();

      if (newHandle && newHandle.toLowerCase() !== (oldHandle || '').toLowerCase()) {
        const qy = query(collection(firestore, 'users'), where('username', '==', newHandle));
        const snap = await getDocs(qy);
        const takenByAnother = snap.docs.some((d) => d.id !== userId);
        if (takenByAnother) {
          alert('That username is already taken.');
          setSavingProfile(false);
          return;
        }
      }

      await updateDoc(doc(firestore, 'users', userId), updates);

      if (newHandle && oldHandle && newHandle.toLowerCase() !== oldHandle.toLowerCase()) {
        setSaveMsg('Updating listings…');
        try {
          const { matched, updated } = await migrateUsernameInProducts(firestore, oldHandle, newHandle);
          setSaveMsg(`Profile saved. Updated ${updated}/${matched} listings.`);
        } catch (mErr) {
          console.error('Failed to update products sellBy usernames:', mErr);
          alert('Saved profile, but could not update your listings. Please try again.');
        }
      } else {
        setSaveMsg('Profile saved.');
      }

      setProfile((p) => (p ? { ...p, ...updates } : p));
      setEditMode(false);
      setTimeout(() => setSaveMsg(''), 2600);
    } catch (err) {
      console.error('Save profile failed', err);
      alert('Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ————————— ui
  return (
    <div className="up-root">
      <Header hasSearchBar={false} mainPageHeader={true} />

      <div className="up-header">
        <div className="up-header__top">
          <div className="up-header__left-wrap">
            <div className="up-header__avatar">
              {form.avatar ? (
                <img src={form.avatar} alt={profile?.displayName || profile?.name || 'user'} />
              ) : (
                <div className="up-avatar__fallback">
                  {(profile?.displayName?.[0] || profile?.name?.[0] || 'Ü').toUpperCase()}
                </div>
              )}
            </div>

            <div className="up-header__body">
              {!editMode ? (
                <div className="up-title">
                  <h1>{profile?.name || profile?.displayName || t('storefront')}</h1>
                  {profile?.username && <span className="up-handle">@{profile.username}</span>}
                </div>
              ) : (
                <div className="up-edit-form">
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
                    <label>
                      <div style={{ fontSize: 12, color: '#777' }}>Name</div>
                      <input
                        className="up-input"
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Your name"
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: 12, color: '#777' }}>Username</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#777' }}>@</span>
                        <input
                          className="up-input"
                          value={form.username}
                          onChange={(e) => setForm((s) => ({ ...s, username: e.target.value.replace(/^@/, '') }))}
                          placeholder="username"
                        />
                      </div>
                    </label>
                    <label>
                      <div style={{ fontSize: 12, color: '#777' }}>Bio</div>
                      <textarea
                        className="up-input"
                        rows={3}
                        value={form.bio}
                        onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
                        placeholder="Tell people about you"
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: 12, color: '#777' }}>Location</div>
                      <input
                        className="up-input"
                        value={form.location}
                        onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="up-stats">
            <Stat number={totalSellingCount} label={t('products')} />
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

        {!editMode && (
          <div className="up-header__info">
            {profile?.bio && <p className="up-bio">{profile.bio}</p>}
            <div className="up-meta">
              {profile?.joinedAt && (
                <span>{t('joinedFull', { date: new Date(profile.joinedAt).toLocaleDateString() })}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editMode ? (
            <>
              <label className="up-btn" style={{ position: 'relative', inset: 'auto', height: 36 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickAvatar}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  disabled={avatarUploading}
                />
                {avatarUploading ? 'Uploading avatar…' : 'Change avatar'}
              </label>

              <button
                className="up-btn"
                style={{ height: 36, position: 'relative', inset: 'auto' }}
                onClick={() => setEditMode(true)}
              >
                Edit profile
              </button>
            </>
          ) : (
            <>
              <button
                className="up-btn"
                style={{ height: 36, position: 'relative', inset: 'auto' }}
                onClick={() => {
                  setForm({
                    name: String(profile?.name || profile?.displayName || ''),
                    username: String(profile?.username || profile?.userName || '').replace(/^@/, ''),
                    bio: String(profile?.bio || ''),
                    location: String(profile?.location || ''),
                    avatar: String(profile?.avatar || ''),
                  });
                  setEditMode(false);
                }}
                disabled={savingProfile}
              >
                Cancel
              </button>

              <button
                className="up-btn"
                style={{ height: 36, position: 'relative', inset: 'auto', background: '#111', color: '#fff' }}
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}

          {!!saveMsg && (
            <span style={{ marginLeft: 8, fontSize: 13, color: '#28a739' }}>{saveMsg}</span>
          )}
        </div>
      )}

      <div className="up-tabs">
        <div
          className={`up-tab ${activeTab === TABS.SELLING ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(TABS.SELLING);
            setHasMore(nextSellingIndexRef.current < sellingIdsRef.current.length);
          }}
        >
          <div className='up-tab-img-wrap'>
            <img src={activeTab === TABS.SELLING ? storeIconActive : storeIcon} alt="" />
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
            <img src={activeTab === TABS.LIKES ? likeIconActive : likeIcon} alt="" />
          </div>
          <div className='up-tab-text'>
            {t('likes')}
          </div>
        </div>

        <div className="up-tabs__spacer" />
      </div>

      <div className="up-content">
        {loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState profile={profile} mode={activeTab} t={t} />
        ) : layout === 'grid' ? (
          <div className="up-grid">
            {items.filter((product) => !product.isHidden).map((p) => {
              const originalPrice = Number(p.price || 0);
              const current = Number(p.sellerPrice ?? p.price ?? 0);
              const showSale = current < originalPrice && originalPrice > 0;
              const discountPct = showSale ? Math.round((1 - (current / originalPrice)) * 100) : null;

              return (
                <article key={p.id} className="up-card" onClick={() => handleOpenProduct(p)}>
                  <div className="up-card__media">
                    <img src={p.image || p.images?.[0]} alt={p.name} />
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
                      <span className="current">
                        {currencySymbols[selectedCurrency]}
                        {convertPrice(Number(p.sellerPrice ?? p.price ?? 0), selectedCurrency).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                      {showSale && (
                        <span className="was">
                          {currencySymbols[selectedCurrency]}
                          {convertPrice(Number(p.price || 0), selectedCurrency).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      )}
                      <span className="currency">{selectedCurrency}</span>
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
                      {typeof p.sold === 'number' && <span>{formatCompact(p.sold)} {t('sold')}</span>}
                      {typeof p.likes === 'number' && <span>{formatCompact(p.likes)} {t('likes')}</span>}
                      {Number.isFinite(p.sellerQty) && <span>{t('instockQty', { qty: p.sellerQty })}</span>}
                    </div>

                    <div className="up-row__price" data-sale={showSale ? 'true' : 'false'}>
                      <span className="current">
                        {currencySymbols[selectedCurrency]}
                        {convertPrice(Number(p.sellerPrice ?? p.price ?? 0), selectedCurrency).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </span>

                      {showSale && (
                        <span className="was">
                          {currencySymbols[selectedCurrency]}
                          {convertPrice(Number(p.price || 0), selectedCurrency).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      )}

                      <span className="currency">{selectedCurrency}</span>

                      <button className="up-btn" onClick={() => handleOpenProduct(p)}>
                        {t('buy')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {isLoadingMore && (
          <div className="up-loading-more">
            <div className="up-spinner" />
          </div>
        )}

        <div ref={sentinelRef} />
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseProduct}
        />
      )}

      <AccountFooter />
    </div>
  );
};

/* =========== helpers =========== */

async function migrateUsernameInProducts(firestore, oldHandle, newHandle) {
  if (!oldHandle || !newHandle || oldHandle === newHandle) return { matched: 0, updated: 0 };

  const qy = query(collection(firestore, 'products'), where('sellBy', 'array-contains', oldHandle));
  const snap = await getDocs(qy);

  let updated = 0;
  let batch = writeBatch(firestore);
  let opsInBatch = 0;

  const COMMIT_AT = 450;

  for (const d of snap.docs) {
    const ref = d.ref;

    batch.update(ref, { sellBy: arrayRemove(oldHandle) });
    batch.update(ref, { sellBy: arrayUnion(newHandle) });

    updated += 1;
    opsInBatch += 2;

    if (opsInBatch >= COMMIT_AT) {
      await batch.commit();
      batch = writeBatch(firestore);
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  return { matched: snap.size, updated };
}

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
    const selling = sellingMap[p.id];
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
          <img src={MeihuaDragonIcon} alt="" />
        </div>
        <h3>{t('emptyLikesTitle')}</h3>
        <p>{t('emptyLikesDesc', { handle })}</p>
      </div>
    );
  }
  return (
    <div className="up-empty">
      <div className='up-empty-image-wrap'>
        <img src={MeihuaDragonIcon} alt="" />
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

function sum(arr, key) {
  return arr.reduce((a, it) => a + (Number(it?.[key]) || 0), 0);
}

function formatCompact(n) {
  try {
    return Intl.NumberFormat(undefined, { notation: 'compact' }).format(n || 0);
  } catch {
    return n;
  }
}

export default Profile;