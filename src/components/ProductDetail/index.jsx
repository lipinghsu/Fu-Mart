// src/components/ProductDetail/ProductDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import ProductCard from '../ProductCard';
import Header from '../Header';
import Footer from '../Footer';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/utils';

import fumartLogo from '../../assets/fumart-m-t-bg.png';
import fumartStamp from '../../assets/fumart-stamp.png';
import SoldByIcon from '../../assets/Icons/sold-by.png';

import './ProductDetail.scss';

// Reuse ProductModal components
import ImageCarousel from '../Storefront/ProductModal/ImageCarousel';
import ThumbnailRow from '../Storefront/ProductModal/ThumbnailRow';
import PriceBlock from '../Storefront/ProductModal/PriceBlock';
import QuantityControl from '../Storefront/ProductModal/QuantityControl';
import SellersStrip from '../Storefront/ProductModal/SellersStrip';
import MediaLinks from '../Storefront/ProductModal/MediaLinks';
import ReviewSection from '../Storefront/ProductModal/ReviewSection';
import PriceHistory from '../Storefront/ProductModal/PriceHistory';

// inside component:
const storage = getStorage();

// derive storage path from download URL (best effort)
const pathFromDownloadUrl = (url) => {
  try {
    const u = new URL(url);
    const enc = u.pathname.split('/o/')[1]?.split('?')[0];
    return enc ? decodeURIComponent(enc) : null;
  } catch { return null; }
};

