// src/components/ProductDetail/ProductDetail.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  deleteDoc,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import Header from '../Header';
import Footer from '../Footer';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/utils';
import { useCurrency } from '../../context/CurrencyContext';

import fumartLogo from '../../assets/fumart-m-t-bg.png';
import SoldByIcon from '../../assets/Icons/sold-by.png';
import prop65WarningIcon from '../../assets/Icons/warningIcon.png';

import './ProductDetail.scss';

// Reuse ProductModal components
import ImageCarousel from '../ProductModal/ImageCarousel';
import ThumbnailRow from '../ProductModal/ThumbnailRow';
import PriceBlock from '../ProductModal/PriceBlock';
import QuantityControl from '../ProductModal/QuantityControl';
import SellersStrip from '../ProductModal/SellersStrip';
import MediaLinks from '../ProductModal/MediaLinks';
import ReviewSection from '../ProductModal/ReviewSection';
import PriceHistory from '../ProductModal/PriceHistory';
import SuggestionsSection from '../ProductModal/SuggestionsSection';
import VariationSwatches from '../ProductModal/VariationSwatches';

// ------- constants / helpers -------
const UNKNOWN_ORIGIN_KEY = '__UNKNOWN_ORIGIN__';
const ORIGIN_OPTIONS = [
  'Taiwan', 'Japan', 'South Korea', 'China', 'Hong Kong', 'Macau',
  'Singapore', 'Thailand', 'USA', 'Mexico', 'Malaysia', 'Vietnam',
  'Indonesia', 'Philippines', 'India', 'UK', 'EU', 'Canada', 'Australia',
  'New Zealand', 'Other', UNKNOWN_ORIGIN_KEY,
];

// derive storage path from download URL (best effort)
const pathFromDownloadUrl = (url) => {
  try {
    const u = new URL(url);
    const enc = u.pathname.split('/o/')[1]?.split('?')[0];
    return enc ? decodeURIComponent(enc) : null;
  } catch { return null; }
};

