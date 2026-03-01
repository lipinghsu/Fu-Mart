// src/components/ProductModal/ProductModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp, // <-- ADDED
} from 'firebase/firestore';
import { firestore, auth } from '../../firebase/utils';
import { onAuthStateChanged } from 'firebase/auth';
import { useCurrency } from '../../context/CurrencyContext';

import ProductCard from '../ProductCard';
import ReviewSection from './ReviewSection';
import './ProductModal.scss';

import closeImage from '../../assets/Icons/closeImage.png';
import fumartLogo from '../../assets/fumart-m-t-bg.png';
import fumartStamp from '../../assets/fumart-stamp4.png';

import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import arrowIcon from '../../assets/Icons/arrowIcon2.png';
import arrowIcon2 from '../../assets/Icons/arrowIcon600-128px.png';
import SoldByIcon from '../../assets/Icons/sold-by.png';
import prop65WarningIcon from '../../assets/Icons/warningIcon.png';

import VariationSwatches from './VariationSwatches';
import ImageCarousel from './ImageCarousel';
import ThumbnailRow from './ThumbnailRow';
import PriceBlock from './PriceBlock';
import QuantityControl from './QuantityControl';
import ArrowNav from './ArrowNav';
import SellersStrip from './SellersStrip';
import MediaLinks from './MediaLinks';
import PriceHistory from './PriceHistory';
import SuggestionsSection from './SuggestionsSection';
import TranslateDescription from '../TranslateDescription';

const UNKNOWN_ORIGIN_KEY = '__UNKNOWN_ORIGIN__';
const ORIGIN_OPTIONS = [
  'Taiwan', 'Japan', 'South Korea', 'China', 'Hong Kong', 'Macau',
  'Singapore', 'Thailand', 'USA', 'Mexico', 'Malaysia', 'Vietnam',
  'Indonesia', 'Philippines', 'India', 'UK', 'EU', 'Canada', 'Australia',
  'New Zealand', 'Other', UNKNOWN_ORIGIN_KEY,
];

// small util(s)
const toNumberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

/* ---------- shared helpers ---------- */
const toISO = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return String(d);
  }
};

