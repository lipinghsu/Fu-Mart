import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from './../../ProductCard';
import ProductModal from './../../ProductModal';
import './RecommendedProducts.scss';
import { useTranslation } from 'react-i18next';
import arrowIcon400 from '../../../assets/Icons/arrowIcon400.png';

const EPS = 2;            // a tiny tolerance for float/rounding
const GAP_PX = 12;        // keep in sync with SCSS
const STEP_CARDS = 1;     // how many cards to move per click

const RecommendedProducts = () => {
  const { t } = useTranslation(['home']);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const listRef = useRef(null);
  const slotPxRef = useRef(0); // current slot width in px
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  // Lock body scroll when modal open
  useEffect(() => {
    if (selectedProduct) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  // Fetch recommended products
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const q = query(collection(firestore, 'products'), where('recommended', '>', 0));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = products.sort((a, b) => a.recommended - b.recommended);
        setRecommendedProducts(sorted);
      } catch (err) {
        console.error('Error fetching recommended products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommended();
  }, []);

  // Layout + scroll state helpers
  const updateSlotAndLayout = () => {
    const el = listRef.current;
    if (!el) return;

    const w = el.getBoundingClientRect().width;
    // 7 visible by default on wide screens, then step down
    const count =
      w >= 1680 ? 6 :
      w >= 1440 ? 6 :
      w >= 1200 ? 4 :
      w >= 900  ? 4 :
      w >= 640  ? 2 : 2;

    const totalGap = (count - 1) * GAP_PX;
    const raw = (w - totalGap) / count;
    const slotPx = Math.floor(raw);

    el.style.setProperty('--cards-visible', String(count));
    el.style.setProperty('--gap', `${GAP_PX}px`);
    el.style.setProperty('--slot-px', `${slotPx}px`);

    slotPxRef.current = slotPx;

    // After sizing, recompute scroll edge flags
    updateEdgeFlags();
  };

  const updateEdgeFlags = () => {
    const el = listRef.current;
    if (!el) return;

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const s = el.scrollLeft;

    const _atStart = s <= EPS;
    const _atEnd = s >= max - EPS;

    setAtStart(_atStart);
    setAtEnd(_atEnd);
    setCanScroll(max > EPS);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateSlotAndLayout();
    });

    ro.observe(el);
    window.addEventListener('resize', updateSlotAndLayout);
    // Recompute when products finish loading / change
    updateSlotAndLayout();

    // Track scroll to toggle hint visibility
    const onScroll = () => updateEdgeFlags();
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSlotAndLayout);
      el.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, recommendedProducts.length]);

  // Click handlers for the hint buttons
  const scrollByCards = (dir = 1) => {
    const el = listRef.current;
    if (!el) return;

    const slot = slotPxRef.current || parseFloat(getComputedStyle(el).getPropertyValue('--slot-px')) || 0;
    const delta = dir * (slot * STEP_CARDS + GAP_PX * STEP_CARDS);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const visibleProducts = recommendedProducts;

  return (
    <div className="rec-products styled-latest-products">
      <div className="rec-products-title">
        <div>{t('recommendedProducts') || 'Recommended for You'}</div>
      </div>

      <div className="rec-scroll-wrap">
        <div
          className="rec-product-list horizontal-scroll"
          ref={listRef}
          role="region"
          aria-label="Recommended products"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div className="rec-product-item" key={idx}>
                  <div className="product-card-skeleton">
                    <div className="skeleton-image" />
                    <div className="skeleton-text title" />
                    <div className="skeleton-text sub-title" />
                    <div className="skeleton-text price" />
                  </div>
                </div>
              )
            )
            : visibleProducts.map(product => (
                <div className="rec-product-item" key={product.id}>
                  <ProductCard
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    t={t}
                  />
                </div>
              )
            )
          }
        </div>

        {/* Scroll hints */}
        <div
          className={`scroll-hint-wrap left ${!canScroll || atStart ? 'is-hidden' : ''}`}
          aria-hidden="true"
        >
          <div
            type="button"
            className="scroll-hint-button"
            aria-label="Scroll left"
            onClick={() => scrollByCards(-1)}
            tabIndex={canScroll && !atStart ? 0 : -1}
          >
            <img src={arrowIcon400} alt="" className="scroll-hint-img mirror" />
          </div>
        </div>

        <div
          className={`scroll-hint-wrap right ${!canScroll || atEnd ? 'is-hidden' : ''}`}
          aria-hidden="true"
        >
          <div
            type="button"
            className="scroll-hint-button"
            aria-label="Scroll right"
            onClick={() => scrollByCards(1)}
            tabIndex={canScroll && !atEnd ? 0 : -1}
          >
            <img src={arrowIcon400} alt="" className="scroll-hint-img" />
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, q) => console.log('Add to cart:', p, q)}
          onBuyNow={(p, q) => console.log('Buy now:', p, q)}
          onSelectSuggested={p => setSelectedProduct(p)}
          isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
          allProducts={visibleProducts}
          setSelectedProduct={setSelectedProduct}
        />
      )}
    </div>
  );
};

export default RecommendedProducts;