// small util(s)
const toNumberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { selectedCurrency, formatPrice } = useCurrency(); 
  const { t } = useTranslation(['storefront']);

  const [roleDebug, setRoleDebug] = useState({ stage: 'init' });
  const [notFound, setNotFound] = useState(false);

  // auth/role
  const [userRole, setUserRole] = useState(location.state?.userRole || null);
  const isAdmin = userRole === 'admin';
  userRole === 'admin' && console.debug('ProductDetail: admin mode', roleDebug);

  useEffect(() => {
    // QA override: ?admin=1 or localStorage.forceAdmin="1"
    const params = new URLSearchParams(window.location.search);
    const forceAdmin = params.get('admin') === '1' || localStorage.getItem('forceAdmin') === '1';
    if (forceAdmin) {
      setUserRole('admin');
      setRoleDebug((d) => ({ ...d, override: 'query/localStorage' }));
      return;
    }
    

    const off = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUserRole(null);
          setRoleDebug({ stage: 'no-user' });
          return;
        }
        // custom claims first
        try {
          const token = await u.getIdTokenResult(true);
          const claimsRole = token?.claims?.userRole || null;
          if (claimsRole) {
            setUserRole(claimsRole);
            setRoleDebug({ stage: 'claims', uid: u.uid, userRole: claimsRole });
            return;
          }
        } catch {}
        // fallback: Firestore users/<uid>.role
        try {
          const userDoc = await getDoc(doc(firestore, 'users', u.uid));
          const fsRole = userDoc.exists() ? (userDoc.data()?.userRole || null) : null;
          setUserRole(fsRole);
          setRoleDebug({ stage: 'firestore', uid: u.uid, userRole: fsRole, exists: userDoc.exists() });
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
    origin: '',
    description: '',
    createdAt: '',
    variationGroupId: '',
    variationOptionName: '',
    variationOptionValue: '',
    isProp65: false,
  });

  const [siblingVariations, setSiblingVariations] = useState([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);

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
      setNotFound(false);
      try {
        const ref = doc(firestore, 'products', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setProduct(null);
          setNotFound(true);
          return;
        }

        const data = snap.data();
        const prod = { id: snap.id, ...data };
        setProduct(prod);

        const createdDate = toDateSafe(prod.createdAt);
        setAdminForm({
          name: prod.name ?? '',
          subtitle: prod.subtitle ?? '',
          price: prod.price ?? '',
          priceDiscount: prod.priceDiscount ?? '',
          stockQuantity: prod.stockQuantity ?? '',
          category: prod.category ?? '',
          subCategory: prod.subCategory ?? '',
          brand: prod.brand ?? '',
          origin: prod.origin ?? '',
          description: prod.description ?? '',
          createdAt: toDatetimeLocalValue(createdDate),
          variationGroupId: prod.variationGroupId ?? '',
          variationOptionName: prod.variationOption?.name ?? '',
          variationOptionValue: prod.variationOption?.value ?? '',
          isProp65: prod.isProp65 ?? false,
        });

        setSelectedIndex(0);
        setThumbnailsLoading(true);
        setTimeout(() => setThumbnailsLoading(false), 500);
        requestAnimationFrame(() => {
          modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } catch (e) {
        console.error('Product fetch error:', e);
        setProduct(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
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

  // fetch "sibling" variations
  useEffect(() => {
    const fetchSiblingVariations = async () => {
      // If the product doesn't have a group, don't fetch anything
      if (!product?.variationGroupId) {
        setSiblingVariations([]);
        return;
      }

      setIsLoadingVariations(true);
      try {
        // Query for all products with the same group ID
        const q = query(
          collection(firestore, 'products'),
          where('variationGroupId', '==', product.variationGroupId)
        );
        
        const querySnapshot = await getDocs(q);
        const siblings = [];
        querySnapshot.forEach((doc) => {
          // Add all products in the group, including the current one
          siblings.push({ id: doc.id, ...doc.data() });
        });

        // Sort them for a consistent order
        siblings.sort((a, b) => 
          (a.variationOption?.value || '').localeCompare(b.variationOption?.value || '')
        );
        
        setSiblingVariations(siblings);

      } catch (err) {
        console.error("Error fetching sibling variations:", err);
        setSiblingVariations([]);
      } finally {
        setIsLoadingVariations(false);
      }
    };

    // Only fetch if the product is loaded
    if (product) {
      fetchSiblingVariations();
    }
  }, [product?.id, product?.variationGroupId]); // Re-run if the main product changes

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

  // Convert Firestore Timestamp | string | number | Date -> Date | null
  const toDateSafe = (v) => {
    if (!v) return null;
    try {
      if (v instanceof Date) return v;
      if (v?.toDate) return v.toDate();                // Firestore Timestamp
      if (typeof v === 'number') return new Date(v);   // epoch ms
      if (typeof v === 'string') {
        // ISO or parseable string
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
    } catch {}
    return null;
  };

  // Format a Date for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
  const toDatetimeLocalValue = (d) => {
    if (!d) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  // Human-readable created date for view mode
  const toPrettyDateTime = (d) => {
    if (!d) return '—';
    try {
      return d.toLocaleString();
    } catch {
      return d.toString();
    }
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
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } }); // optional: remember previous page
      return;
    }

    if (!p || isSoldOut) return;

    const safe = {
      ...p,
      createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : p.createdAt,
      addedQuantity: q || 1,
    };
    dispatch(addToCart(safe));
    navigate('/checkout');
  };

  // ---------- ADMIN: image handlers (now safely inside component) ----------
  const storage = getStorage();

  const handleUploadImages = useCallback(async (fileList) => {
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
  }, [product, storage]);

  const handleDeleteImage = useCallback(async (imageUrl) => {
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
  }, [product, storage]);

  const handleReorderImages = useCallback(async (newImages) => {
    if (!product) return;
    try {
      // 🔥 Update Firestore with new image order
      const ref = doc(firestore, 'products', product.id);
      await updateDoc(ref, { images: newImages });

      // ✅ Update local state immediately for UI sync
      setProduct((prev) => (prev ? { ...prev, images: newImages } : prev));

      console.log('✅ Image order updated in Firestore:', newImages);
    } catch (err) {
      console.error('❌ Failed to update image order:', err);
    }
  }, [product]);

  // ---------- ADMIN: delete ----------
  const handleDeleteProduct = async () => {
    if (!product) return;
    
    // 1. Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete this product? This will remove it from the store and all sellers. This action cannot be undone.'
    );
    if (!confirmed) return;

    setSaving(true);

    try {
      // 2. Remove product entry from "selling" map in Users collection
      if (usernames && usernames.length > 0) {
        const sellerCleanupPromises = usernames.map(async (uName) => {
          try {
            // Find user by username
            const q = query(collection(firestore, 'users'), where('username', '==', uName));
            const snap = await getDocs(q);

            const batchUpdates = [];
            snap.forEach((userSnapshot) => {
              const userRef = doc(firestore, 'users', userSnapshot.id);
              // Use deleteField() to remove the specific key (product ID) from the 'selling' map
              batchUpdates.push(
                updateDoc(userRef, {
                  [`selling.${product.id}`]: deleteField()
                })
              );
            });
            await Promise.all(batchUpdates);
          } catch (err) {
            console.error(`Failed to cleanup user ${uName}`, err);
          }
        });

        await Promise.all(sellerCleanupPromises);
      }

      // 3. Delete the Product Document
      await deleteDoc(doc(firestore, 'products', product.id));

      // 4. Navigate away (e.g., to home or previous page)
      navigate('/', { replace: true });

    } catch (e) {
      console.error('Delete product failed:', e);
      alert('Error deleting product. See console for details.');
      setSaving(false);
    }
  };
  
  // ---------- ADMIN: edit/save ----------
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
      origin: product.origin ?? '',
      description: product.description ?? '',
      createdAt: toDatetimeLocalValue(toDateSafe(product.createdAt)),
      variationGroupId: product.variationGroupId ?? '',
      variationOptionName: product.variationOption?.name ?? '',
      variationOptionValue: product.variationOption?.value ?? '',
      isProp65: product.isProp65 ?? false,
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
      const cleanedOrigin = (adminForm.origin || '').trim();
      const normalizedOrigin = cleanedOrigin === UNKNOWN_ORIGIN_KEY ? '' : cleanedOrigin;

      const updates = {
        name: String(adminForm.name ?? '').trim(),
        subtitle: String(adminForm.subtitle ?? ''),
        price: toNumberOrZero(adminForm.price),
        priceDiscount: toNumberOrZero(adminForm.priceDiscount),
        stockQuantity: toNumberOrZero(adminForm.stockQuantity),
        category: String(adminForm.category ?? '').trim(),
        subCategory: String(adminForm.subCategory ?? '').trim(),
        brand: String(adminForm.brand ?? '').trim(),
        origin: normalizedOrigin, // NEW
        description: String(adminForm.description ?? ''),
        // --- ADDED / UPDATED ---
        variationGroupId: String(adminForm.variationGroupId ?? '').trim(),
        variationOption: {
          name: String(adminForm.variationOptionName ?? '').trim(),
          value: String(adminForm.variationOptionValue ?? '').trim(),
        },
        isProp65: Boolean(adminForm.isProp65),
        // --- END ---
      };

      if (adminForm.createdAtISO && !Number.isNaN(new Date(adminForm.createdAtISO).getTime())) {
        updates.createdAt = Timestamp.fromDate(new Date(adminForm.createdAtISO));
      }


      // Remove undefined/NaN, keep zeros
      Object.keys(updates).forEach((k) => {
        if (updates[k] === undefined || updates[k] === null) delete updates[k];
      });

      const ref = doc(firestore, 'products', product.id);
      await updateDoc(ref, updates);

      // optimistic UI
      setProduct((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
      setEditMode(false);
    } catch (e) {
      console.error('Admin save failed:', e);
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

  const normalizeOriginForChip = (origin = '') => {
    const raw = String(origin).trim();
    if (!raw) return 'Unknown';

    // Check on the un-sanitized lowercase string first (handles dots)
    const s2 = raw.toLowerCase();

    const isUS =
      /\busa\b/.test(s2) ||                      // "USA"
      /\bu\.?\s*s\.?\b/.test(s2) ||              // "US" / "U.S." / "U S"
      /\bu\.?\s*s\.?\s*a\.?\b/.test(s2) ||       // "U.S.A." / "U S A"
      /\bunited\s+states(\s+of\s+america)?\b/.test(s2);  // "United States" / "United States of America"

    return isUS ? 'USA' : raw;
  };

  
  const originChip = useMemo(() => {
    return normalizeOriginForChip(product?.origin);
  }, [product?.origin]);


  // Canonicalize origin text to a stable key we can translate (US, UK, EU, Taiwan, HongKong, etc.)
  const ORIGIN_SYNONYM_MAP = new Map([
    // US
    ['usa', 'US'], ['us', 'US'], ['united states', 'US'], ['united states of america', 'US'],
    ['u s a', 'US'], ['u s', 'US'], ['u.s.a', 'US'], ['u.s', 'US'],

    // UK
    ['uk', 'UK'], ['u k', 'UK'], ['u.k.', 'UK'], ['united kingdom', 'UK'],
    ['great britain', 'UK'], ['england', 'UK'],

    // EU
    ['eu', 'EU'], ['e u', 'EU'], ['e.u.', 'EU'], ['european union', 'EU'],

    // UAE
    ['uae', 'UAE'], ['u a e', 'UAE'], ['united arab emirates', 'UAE'],

    // Korea
    ['korea', 'Korea'], ['south korea', 'Korea'], ['republic of korea', 'Korea'],

    // Regions/places that often appear with spaces
    ['hong kong', 'HongKong'],
    ['macau', 'Macau'], ['macao', 'Macau'],
    ['new zealand', 'NewZealand'],

    // Common straightforward country names
    ['taiwan', 'Taiwan'],
    ['japan', 'Japan'],
    ['china', 'China'],
    ['singapore', 'Singapore'],
    ['thailand', 'Thailand'],
    ['mexico', 'Mexico'],
    ['malaysia', 'Malaysia'],
    ['vietnam', 'Vietnam'],
    ['indonesia', 'Indonesia'],
    ['philippines', 'Philippines'],
    ['india', 'India'],
    ['canada', 'Canada'],
    ['australia', 'Australia'],
  ]);

  const canonicalOriginKey = (origin = '') => {
    const s = String(origin || '').trim().toLowerCase();
    if (!s) return 'Unknown';

    // normalize dots and excess whitespace so "U.S.A.", "U S A" map cleanly
    const norm = s.replace(/\./g, '').replace(/\s+/g, ' ').trim();
    return ORIGIN_SYNONYM_MAP.get(norm) || origin.trim();
  };

  // Returns a translated label for the origin, falling back to originChip
  const useLocalizedOrigin = (originRaw, originFallback, t) => {
    return useMemo(() => {
      const key = canonicalOriginKey(originRaw);
      // Try countries.<KEY>; if missing, show the fallback chip (your normalized string)
      return t(`countries.${key}`, { defaultValue: originFallback || 'Unknown' });
    }, [originRaw, originFallback, t]);
  };

  const localizedOrigin = useLocalizedOrigin(product?.origin, originChip, t);


  const fetchSellerPreview = async (username) => {
    try {
      let snap = await getDocs(query(collection(firestore, 'users'), where('username', '==', username)));
      let docu = snap.docs[0];
      if (!docu) {
        const snap2 = await getDocs(query(collection(firestore, 'users'), where('userName', '==', username)));
        docu = snap2.docs[0];
      }
      if (!docu) return null;

      const u = docu.data() || {};
      return {
        avatar: u.avatar || u.photoURL || '',
        bio: u.bio || '',
        location: u.location || '',
        rating: (typeof u.rating === 'number') ? u.rating : undefined,
        sales: (typeof u.sales === 'number') ? u.sales : undefined,
      };
    } catch (e) {
      console.error('getSellerPreview failed:', e);
      return null;
    }
  };
    const [isDarkMode, setIsDarkMode] = useState(() =>
    localStorage.getItem('preferredTheme') === 'dark'
  );
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('preferredTheme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', next);
      return next;
    });
  };
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const brandParam = encodeURIComponent(product?.brand || '');


  if (loading) return null;

  // no matching product id
  if (notFound) {
    return (
      <div className="pd-wrap">
        <Header hasSearchBar mainPageHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        <main className="pd-error-container" role="main">
          <div className="pd-error-page">
            <div className="pd-error-emoji" aria-hidden>
              
            </div>
            <h1 className="pd-error-title">
              {t('productNotFoundTitle', 'Product not found')}
            </h1>
            <p className="pd-error-text">
              {t(
                'productNotFoundBody',
                'The item you’re looking for doesn’t exist or may have been removed.'
              )}
            </p>
            <div className="pd-error-actions">

              <button
                className="pd-error-btn primary"
                onClick={() => navigate('/search?term=viewall')}
              >
                {t('browseAllProducts', 'Browse All Products')}
              </button>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="pd-wrap">
      <Header hasSearchBar mainPageHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}/>

      {/* top category bar */}
      <div className="top-category-bar">
        <div className="top-category-bar-wrap">
          <span
            className="top-category-bar-link"
            onClick={() =>
              navigate(`/search?term=viewall&cat=${encodeURIComponent(product.category)}`)
            }
          >
            {t(product.category)}
          </span>
          <span className="top-category-bar-sep">＞</span>
          <span
            className="top-category-bar-link"
            onClick={() =>
              navigate(`/search?term=viewall&cat=${encodeURIComponent(product.category)}&sub=${encodeURIComponent(product.subCategory)}`)
            }
          >
            {t(product.subCategory)}
          </span>
        </div>
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
              <div className="pd-btn-inner-wrap-top">
                <div className="pd-title-price-wrap">
                  <div className="pd-name-title-wrap">
                    <div className="pd-name-stack">
                      {!editMode ? (
                        <h2 className="pd-product-name">{product.name}</h2>
                      ) : (
                        <div className="pd-admin-pricebox">
                          <label className="pd-admin-field">
                            <span>Product name</span>
                          <input
                            className="pd-admin-input name"
                            value={adminForm.name}
                            onChange={(e) => setAdminForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Product name"
                          />
                          </label>
                        </div>
                      )}

                      {!editMode ? (
                        <>
                          <div className="pd-subtitle">{product.subtitle}</div>
                          {/* NEW: Origin read-only display */}

                        </>
                      ) : (
                        <div className="pd-admin-pricebox">
                          <label className="pd-admin-field">
                            <span>Subtitle</span>
                          <input
                            className="pd-admin-input subtitle"
                            value={adminForm.subtitle}
                            onChange={(e) => setAdminForm((s) => ({ ...s, subtitle: e.target.value }))}
                            placeholder="Subtitle"
                          />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  {!editMode ? (
                      <PriceBlock
                        isSoldOut={isSoldOut}
                        isOnSale={isOnSale}
                        price={formatPrice(Number(price.toFixed(2)))}
                        finalPrice={formatPrice(Number(finalPrice.toFixed(2)))}
                        selectedCurrency={selectedCurrency}
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

                      </div>
                    )}
                </div>

                {!!resolvedSellers.length && (
                <SellersStrip
                  resolvedSellers={resolvedSellers}
                  SoldByIcon={SoldByIcon}
                  navigate={navigate}
                  getSellerPreview={fetchSellerPreview}
                />
                )}

                <ThumbnailRow
                  loading={thumbnailsLoading}
                  images={product.images || []}
                  activeThumbnail={product.images?.[selectedIndex]}
                  onThumbClick={(idx) => setSelectedIndex(idx)}
                  isAdmin={isAdmin}
                  isEditing={editMode}
                  onUploadImages={handleUploadImages}
                  onDeleteImage={handleDeleteImage}
                  onReorderImages={handleReorderImages}
                />

            {/* --- END: ADD VARIATION SWATCHES --- */}

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

                {/* Category / Subcategory / Brand / Origin (editable in admin) */}
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
                    <label className="pd-admin-field">
                    <span>Variation Group ID</span>
                    <input
                      className="pd-admin-input"
                      value={adminForm.variationGroupId}
                      onChange={(e) => setAdminForm((s) => ({ ...s, variationGroupId: e.target.value }))}
                      placeholder="e.g., liquid-death-beverages"
                    />
                  </label>
                  <label className="pd-admin-field">
                    <span>Variation Option Name</span>
                    <input
                      className="pd-admin-input"
                      value={adminForm.variationOptionName}
                      onChange={(e) => setAdminForm((s) => ({ ...s, variationOptionName: e.target.value }))}
                      placeholder="e.g., Flavor"
                    />
                  </label>
                  <label className="pd-admin-field">
                    <span>Variation Option Value</span>
                    <input
                      className="pd-admin-input"
                      value={adminForm.variationOptionValue}
                      onChange={(e) => setAdminForm((s) => ({ ...s, variationOptionValue: e.target.value }))}
                      placeholder="e.g., Killer Cola"
                    />
                  </label>
                    {/* NEW: Origin select/input */}
                    <label className="pd-admin-field">
                      <span>Origin</span>
                      <div className="pd-origin-edit">
                        <select
                          className="pd-admin-input"
                          value={ORIGIN_OPTIONS.includes(adminForm.origin) ? adminForm.origin : (adminForm.origin ? 'Other' : UNKNOWN_ORIGIN_KEY)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === 'Other') {
                              // keep current custom text in the free-input below
                              setAdminForm((s) => ({ ...s, origin: s.origin || '' }));
                            } else if (v === UNKNOWN_ORIGIN_KEY) {
                              setAdminForm((s) => ({ ...s, origin: '' }));
                            } else {
                              setAdminForm((s) => ({ ...s, origin: v }));
                            }
                          }}
                        >
                          {ORIGIN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === UNKNOWN_ORIGIN_KEY ? 'Unknown' : opt}
                            </option>
                          ))}
                        </select>
                        {/* Show a free-text box when "Other" is selected or when current value is custom */}
                        {(!ORIGIN_OPTIONS.includes(adminForm.origin) && adminForm.origin !== '') || (ORIGIN_OPTIONS.includes(adminForm.origin) && adminForm.origin === 'Other') ? (
                          <input
                            className="pd-admin-input"
                            placeholder="Enter custom origin…"
                            value={adminForm.origin === 'Other' ? '' : (adminForm.origin || '')}
                            onChange={(e) => setAdminForm((s) => ({ ...s, origin: e.target.value }))}
                            style={{ marginTop: 6 }}
                          />
                        ) : null}
                      </div>
                    </label>
                    {/* NEW: Created At */}
                    <label className="pd-admin-field">
                      <span>Stock</span>
                      <input
                        type="number"
                        className="pd-admin-input num"
                        value={adminForm.stockQuantity}
                        onChange={(e) => setAdminForm((s) => ({ ...s, stockQuantity: e.target.value }))}
                      />
                    </label>
                    <label className="pd-admin-field">
                      <span>Created At</span>
                      <input
                        type="datetime-local"
                        className="pd-admin-input"
                        value={adminForm.createdAt}
                        onChange={(e) =>
                          setAdminForm((s) => ({ ...s, createdAtISO: e.target.value }))
                        }
                        title="Set the product creation timestamp"
                      />
                      {/* Optional hint line */}
                      {/* <small style={{ color:'#777' }}>Local time; saved as Firestore Timestamp.</small> */}
                    </label>

                    <label className="pd-admin-field">
                      <span>CA Prop 65 Warning</span>
                      <div className="pd-origin-edit">
                        <select
                          className="pd-admin-input"
                          value={adminForm.isProp65 ? 'true' : 'false'}
                          onChange={(e) => setAdminForm((s) => ({ ...s, isProp65: e.target.value === 'true' }))}
                        >
                          <option value="false">False</option>
                          <option value="true">True ⚠️</option>
                        </select>
                      </div>
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
                        {/* --- NEW DELETE BUTTON --- */}
                        <button 
                          className="pd-admin-btn" 
                          onClick={handleDeleteProduct} 
                          disabled={saving}
                          style={{ backgroundColor: '#ff4d4f', color: '#fff', marginRight: 'auto' }} // Inline style for danger look
                        >
                          {saving ? 'Deleting...' : 'Delete Product'}
                        </button>
                        {/* ------------------------- */}

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
            <div className="pd-origin-row">
              <span className="pd-origin-label">{t('productOf')}</span>
              <span className="pd-origin-chip">{localizedOrigin}</span>
            </div>
            {/* {toPrettyDateTime(toDateSafe(product?.createdAt))} */}
            {/* <div className="pd-brand-row">
              <span className="pd-brand-label">by</span>
              <span className="pd-brand-chip">
                {product.brand && product.brand.trim().length
                  ? product.brand
                  : 'Unknown'}
              </span>
            </div> */}
          </div>
        </div>

        {/* {!editMode && (
          <VariationSwatches
            product={product}
            siblingVariations={siblingVariations}
            isLoading={isLoadingVariations}
            onSelect={(v) => {
              if (v.id !== product.id) navigate(`/product/${v.id}`);
            }}
          />
        )} */}


        {/* Description (admin editable) */}
        <div className="product-description">
          <div className="description-title">{t('description')}</div>


          {!editMode ? (
            <p className="description-text">
              {product.description ?? t('noDescription')}
            </p>
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


        {/* MediaLinks */}
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
        {/* Suggestions (category) */}
        <SuggestionsSection
          title={t('youMayAlsoLike')}
          items={suggestions}
          loading={loadingSuggestions}
          listRef={suggestionsRef}
          skeletonCount={16}
          t={t}
          onItemClick={(item) => {
            navigate(`/product/${item.id}`);
            requestAnimationFrame(() => {
              suggestionsRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              modalRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
              window.scrollTo?.({ top: 0, behavior: 'smooth' });
            });
          }}
        />

        <ReviewSection
          productId={product.id}
          productName={product.name}
          productSubtitle={product.subtitle}
        />

        {/* More from brand */}
        {(product.brand && (loadingBrand || brandProducts.length >= 0)) && (
          <SuggestionsSection
            title={
              product.brand
                ? t('moreFromBrand', { brand: product.brand })
                : t('moreFromBrandGeneric')
            }
            brand={product.brand}
            items={brandProducts}
            loading={loadingBrand}
            listRef={brandRef}
            skeletonCount={8}
            wrapperClassName="brand-suggestions"
            t={t}
            emptyKind="brand"
            emptyBrandName={product.brand}
            onItemClick={(item) => {
              navigate(`/product/${item.id}`);
              requestAnimationFrame(() => {
                brandRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                modalRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
                window.scrollTo?.({ top: 0, behavior: 'smooth' });
              });
            }}
            onViewAll={() => {
              setFadeIn(false);
              setTimeout(() => {
                navigate(`/search?term=viewall&brands=${brandParam}`, { replace: true });
                onClose?.();
              }, 200);
            
            }}
          />
        )}

        {/* Price history */}
        {/* {'priceHistory' in (product ?? {}) && (
          <PriceHistory
            productName={product.name}
            data={Array.isArray(product.priceHistory) ? product.priceHistory : []}
            isAdmin={userRole === 'admin'}
          />
        )} */}



        {/* Disclaimer */}
        <div className="product-disclaimer">
          {(product.isProp65 && !editMode) && (
            <div className="pd-prop65-warning">
              <div className="pd-prop65-icon">
                <img src={prop65WarningIcon} alt="Prop 65 Warning Icon" />
              </div>
              <div className="pd-prop65-content">
                <strong>{t('prop65.title')}</strong>
                <p>
                  {t('prop65.body')} <a href="https://www.P65Warnings.ca.gov/food" target="_blank" rel="noreferrer">www.P65Warnings.ca.gov/food</a>.
                </p>
              </div>
            </div>
          )}
          <div className="product-disclaimer-text">
            <p>{t('productDisclaimerPart1')}</p>
            <p>
              {t('productDisclaimerPart2')}{' '}
              <strong>
                <a href="/ComingSoon"  className='learn-more' style={{ textDecoration: 'underline' }}>
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