const ProductModal = ({
  product,
  onClose,
  onBuyNow,
  onSelectSuggested,
  isDarkMode,
  allProducts,
  setSelectedProduct
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['storefront']);
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCurrency, formatPrice } = useCurrency(); 

  if (!product) return null;

  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const brandRef = useRef(null);

  const headerTriggerRef = useRef(null);
  const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false);

  useEffect(() => {
      const modal = modalRef.current;
      if (!modal) return;

      // This function checks if the trigger element is out of view
      const handleScroll = () => {
        const topbar = modal.querySelector('.modal-topbar');
        const trigger = headerTriggerRef.current;
        
        if (!topbar || !trigger) {
          // Elements might not be rendered yet
          return; 
        }

        const topbarRect = topbar.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();

        // Show sticky header when the trigger's *bottom edge* scrolls
        // *above* the topbar's *bottom edge*.
        const shouldBeVisible = triggerRect.bottom < topbarRect.bottom;
        
        // Only update state if it changes to avoid re-renders
        setIsStickyHeaderVisible(prev => prev === shouldBeVisible ? prev : shouldBeVisible);
      };

      modal.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Run once on mount

      return () => modal.removeEventListener('scroll', handleScroll);
    }, [product.id]); // Re-run this effect if the product changes


  // auth/role + user identity for priceHistory records
  const [userRole, setUserRole] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUid, setCurrentUid] = useState('');
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid || '');
        try {
          const snap = await getDoc(doc(firestore, 'users', user.uid));
          if (snap.exists()) {
            const udata = snap.data() || {};
            setUserRole(udata.role || null);
            setCurrentUsername((udata.username || udata.displayName || '').toString().replace(/^@/, ''));
          } else {
            setUserRole(null);
            setCurrentUsername('');
          }
        } catch (e) {
          console.error('Error loading user role:', e);
          setUserRole(null);
          setCurrentUsername('');
        }
      } else {
        setUserRole(null);
        setCurrentUsername('');
        setCurrentUid('');
      }
    });
    return () => unsubscribe();
  }, []);

  const [loadingBrand, setLoadingBrand] = useState(true);
  const [brandProducts, setBrandProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [fadeIn, setFadeIn] = useState(false);
  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [activeThumbnail, setActiveThumbnail] = useState(product.images?.[0]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 870 : false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);
  const isAdmin = userRole === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // --- UPDATED STATE ---
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

  const cartItem = cartItems.find((item) => item.id === product.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  const stockQty = Number(product?.stockQuantity ?? 0);
  const isSoldOut = stockQty <= 0;

  const price = typeof product?.price === 'number' ? product.price : Number(product?.price ?? 0);
  const discount = Number(product?.priceDiscount ?? 0);
  const isOnSale = !isSoldOut && price > 0 && discount > 0;
  const finalPrice = isOnSale ? Math.max(price - discount, 0) : price;

  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

  

  // SELLERS: derive usernames from product.sellBy then resolve display names
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
    document.body.style.overflow = product ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [product]);


  // --- variation support ---
const [siblingVariations, setSiblingVariations] = useState([]);
const [isLoadingVariations, setIsLoadingVariations] = useState(false);

useEffect(() => {
  const fetchSiblingVariations = async () => {
    if (!product?.variationGroupId) {
      setSiblingVariations([]);
      return;
    }
    setIsLoadingVariations(true);
    try {
      const q = query(
        collection(firestore, 'products'),
        where('variationGroupId', '==', product.variationGroupId)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((docu) => {
        list.push({ id: docu.id, ...docu.data() });
      });
      list.sort((a, b) =>
        (a.variationOption?.value || '').localeCompare(b.variationOption?.value || '')
      );
      setSiblingVariations(list);
    } catch (e) {
      console.error('Error fetching variations:', e);
      setSiblingVariations([]);
    } finally {
      setIsLoadingVariations(false);
    }
  };

  if (product) fetchSiblingVariations();
}, [product?.id, product?.variationGroupId]);


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
          const q = query(collection(firestore, 'users'), where('username', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach((docu) => {
            const data = docu.data();
            const u = (data?.username || '').toString().replace(/^@/, '');
            const pretty = (data?.name || data?.displayName || '').toString().trim();
            if (u) map[u] = pretty || u;
          });
        } catch (err) {
          console.error('Error fetching seller names:', err);
          chunk.forEach((u) => { if (!map[u]) map[u] = u; });
        }
      }

      usernames.forEach((u) => { if (!map[u]) map[u] = u; });

      if (!cancelled) setSellerNameMap(map);
    }

    fetchDisplayNames();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernames.join(',')]);

  const resolvedSellers = useMemo(
    () => usernames.map((u) => ({ username: u, name: sellerNameMap[u] || u })),
    [usernames, sellerNameMap]
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 870);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // keyboard product navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!allProducts || !product) return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      if (isTyping || e.repeat) return;

      const productIdx = allProducts.findIndex((p) => p.id === product.id);
      if (productIdx < 0) return;

      if (e.key === 'ArrowLeft' && productIdx > 0) {
        e.preventDefault();
        setSelectedProduct(allProducts[productIdx - 1]);
      } else if (e.key === 'ArrowRight' && productIdx < allProducts.length - 1) {
        e.preventDefault();
        setSelectedProduct(allProducts[productIdx + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product?.id, allProducts, setSelectedProduct]);

  const fetchSellerPreview = async (username) => {
    try {
      // try `username`
      let snap = await getDocs(query(collection(firestore, 'users'), where('username', '==', username)));
      let docu = snap.docs[0];

      // fallback: some docs use `userName`
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
  
  // sync quantity with cart
  useEffect(() => {
    setQuantity(currentCartQuantity > 0 ? currentCartQuantity : 1);
  }, [currentCartQuantity, product.id]);

  // reset on product change
  useEffect(() => {
    setSelectedIndex(0);
    setMainImage(product.images?.[0] || null);
    setActiveThumbnail(product.images?.[0] || null);

    setThumbnailsLoading(true);
    const timer = setTimeout(() => setThumbnailsLoading(false), 500);
    if (modalRef.current) {
      requestAnimationFrame(() => {
        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    setFadeIn(true);

    fetchSuggestedProducts();
    fetchBrandProducts();
    
    // --- NEW ---
    // If edit mode is on, cancel it to reset the form
    // or repopulate it with the new product's data
    if (editMode) {
      startEdit(); // This will now repopulate with the new product
    }
    // --- END NEW ---

    return () => clearTimeout(timer);
  }, [product?.id]); // Note: `editMode` and `startEdit` are not dependencies

  const fetchBrandProducts = async () => {
    try {
      setLoadingBrand(true);
      if (!product?.brand) {
        setBrandProducts([]);
        return;
      }
      const q = query(collection(firestore, 'products'), where('brand', '==', product.brand));
      const snap = await getDocs(q);
      const items = [];
      snap.forEach((docu) => {
        const data = docu.data();
        if (docu.id !== product.id) items.push({ id: docu.id, ...data });
      });

      const sameSub = items.filter((i) => i.subCategory === product.subCategory);
      const diffSub = items.filter((i) => i.subCategory !== product.subCategory);
      const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
      const combined = [...shuffle(sameSub), ...shuffle(diffSub)].slice(0, 8);
      setBrandProducts(combined);
    } catch (e) {
      console.error('Error fetching brand products:', e);
      setBrandProducts([]);
    } finally {
      setLoadingBrand(false);
    }
  };

  const fetchSuggestedProducts = async () => {
    try {
      setLoadingSuggestions(true);
      const q = query(collection(firestore, 'products'), where('category', '==', product.category));
      const querySnapshot = await getDocs(q);

      const allSuggestions = [];
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        if (docu.id !== product.id) {
          allSuggestions.push({ id: docu.id, ...data });
        }
      });

      const sameSub = allSuggestions.filter((item) => item.subCategory === product.subCategory);
      const diffSub = allSuggestions.filter((item) => item.subCategory !== product.subCategory);
      const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random());
      const combined = [...shuffleArray(sameSub), ...shuffleArray(diffSub)].slice(0, 8);
      setSuggestedProducts(combined);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleOverlayClick = () => {
    setFadeIn(false);
    setTimeout(() => {
      navigate(`${location.pathname}${location.search}`, { replace: true });
      onClose?.();
    }, 200);
  };

  const handleSelectQuantity = (value) => {
    if (isSoldOut) return;
    setQuantity(value);
    setDropdownOpen(false);
  };

  const handleUpdateQuantity = () => {
    const updatedProduct = {
      ...product,
      createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : product.createdAt,
      quantity
    };
    dispatch({ type: 'cart/updateItemQuantity', payload: updatedProduct });

    setShowUpdatedMessage(true);
    setTimeout(() => setShowUpdatedMessage(false), 2000);
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const safeProduct = {
      ...product,
      createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : product.createdAt,
      addedQuantity: quantity
    };
    dispatch(addToCart(safeProduct));

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 2000);
  };

  const buttons =
    isSoldOut ? (
      <button className="restock-btn" onClick={() => navigate(`/comingsoon`, { replace: false })}>
        {t('notifyMe') || 'Notify Me'}
      </button>
    ) : cartItem ? (
      currentCartQuantity > 0 && quantity !== currentCartQuantity ? (
        <>
          <button className="add-to-bag" onClick={handleUpdateQuantity}>{t('updateQuantity')}</button>
          <button className="buy-now" onClick={() => handleBuyNow(product, quantity)}>
            {t('buyNow')}
          </button>
        </>
      ) : null
    ) : (
      <>
        <button className="add-to-bag" onClick={handleAddToCart}>
          {t('addToBag')}
        </button>
        <button className="buy-now" onClick={() => handleBuyNow(product, quantity)}>
          {t('buyNow')}
        </button>
      </>
    );

  const currentProductIndex = useMemo(() => {
    if (!allProducts?.length || !product?.id) return -1;
    return allProducts.findIndex((p) => p.id === product.id);
  }, [allProducts, product?.id]);

  const goPrevProduct = () => {
    const n = allProducts?.length ?? 0;
    if (n <= 0 || currentProductIndex < 0) return;
    const nextIdx = (currentProductIndex - 1 + n) % n;
    setSelectedProduct(allProducts[nextIdx]);
  };

  const goNextProduct = () => {
    const n = allProducts?.length ?? 0;
    if (n <= 0 || currentProductIndex < 0) return;
    const nextIdx = (currentProductIndex + 1) % n;
    setSelectedProduct(allProducts[nextIdx]);
  };

  /* ---------------------- PriceHistory admin handlers ---------------------- */
  const priceHistoryRaw = Array.isArray(product.priceHistory) ? product.priceHistory : [];

  const persistPriceHistory = async (next) => {
    // normalize + sort + enrich (defaults)
    const cleaned = next
      .map((p) => ({
        currency: p.currency || 'USD',
        date: toISO(p.date),
        price: Number(p.price),
        quantity: Number(p.quantity ?? 1),
        soldBy: (p.soldBy || currentUsername || 'system').toString(),
        soldTo: p.soldTo || currentUid || '',
        time: p.time || new Date().toISOString(),
      }))
      .filter((p) => p.date && !Number.isNaN(p.price))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    try {
      await updateDoc(doc(firestore, 'products', product.id), { priceHistory: cleaned });
    } catch (err) {
      console.error('Failed to save priceHistory:', err);
      throw err;
    }

    // update local UI
    setSelectedProduct?.({ ...product, priceHistory: cleaned });
  };

  // record: { date, price } from child. Parent enriches with currency/quantity/soldBy/soldTo/time.
  const handleEditPoint = async (record) => {
    const dateISO = toISO(record.date);
    const next = [...priceHistoryRaw];
    const i = next.findIndex((p) => toISO(p.date) === dateISO);

    const base = {
      currency: 'USD',
      date: dateISO,
      price: Number(record.price),
      quantity: 1,
      soldBy: currentUsername || 'system',
      soldTo: currentUid || '',
      time: new Date().toISOString(),
    };

    if (i >= 0) {
      // merge existing (preserve past metadata if you prefer)
      next[i] = { ...next[i], ...base, price: base.price, date: dateISO };
    } else {
      // editing a filled day -> create raw point
      next.push(base);
    }

    await persistPriceHistory(next);
  };

  const handleAddPoint = async (record) => {
    const dateISO = toISO(record.date || new Date());
    const base = {
      currency: 'USD',
      date: dateISO,
      price: Number(record.price),
      quantity: 1,
      soldBy: currentUsername || 'system',
      soldTo: currentUid || '',
      time: new Date().toISOString(),
    };
    const next = [...priceHistoryRaw, base];
    await persistPriceHistory(next);
  };

  // ---------- ADMIN: Image Management ----------
  const handleUploadImages = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f && f.type.startsWith('image/'));
    if (!files.length) return;

    const uploaded = [];
    const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();

    for (const f of files) {
      const key = `${Date.now()}-${f.name.replace(/\s+/g, '_')}`;
      const fullPath = `products/${product.id}/${key}`;
      const sref = storageRef(storage, fullPath);
      await uploadBytes(sref, f);
      const url = await getDownloadURL(sref);
      uploaded.push(url);
    }

    const newImages = [...(product.images || []), ...uploaded];
    await updateDoc(doc(firestore, 'products', product.id), { images: newImages });
    setSelectedProduct?.({ ...product, images: newImages });
  };

  const handleDeleteImage = async (imageUrl) => {
    const newImages = product.images.filter((url) => url !== imageUrl);
    await updateDoc(doc(firestore, 'products', product.id), { images: newImages });
    setSelectedProduct?.({ ...product, images: newImages });
  };

  const handleReorderImages = async (newImages) => {
    await updateDoc(doc(firestore, 'products', product.id), { images: newImages });
    setSelectedProduct?.({ ...product, images: newImages });
  };

  // --- UPDATED startEdit ---
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

  // --- UPDATED saveEdit ---
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
        origin: normalizedOrigin,
        description: String(adminForm.description ?? ''),
        variationGroupId: String(adminForm.variationGroupId ?? '').trim(),
        variationOption: {
          name: String(adminForm.variationOptionName ?? '').trim(),
          value: String(adminForm.variationOptionValue ?? '').trim(),
        },
        isProp65: Boolean(adminForm.isProp65),
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

      // Update parent state
      setSelectedProduct?.({ ...product, ...updates });
      
      setEditMode(false);
    } catch (e) {
      console.error('Admin save failed:', e);
    } finally {
      setSaving(false);
    }
  };


  const normalizeOriginForChip = (origin = '') => {
    const raw = String(origin || '').trim();
    if (!raw) return 'Unknown';

    const s2 = raw.toLowerCase();
    const isUS =
      /\busa\b/.test(s2) ||                      // "USA"
      /\bu\.?\s*s\.?\b/.test(s2) ||              // "US", "U.S.", "U S"
      /\bu\.?\s*s\.?\s*a\.?\b/.test(s2) ||       // "U.S.A.", "U S A"
      /\bunited\s+states(\s+of\s+america)?\b/.test(s2); // "United States", "United States of America"

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

  // Close modal when ESC is pressed
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleOverlayClick(); // 👈 reuse your existing close logic
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleOverlayClick]);

  const brandParam = encodeURIComponent(product.brand || '');

  const handleBuyNow = (p, q) => {
    const currentUser = auth.currentUser;

    // 🔐 If not logged in, redirect to login
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // If product or sold out, do nothing
    if (!p || stockQty <= 0) return;

    const safe = {
      ...p,
      createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : p.createdAt,
      addedQuantity: q || 1,
    };

    dispatch(addToCart(safe));
    navigate('/checkout');
  };

  return (
    <div className={`product-modal-overlay ${fadeIn ? 'fade-in' : 'fade-out'}`} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`product-modal styled-modal`}
        onClick={(e) => e.stopPropagation()}
            >
        <div className={`modal-topbar ${isStickyHeaderVisible ? 'is-sticky' : ''}`}>
          <div className="close-button-modal" onClick={handleOverlayClick} aria-label="Close">
            <img src={closeImage} alt="close" />
          </div>

          {/* --- THIS IS THE NEW STICKY HEADER CONTENT --- */}
          {isStickyHeaderVisible && (
            <div className="sticky-header-content-wrapper">
              <img src={images[0]} alt={product.name} className="sticky-header-img" />
              <div className="sticky-header-info">
                <h3 className="sticky-header-name">{product.name}</h3>
                <span className="sticky-header-subtitle">{product.subtitle}</span>
              </div>
              <div className="sticky-header-actions">
                <span className="sticky-header-price">
                  <span className="price">
                    {formatPrice(Number(finalPrice.toFixed(2)))}
                  </span>&nbsp;
                  <span className="currency">
                    {selectedCurrency}
                  </span>
                </span>
                
                {/* This is a copy of the button logic, styled smaller by CSS */}
                {isSoldOut ? (
                  <button className="restock-btn" onClick={() => navigate(`/comingsoon`, { replace: false })}>
                    {t('notifyMe') || 'Notify Me'}
                  </button>
                ) : cartItem ? (
                  currentCartQuantity > 0 && quantity !== currentCartQuantity ? (
                    <button className="add-to-bag" onClick={handleUpdateQuantity}>{t('updateQuantity')}</button>
                  ) : (
                    <button className="add-to-bag" disabled>
                      {`${currentCartQuantity} ${t('inBag') || 'in Bag'}`}
                    </button>
                  )
                ) : (
                  <button className="add-to-bag" onClick={handleAddToCart}>
                    {t('addToBag')}
                  </button>
                )}
              </div>
            </div>
          )}
          {/* --- END OF NEW STICKY HEADER CONTENT --- */}

        </div>

        <div className="modal-content styled-content">
          <div className="left styled-left">
            <ImageCarousel
              key={product.id}
              images={images}
              productName={product.name}
              isSoldOut={isSoldOut}
              selectedIndex={selectedIndex}
              onChangeIndex={setSelectedIndex}
            />
          </div>

          <div className="right styled-right">
            <div className="button-wrap">
              <div ref={headerTriggerRef} className="btn-inner-wrap-top">
                <div className="title-price-wrap">
                  
                  {/* --- UPDATED NAME/SUBTITLE/PRICE JSX --- */}
                  <div className="name-title-wrap">
                    <div className="pd-name-stack"> {/* Use pd- class for styling */}
                      {!editMode ? (
                        <>
                          <h2 className="product-name" onClick={() => navigate(`/product/${product.id}`)}>
                            {product.name}
                          </h2>
                          <div className="subtitle">{product.subtitle}</div>
                        </>
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
                  {/* --- END UPDATED JSX --- */}

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
                  images={images}
                  activeIndex={selectedIndex} // Prop name might be different, ensure it works
                  onThumbClick={(idx) => {
                    setSelectedIndex(idx);
                    setMainImage(images[idx]);
                    setActiveThumbnail(images[idx]);
                  }}
                  isAdmin={isAdmin}
                  isEditing={editMode} // Pass editMode
                  onUploadImages={handleUploadImages}
                  onDeleteImage={handleDeleteImage}
                  onReorderImages={handleReorderImages}
                />

                {/* --- UPDATED QuantityControl --- */}
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
                
                {/* --- NEW: ADMIN TAXONOMY BLOCK --- */}
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
                    <label className="pd-admin-field">
                      <span>Origin</span>
                      <div className="pd-origin-edit">
                        <select
                          className="pd-admin-input"
                          value={ORIGIN_OPTIONS.includes(adminForm.origin) ? adminForm.origin : (adminForm.origin ? 'Other' : UNKNOWN_ORIGIN_KEY)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === 'Other') {
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
                    <label className="pd-admin-field">
                      <span>Safety Warning</span>
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
                          setAdminForm((s) => ({ ...s, createdAt: e.target.value, createdAtISO: e.target.value }))
                        }
                        title="Set the product creation timestamp"
                      />
                    </label>
                  </div>
                )}
                {/* --- END: ADMIN TAXONOMY BLOCK --- */}

                <div className={`message-container ${showAddedMessage || showUpdatedMessage ? 'expanded' : ''}`}>
                  {showUpdatedMessage && (
                    <div className="added-message">
                      <span>{t('updatedQuantity') || 'Quantity updated!'}</span>
                    </div>
                  )}
                  {showAddedMessage && (
                    <div className="added-message">
                      <span>{t('addedToBag')}</span>
                    </div>
                  )}
                </div>

                {/* --- HIDE BUTTONS IN EDIT MODE --- */}
                {!editMode && buttons && <div className="button-group">{buttons}</div>}
              </div>

              <div className="btn-inner-wrap-bot">
                <div className="top-text">
                  <div className="text-img-wrap">
                    <div className="img-wrap"><img src={fumartLogo} alt="logo" /></div>
                    <div className="qualityGuaranteed">{t('qualityGuaranteed')}</div>
                  </div>
                </div>
                <div className="qualityPromise">{t('qualityPromise')}</div>
                
                {/* --- This admin bar logic is correct and remains --- */}
                {isAdmin && (
                  <div className="admin-bar">
                    {!editMode ? (
                      <button className="admin-btn" onClick={startEdit}>✎ Edit</button>
                    ) : (
                      <div className="admin-actions">
                        <button className="admin-btn ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
                        <button className="admin-btn primary" onClick={saveEdit} disabled={saving}>
                          {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="pm-origin-row">
              <span className="pm-origin-label">{t('productOf')}</span>
              <span className="pm-origin-chip">{localizedOrigin}</span>
            </div>

          </div>

        </div>

        {/* --- UPDATED DESCRIPTION JSX --- */}
        <div className="product-description">
          <div className="description-title">{t('description')}</div>
          {!editMode ? (
            <p className="description-text">{product.description ?? t('noDescription')}</p>
          ) : (
            <textarea
              className="pd-admin-textarea" // <-- Use pd- class
              rows={6}
              value={adminForm.description}
              onChange={(e) => setAdminForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="Enter product description..."
            />
          )}
        </div>
  
        {((Array.isArray(product.mediaLink) && product.mediaLink.length > 0) || (userRole === 'admin')) && (
          <div
            className={`media-links-wrap ${
              Array.isArray(product.mediaLink) && product.mediaLink.length > 0 ? 'has-vid' : ''
            }`}
          >
            <MediaLinks
              mediaLink={product.mediaLink}
              isAdmin={userRole === 'admin'}
              onSaveLinks={async (newLinks) => {
                await updateDoc(doc(firestore, 'products', product.id), {
                  mediaLink: Array.isArray(newLinks) ? newLinks : []
                });
                setSelectedProduct?.({ ...product, mediaLink: Array.isArray(newLinks) ? newLinks : [] });
              }}
            />
          </div>
        )}


        <SuggestionsSection
          title={t('youMayAlsoLike')}
          items={suggestedProducts}
          loading={loadingSuggestions}
          listRef={suggestionsRef}
          skeletonCount={16}
          t={t}
          onItemClick={async (item) => {
            await onSelectSuggested?.(item);
            modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            suggestionsRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
          }}
        />
        

        <ReviewSection productId={product.id} productName={product.name} productSubtitle={product.subtitle} />
        {(product.brand && (loadingBrand || brandProducts.length >= 0)) && (
          <SuggestionsSection
            title={product.brand ? t('moreFromBrand', { brand: product.brand }) : t('moreFromBrandGeneric')}
            brand={product.brand}
            items={brandProducts}
            loading={loadingBrand}
            listRef={brandRef}
            skeletonCount={8}
            wrapperClassName="brand-suggestions"
            t={t}
            emptyKind="brand"
            emptyBrandName={product.brand}
            onItemClick={async (item) => {
              await onSelectSuggested?.(item);
              modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              brandRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
            }}
            
            // 2. Replace your existing onViewAll prop with this:
            onViewAll={() => {
              setFadeIn(false);
              setTimeout(() => {
                navigate(`/search?term=viewall&brands=${brandParam}`, { replace: true });
                onClose?.();
              }, 200);
            
            }}
          />
        )}



        {/* Price History with admin editing */}
        {/* <PriceHistory
          productName={product.name}
          data={product.priceHistory ?? []}
          isAdmin={userRole === 'admin'}
          onEditPoint={handleEditPoint}
          onAddPoint={handleAddPoint}
        /> */}
        
        
        {/* add a brand intro section compoenet, showing brand name ,logo, origin,intro, link to show all products of the brand*/}

        <div className="product-disclaimer">
          {/* --- NEW: PROP 65 WARNING --- */}
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

          <div className='product-disclaimer-bot'>
            <div className='product-disclaimer-text'>
              <p>{t('productDisclaimerPart1')}</p>
              <p className='disclaimer-bot'>
                {t('productDisclaimerPart2')}{' '}
                  <a href="/ComingSoon" className='learn-more' style={{ textDecoration: 'underline' }}>{t('learnMore')}</a>
              </p>
            </div>
            <div className='product-disclaimer-img'>
              <img src={isMobile ? fumartStamp : fumartStamp} alt="FÜ-MART stamp" />
            </div>
          </div>
        </div>
      </div>

      {Array.isArray(allProducts) && allProducts.length > 0 && (
        <ArrowNav
          isMobile={isMobile}
          closeImage={closeImage}
          arrowIcon={arrowIcon}
          arrowIcon2={arrowIcon2}
          fumartTextLogo={fumartTextLogo}
          currentIndex={currentProductIndex}
          total={allProducts.length}
          onClose={handleOverlayClick}
          onPrev={goPrevProduct}
          onNext={goNextProduct}
        />
      )}
      
    </div>
  );
};

export default ProductModal;