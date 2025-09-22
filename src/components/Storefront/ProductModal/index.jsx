import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../../../firebase/utils';
import { onAuthStateChanged } from 'firebase/auth';

import ProductCard from '../../ProductCard';
import ReviewSection from './ReviewSection';
import './ProductModal.scss';

import closeImage from '../../../assets/Icons/closeImage.png';
import fumartLogo from '../../../assets/fumart-m-t-bg.png';
import fumartStamp from '../../../assets/fumart-stamp.png';
import fumartStampB from '../../../assets/fm-bsts.png';

import fumartTextLogo from '../../../assets/fumart-text-logo-bombarda.png';
import arrowIcon from '../../../assets/Icons/arrowIcon2.png';
import arrowIcon2 from '../../../assets/Icons/arrowIcon600-128px.png';
import SoldByIcon from '../../../assets/Icons/sold-by.png';

import ImageCarousel from './ImageCarousel';
import ThumbnailRow from './ThumbnailRow';
import PriceBlock from './PriceBlock';
import QuantityControl from './QuantityControl';
import ArrowNav from './ArrowNav';
import SellersStrip from './SellersStrip';
import MediaLinks from './MediaLinks';
import PriceHistory from './PriceHistory';
import SuggestionsSection from './SuggestionsSection';

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

  if (!product) return null;

  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const brandRef = useRef(null);

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

  const [sellerNameMap, setSellerNameMap] = useState({}); // { username: displayName }

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

    return () => clearTimeout(timer);
  }, [product?.id]);

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
          <button className="buy-now" onClick={() => onBuyNow?.(product, quantity)}>{t('buyNow')}</button>
        </>
      ) : null
    ) : (
      <>
        <button className="add-to-bag" onClick={handleAddToCart}>
          {t('addToBag')}
        </button>
        <button className="buy-now" onClick={() => onBuyNow?.(product, quantity)}>
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

  return (
    <div className={`product-modal-overlay ${fadeIn ? 'fade-in' : 'fade-out'}`} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`product-modal styled-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-topbar">
          <div className="close-button-modal" onClick={handleOverlayClick} aria-label="Close">
            <img src={closeImage} alt="close" />
          </div>
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
              <div className="btn-inner-wrap-top">
                <div className="name-title-wrap">
                  <h2 className="product-name" onClick={() => navigate(`/product/${product.id}`)}>
                    {product.name}
                  </h2>
                  <PriceBlock
                    isSoldOut={isSoldOut}
                    isOnSale={isOnSale}
                    price={price}
                    finalPrice={finalPrice}
                    t={t}
                  />
                </div>

                <div className="subtitle">{product.subtitle}</div>

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
                  onThumbClick={(idx) => {
                    setSelectedIndex(idx);
                    setMainImage(product.images[idx]);
                    setActiveThumbnail(product.images[idx]);
                  }}
                />

                {!isSoldOut && (
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

                {buttons && <div className="button-group">{buttons}</div>}
              </div>

              <div className="btn-inner-wrap-bot">
                <div className="top-text">
                  <div className="text-img-wrap">
                    <div className="img-wrap"><img src={fumartLogo} alt="logo" /></div>
                    <div className="qualityGuaranteed">{t('qualityGuaranteed')}</div>
                  </div>
                </div>
                <div className="qualityPromise">{t('qualityPromise')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="product-description">
          <div className="description-title">
            <div className='description-title'>{t('description')}</div>
          </div>
          <p>{product.description || t('noDescription')}</p>
        </div>
        

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
          />
        )}

        {/* Price History with admin editing */}
        <PriceHistory
          productName={product.name}
          data={product.priceHistory ?? []}
          isAdmin={userRole === 'admin'}
          onEditPoint={handleEditPoint}
          onAddPoint={handleAddPoint}
        />
        
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

        <div className="product-disclaimer">
          <div className='product-disclaimer-text-wrap'>
            <p>{t('productDisclaimerPart1')}</p>
            <p className='disclaimer-bot'>
              {t('productDisclaimerPart2')}{' '}
              <strong><a href="/ComingSoon" style={{ textDecoration: 'underline' }}>{t('learnMore')}</a></strong>
            </p>
          </div>
          <div className='product-disclaimer-img-wrap'>
            <img src={isMobile ? fumartStampB : fumartStamp} alt="FÜ-MART stamp" />
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