const handleUploadImages = async (fileList) => {
  if (!product) return;
  const files = Array.from(fileList || []).filter(f => f && f.type.startsWith('image/'));
  if (!files.length) return;

  const uploaded = [];
  for (const f of files) {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name.replace(/\s+/g,'_')}`;
    const fullPath = `products/${product.id}/${key}`;
    const sref = storageRef(storage, fullPath);
    await uploadBytes(sref, f);
    const url = await getDownloadURL(sref);
    uploaded.push(url);
  }

  const newImages = [...(product.images || []), ...uploaded];
  await updateDoc(doc(firestore, 'products', product.id), { images: newImages });
  setProduct(p => p ? { ...p, images: newImages } : p);
};

const handleDeleteImage = async (imageUrl) => {
  if (!product?.images) return;
  const newImages = product.images.filter(u => u !== imageUrl);

  await updateDoc(doc(firestore, 'products', product.id), { images: newImages });
  setProduct(p => p ? { ...p, images: newImages } : p);

  // try to remove file from Storage too
  try {
    const p = pathFromDownloadUrl(imageUrl);
    if (p) await deleteObject(storageRef(storage, p));
  } catch (e) {
    console.warn('Storage delete failed:', e);
  }

  // keep selectedIndex in range if you delete the active thumb
  setSelectedIndex(idx => Math.min(idx, Math.max(0, newImages.length - 1)));
};

// -------- helpers: safe YouTube id + embed (watch/shorts/share) --------
const getYouTubeId = (url = '') => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex((p) => p === 'shorts' || p === 'embed' || p === 'live');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch (_) {}
  return null;
};
const getYouTubeEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : '';
};

// ------- small util(s)
const toNumberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation(['storefront']);

  const [roleDebug, setRoleDebug] = useState({ stage: 'init' });

  useEffect(() => {
    // Fast override for QA: ?admin=1 or localStorage.forceAdmin="1"
    const params = new URLSearchParams(window.location.search);
    const forceAdmin = params.get('admin') === '1' || localStorage.getItem('forceAdmin') === '1';
    if (forceAdmin) {
      setUserRole('admin');
      setRoleDebug((d) => ({ ...d, override: 'query/localStorage' }));
      return; // short-circuit for testing
    }

    const off = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUserRole(null);
          setRoleDebug({ stage: 'no-user' });
          return;
        }

        // 1) Try custom claims first
        let claimsRole = null;
        try {
          const token = await u.getIdTokenResult(true); // force refresh to get latest claims
          claimsRole = token?.claims?.role || null;
        } catch (e) {
          // ignore, we'll fall back to Firestore
        }

        if (claimsRole) {
          setUserRole(claimsRole);
          setRoleDebug({ stage: 'claims', uid: u.uid, role: claimsRole });
          return;
        }

        // 2) Fallback to Firestore users/<uid>.role
        try {
          const userDoc = await getDoc(doc(firestore, 'users', u.uid));
          const fsRole = userDoc.exists() ? (userDoc.data()?.role || null) : null;
          setUserRole(fsRole);
          setRoleDebug({ stage: 'firestore', uid: u.uid, role: fsRole, exists: userDoc.exists() });
        } catch (e) {
          setUserRole(null);
          setRoleDebug({ stage: 'firestore-error', error: String(e) });
        }
      } catch (err) {
        setUserRole(null);
        setRoleDebug({ stage: 'fatal', error: String(err) });
      }
    });

    return () => off();
  }, []);

  // refs
  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const brandRef = useRef(null);

  // state
  const [product, setProduct] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true);

  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  const [loadingBrand, setLoadingBrand] = useState(true);
  const [brandProducts, setBrandProducts] = useState([]);

  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);

  // carousel index
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ---- ADMIN: role + edit mode
  // If you already derive role from auth/Redux, replace with your source.
  // Example: const userRole = useSelector(s => s.user.role);
  const [userRole, setUserRole] = useState(location.state?.userRole || null);
  const isAdmin = userRole === 'admin';

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    subtitle: '',
    price: '',
    priceDiscount: '',
    stockQuantity: '',
    category: '',
    subCategory: '',
    brand: '',
    description: '',
  });

  // cart
  const cartItems = useSelector((state) => state.cart.items);
  const cartItem = product ? cartItems.find((i) => i.id === product.id) : null;
  const currentCartQuantity = cartItem?.quantity || 0;

  // pricing / stock
  const stockQty = Number(product?.stockQuantity ?? 0);
  const isSoldOut = stockQty <= 0;

  const price = typeof product?.price === 'number' ? product?.price : Number(product?.price ?? 0);
  const discount = Number(product?.priceDiscount ?? 0);
  const isOnSale = !isSoldOut && price > 0 && discount > 0;
  const finalPrice = isOnSale ? Math.max(price - discount, 0) : price;

  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];

  // SELLERS (normalization)
  const usernames = useMemo(() => {
    const arr = Array.isArray(product?.sellBy) ? product.sellBy : [];
    const names = arr
      .map((item) => (typeof item === 'string' ? item : item?.username || item?.displayName))
      .filter(Boolean)
      .map((n) => n.trim().replace(/^@/, ''))
      .filter((n) => n.length > 0);
    return Array.from(new Set(names));
  }, [product?.sellBy]);

  const [sellerNameMap, setSellerNameMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    async function fetchDisplayNames() {
      if (!usernames.length) {
        if (!cancelled) setSellerNameMap({});
        return;
      }
      const map = {};
      for (let i = 0; i < usernames.length; i += 10) {
        const chunk = usernames.slice(i, i + 10);
        try {
          const qy = query(collection(firestore, 'users'), where('username', 'in', chunk));
          const snap = await getDocs(qy);
          snap.forEach((d) => {
            const data = d.data();
            const u = (data?.username || '').toString().replace(/^@/, '');
            const pretty = (data?.name || data?.displayName || '').toString().trim();
            if (u) map[u] = pretty || u;
          });
        } catch {
          chunk.forEach((u) => { if (!map[u]) map[u] = u; });
        }
      }
      usernames.forEach((u) => { if (!map[u]) map[u] = u; });
      if (!cancelled) setSellerNameMap(map);
    }
    fetchDisplayNames();
    return () => { cancelled = true; };
  }, [usernames.join(',')]);

  const resolvedSellers = useMemo(
    () => usernames.map((u) => ({ username: u, name: sellerNameMap[u] || u })),
    [usernames, sellerNameMap]
  );

  // mount fade
  useEffect(() => { setFadeIn(true); }, []);

  // fetch product
  useEffect(() => {
    (async () => {
      setLoading(true);
      const ref = doc(firestore, 'products', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const prod = { id: snap.id, ...data };
        setProduct(prod);
        // seed admin form
        setAdminForm({
          name: prod.name ?? '',
          subtitle: prod.subtitle ?? '',
          price: prod.price ?? '',
          priceDiscount: prod.priceDiscount ?? '',
          stockQuantity: prod.stockQuantity ?? '',
          category: prod.category ?? '',
          subCategory: prod.subCategory ?? '',
          brand: prod.brand ?? '',
          description: prod.description ?? '',
        });
        setSelectedIndex(0);
        setThumbnailsLoading(true);
        setTimeout(() => setThumbnailsLoading(false), 500);
        requestAnimationFrame(() => {
          modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      setLoading(false);
    })();
  }, [id]);

  // fetch suggestions (category-based)
  useEffect(() => {
    if (!product) return;
    (async () => {
      try {
        setLoadingSuggestions(true);
        const qy = query(collection(firestore, 'products'), where('category', '==', product.category));
        const snap = await getDocs(qy);
        const all = [];
        snap.forEach((d) => {
          if (d.id !== product.id) all.push({ id: d.id, ...d.data() });
        });
        const sameSub = all.filter((i) => i.subCategory === product.subCategory);
        const diffSub = all.filter((i) => i.subCategory !== product.subCategory);
        const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
        setSuggestions([...shuffle(sameSub), ...shuffle(diffSub)].slice(0, 8));
      } catch (e) {
        console.error('Suggestions error:', e);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [product?.id, product?.category, product?.subCategory]);

  // fetch brand products
  useEffect(() => {
    if (!product) return;
    (async () => {
      try {
        setLoadingBrand(true);
        if (!product.brand) {
          setBrandProducts([]);
          return;
        }
        const qy = query(collection(firestore, 'products'), where('brand', '==', product.brand));
        const snap = await getDocs(qy);
        const items = [];
        snap.forEach((d) => {
          if (d.id !== product.id) items.push({ id: d.id, ...d.data() });
        });
        const sameSub = items.filter((i) => i.subCategory === product.subCategory);
        const diffSub = items.filter((i) => i.subCategory !== product.subCategory);
        const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
        setBrandProducts([...shuffle(sameSub), ...shuffle(diffSub)].slice(0, 8));
      } catch (e) {
        console.error('Brand fetch error:', e);
        setBrandProducts([]);
      } finally {
        setLoadingBrand(false);
      }
    })();
  }, [product?.id, product?.brand, product?.subCategory]);

  // sync quantity with cart
  useEffect(() => {
    if (!product) return;
    const inCart = cartItems.find((i) => i.id === product.id);
    setQuantity(inCart?.quantity || 1);
  }, [cartItems, product]);

  // qty dropdown select
  const handleSelectQuantity = (val) => {
    if (isSoldOut) return;
    setQuantity(val);
    setDropdownOpen(false);
  };

  // update & add
  const handleUpdateQuantity = () => {
    if (!product) return;
    const updated = {
      ...product,
      createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : product.createdAt,
      quantity,
    };
    dispatch({ type: 'cart/updateItemQuantity', payload: updated });
    setShowUpdatedMessage(true);
    setTimeout(() => setShowUpdatedMessage(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product || isSoldOut) return;
    const safe = {
      ...product,
      createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : product.createdAt,
      addedQuantity: quantity,
    };
    dispatch(addToCart(safe));
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 2000);
  };

  const onBuyNow = (p, q) => {
    if (!p || isSoldOut) return;
    const safe = {
      ...p,
      createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : p.createdAt,
      addedQuantity: q || 1,
    };
    dispatch(addToCart(safe));
    navigate('/checkout');
  };

  // ---------- ADMIN: handlers ----------
  const startEdit = () => {
    if (!product) return;
    setAdminForm({
      name: product.name ?? '',
      subtitle: product.subtitle ?? '',
      price: product.price ?? '',
      priceDiscount: product.priceDiscount ?? '',
      stockQuantity: product.stockQuantity ?? '',
      category: product.category ?? '',
      subCategory: product.subCategory ?? '',
      brand: product.brand ?? '',
      description: product.description ?? '',
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!product || saving) return;
    setSaving(true);
    try {
      const updates = {
        name: String(adminForm.name ?? '').trim(),
        subtitle: String(adminForm.subtitle ?? ''),
        price: toNumberOrZero(adminForm.price),
        priceDiscount: toNumberOrZero(adminForm.priceDiscount),
        stockQuantity: toNumberOrZero(adminForm.stockQuantity),
        category: String(adminForm.category ?? '').trim(),
        subCategory: String(adminForm.subCategory ?? '').trim(),
        brand: String(adminForm.brand ?? '').trim(),
        description: String(adminForm.description ?? ''),
      };

      // Remove undefined/NaN, keep zeros
      Object.keys(updates).forEach((k) => {
        if (updates[k] === undefined || updates[k] === null) delete updates[k];
      });

      const ref = doc(firestore, 'products', product.id);
      await updateDoc(ref, updates);

      // optimistic UI
      setProduct((prev) => (prev ? { ...prev, ...updates } : prev));
      setEditMode(false);
    } catch (e) {
      console.error('Admin save failed:', e);
      // stay in edit mode so user can retry
    } finally {
      setSaving(false);
    }
  };

  const buttons = isSoldOut ? (
    <button
      className="pd-restock-btn"
      onClick={() => navigate(`/comingsoon`, { replace: false })}
    >
      {t('notifyMe') || 'Notify Me'}
    </button>
  ) : cartItem ? (
    currentCartQuantity > 0 && quantity !== currentCartQuantity ? (
      <>
        <button className="pd-add-to-bag" onClick={handleUpdateQuantity}>
          {t('updateQuantity')}
        </button>
        <button className="pd-buy-now" onClick={() => onBuyNow(product, quantity)}>
          {t('buyNow')}
        </button>
      </>
    ) : null
  ) : (
    <>
      <button className="pd-add-to-bag" onClick={handleAddToCart}>
        {t('addToBag')}
      </button>
      <button className="pd-buy-now" onClick={() => onBuyNow(product, quantity)}>
        {t('buyNow')}
      </button>
    </>
  );

  if (loading || !product) return null;

  return (
    <div className="pd-wrap">
      <Header hasSearchBar mainPageHeader />

      {/* top category bar */}
      <div className="top-category-bar">
        <span
          className="top-category-bar-link"
          onClick={() =>
            navigate(`/storefront?category=${encodeURIComponent(product.category)}`)
          }
        >
          {product.category}
        </span>
        <span className="top-category-bar-sep">&gt;</span>
        <span
          className="top-category-bar-link"
          onClick={() =>
            navigate(`/storefront?subcategory=${encodeURIComponent(product.subCategory)}`)
          }
        >
          {product.subCategory}
        </span>
      </div>

      {/* Card */}
      <div
        ref={modalRef}
        className={`pd-modal-card ${fadeIn ? 'pd-fade-in' : 'pd-fade-out'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grid */}
        <div className="pd-content-grid">
          {/* LEFT (image) */}
          <div className="pd-left-column">
            <div className="pd-image-wrapper">
              {!!isOnSale && <div className="pd-sale-badge">SALE</div>}
              {isSoldOut && <div className="pd-soldout-badge center">{t('soldOut') || 'SOLD OUT'}</div>}
              <ImageCarousel
                key={product.id}
                images={images}
                productName={product.name}
                isSoldOut={isSoldOut}
                selectedIndex={selectedIndex}
                onChangeIndex={setSelectedIndex}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="pd-right-column styled-right">
            <div className="pd-button-wrap">
              {/* --- ADMIN BAR --- */}
              <div className="pd-btn-inner-wrap-top">
                <div className="pd-name-title-wrap">
                  {/* Name (editable) + PriceBlock (editable numbers) */}
                  <div className="pd-name-stack">
                    {!editMode ? (
                      <h2 className="pd-product-name">{product.name}</h2>
                    ) : (
                      <input
                        className="pd-admin-input name"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Product name"
                      />
                    )}

                    {!editMode ? (
                      <div className="pd-subtitle">{product.subtitle}</div>
                    ) : (
                      <input
                        className="pd-admin-input subtitle"
                        value={adminForm.subtitle}
                        onChange={(e) => setAdminForm((s) => ({ ...s, subtitle: e.target.value }))}
                        placeholder="Subtitle"
                      />
                    )}
                  </div>

                  {!editMode ? (
                    <PriceBlock
                      isSoldOut={isSoldOut}
                      isOnSale={isOnSale}
                      price={price}
                      finalPrice={finalPrice}
                      t={t}
                    />
                  ) : (
                    <div className="pd-admin-pricebox">
                      <label className="pd-admin-field">
                        <span>Price</span>
                        <input
                          type="number"
                          step="0.01"
                          className="pd-admin-input num"
                          value={adminForm.price}
                          onChange={(e) => setAdminForm((s) => ({ ...s, price: e.target.value }))}
                        />
                      </label>
                      <label className="pd-admin-field">
                        <span>Discount</span>
                        <input
                          type="number"
                          step="0.01"
                          className="pd-admin-input num"
                          value={adminForm.priceDiscount}
                          onChange={(e) => setAdminForm((s) => ({ ...s, priceDiscount: e.target.value }))}
                        />
                      </label>
                      <label className="pd-admin-field">
                        <span>Stock</span>
                        <input
                          type="number"
                          className="pd-admin-input num"
                          value={adminForm.stockQuantity}
                          onChange={(e) => setAdminForm((s) => ({ ...s, stockQuantity: e.target.value }))}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {!!resolvedSellers.length && (
                  <SellersStrip
                    resolvedSellers={resolvedSellers}
                    SoldByIcon={SoldByIcon}
                    navigate={navigate}
                  />
                )}

                <ThumbnailRow
                  loading={thumbnailsLoading}
                  images={product.images || []}
                  activeThumbnail={product.images?.[selectedIndex]}
                  onThumbClick={(idx) => setSelectedIndex(idx)}
                  /* NEW: admin controls */
                  isAdmin={isAdmin}
                  onUploadImages={handleUploadImages}
                  onDeleteImage={handleDeleteImage}
                />

                {!isSoldOut && !editMode && (
                  <QuantityControl
                    dropdownRef={dropdownRef}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    quantity={quantity}
                    stockQuantity={product?.stockQuantity}
                    currentCartQuantity={currentCartQuantity}
                    t={t}
                    onSelectQuantity={handleSelectQuantity}
                    onRemove={() => {
                      dispatch({ type: 'cart/removeItem', payload: product.id });
                      setQuantity(1);
                      setDropdownOpen(false);
                    }}
                  />
                )}

                {/* Category / Subcategory / Brand (editable in admin) */}
                {editMode && (
                  <div className="pd-admin-taxonomy">
                    <label className="pd-admin-field">
                      <span>Category</span>
                      <input
                        className="pd-admin-input"
                        value={adminForm.category}
                        onChange={(e) => setAdminForm((s) => ({ ...s, category: e.target.value }))}
                      />
                    </label>
                    <label className="pd-admin-field">
                      <span>Subcategory</span>
                      <input
                        className="pd-admin-input"
                        value={adminForm.subCategory}
                        onChange={(e) => setAdminForm((s) => ({ ...s, subCategory: e.target.value }))}
                      />
                    </label>
                    <label className="pd-admin-field">
                      <span>Brand</span>
                      <input
                        className="pd-admin-input"
                        value={adminForm.brand}
                        onChange={(e) => setAdminForm((s) => ({ ...s, brand: e.target.value }))}
                      />
                    </label>
                  </div>
                )}

                {/* messages */}
                {!editMode && (
                  <div
                    className={`pd-message-container ${
                      showAddedMessage || showUpdatedMessage ? 'pd-expanded' : ''
                    }`}
                  >
                    {showUpdatedMessage && (
                      <div className="pd-added-message">
                        <span>{t('updatedQuantity') || 'Quantity updated!'}</span>
                      </div>
                    )}
                    {showAddedMessage && (
                      <div className="pd-added-message">
                        <span>{t('addedToBag')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* buttons */}
                {!editMode && buttons && <div className="pd-button-group">{buttons}</div>}
              </div>

              <div className="pd-btn-inner-wrap-bot">
                <div className="pd-top-text">
                  <div className="pd-text-img-wrap">
                    <div className="pd-img-wrap">
                      <img src={fumartLogo} alt="logo" />
                    </div>
                    <div className="pd-qualityGuaranteed">{t('qualityGuaranteed')}</div>
                  </div>
                </div>
                <div className="pd-qualityPromise">{t('qualityPromise')}</div>
                
                {isAdmin && (
                <div className="pd-admin-bar">
                  {!editMode ? (
                    <button className="pd-admin-btn" onClick={startEdit}>✎ Edit</button>
                  ) : (
                    <div className="pd-admin-actions">
                      <button className="pd-admin-btn ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      <button className="pd-admin-btn primary" onClick={saveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
                )}

              </div>
              
            </div>
          </div>
        </div>

        {/* Description (admin editable) */}
        <div className="product-description">
          <div className="description-title">
            <div>{t('description')}</div>
          </div>

          {!editMode ? (
            <p>{product.description || t('noDescription')}</p>
          ) : (
            <textarea
              className="pd-admin-textarea"
              rows={6}
              value={adminForm.description}
              onChange={(e) => setAdminForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="Enter product description..."
            />
          )}
        </div>

        {/* Suggestions (category) */}
        <div className="pd-suggestions-container">
          <div className="pd-suggestion-header">
            <h2>{t('youMayAlsoLike')}</h2>
          </div>
          <div className="pd-suggestion-list pd-scroll-horizontal" ref={suggestionsRef}>
            {loadingSuggestions
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div className="pd-suggestion-item-skel" key={`skel-${i}`}>
                    <div className="pd-skeleton-box" />
                  </div>
                ))
              : suggestions.length > 0
              ? suggestions.map((item) => (
                  <div className="pd-suggestion-item" key={item.id}>
                    <ProductCard
                      product={item}
                      onClick={() => navigate(`/product/${item.id}`)}
                      t={t}
                    />
                  </div>
                ))
              : (
                <div className="noSuggestions-wrapper">
                  <div className="no-suggestions-title">
                    {t('noSuggestionsTitle') || 'No Related Products Found'}
                  </div>
                </div>
              )}
          </div>
        </div>

        <ReviewSection
          productId={product.id}
          productName={product.name}
          productSubtitle={product.subtitle}
        />

        {/* More from brand */}
        {(product.brand && (loadingBrand || brandProducts.length > 0)) && (
          <div className="pd-suggestions-container brand-suggestions">
            <div className="pd-suggestion-header">
              <h2>
                {product.brand
                  ? t('moreFromBrand', { brand: product.brand })
                  : t('moreFromBrandGeneric')}
              </h2>
            </div>
            <div className="pd-suggestion-list pd-scroll-horizontal" ref={brandRef}>
              {loadingBrand
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div className="pd-suggestion-item-skel" key={`brand-skel-${i}`}>
                      <div className="pd-skeleton-box" />
                    </div>
                  ))
                : brandProducts.length > 0
                ? brandProducts.map((item) => (
                    <div className="pd-suggestion-item" key={`brand-${item.id}`}>
                      <ProductCard
                        product={item}
                        onClick={() => navigate(`/product/${item.id}`)}
                        t={t}
                      />
                    </div>
                  ))
                : (
                  <div className="noSuggestions-wrapper brand-empty">
                    <div className="no-suggestions-title">
                      {t('noBrandProductsTitle') || 'No Other Products From This Brand'}
                    </div>
                    <div className="no-suggestions-sub">
                      {t('noBrandProductsMsg', { brand: product.brand }) || `We can’t find other ${product.brand} items.`}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Price history */}
        <PriceHistory productName={product.name} data={product.priceHistory ?? []} />

          {/* Reusable MediaLinks (only when mediaLink exists & has items) */}
        {Array.isArray(product.mediaLink) && product.mediaLink.length > 0 && (
          <div
            className={`media-links-wrap ${
              Array.isArray(product.mediaLink) && product.mediaLink.length > 0 ? 'has-vid' : ''
            }`}
          >
            <MediaLinks
              mediaLink={product.mediaLink}
              isAdmin={isAdmin}
              onSaveLinks={async (newLinks) => {
                await updateDoc(doc(firestore, 'products', product.id), {
                  mediaLink: Array.isArray(newLinks) ? newLinks : [],
                });
                setProduct((prev) =>
                  prev ? { ...prev, mediaLink: Array.isArray(newLinks) ? newLinks : [] } : prev
                );
              }}
            />
          </div>
        )}
        {/* Disclaimer */}
        <div className="product-disclaimer">
          <div className="product-disclaimer-text-wrap">
            <p>{t('productDisclaimerPart1')}</p>
            <p>
              {t('productDisclaimerPart2')}{' '}
              <strong>
                <a href="/ComingSoon" style={{ textDecoration: 'underline' }}>
                  {t('learnMore')}
                </a>
              </strong>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
