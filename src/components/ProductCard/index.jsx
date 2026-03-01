import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import './ProductCard.scss';

const PAD_X = 16 * 2;
const MIN_W = 56;
const MAX_W = 240;
const IMAGE_CYCLE_SPEED = 1500; // Time in ms between image changes

const ProductCard = ({ product, onClick }) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation('storefront');

  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [btnW, setBtnW] = useState(MIN_W);
  const [isPressed, setIsPressed] = useState(false);
  const { selectedCurrency, formatPrice } = useCurrency();


  // Load image through CDN using ImageKit.io
  const getOptimizedImage = (url, width = 780, quality = 84) => {
    if (!url) return '';

    const imagekitBase = 'https://ik.imagekit.io/fumart/firebase/';
    return url
      .replace(
        /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/fu-mart-8\.firebasestorage\.app\/o\//,
        imagekitBase
      )
      + `&tr=w-${width},q-${quality},f-webp`;
  };


  // image cycling ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageIntervalRef = useRef(null);

  // Hidden measurers
  const refDefault = useRef(null);
  const refHover = useRef(null);
  const refAdded = useRef(null);
  const refSoldOut = useRef(null);
  const refSpinner = useRef(null);

  const stockQty = Number(product?.stockQuantity ?? 0);
  const isSoldOut = stockQty <= 0;

  // On Sale logic
  const price =
    typeof product?.price === 'number' ? product.price : Number(product?.price ?? 0);
  const discount = Number(product?.priceDiscount ?? 0);
  const isOnSale = !isSoldOut && price > 0 && discount > 0;
  const finalPrice = isOnSale ? Math.max(price - discount, 0) : price;
  const percentOff = isOnSale && price > 0 ? Math.round((discount / price) * 100) : null;

  const handleAddToCart = async () => {
    if (isLoading || isSoldOut) return;
    setIsLoading(true);
    const safeProduct = {
      ...product,
      createdAt: product?.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
    };
    dispatch(addToCart(safeProduct));
    setTimeout(() => {
      setIsLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 1000);
  };

    const handleMouseEnter = () => {
      if (product.images.length <= 1) return;

      setCurrentImageIndex(1);
      clearInterval(imageIntervalRef.current);
      
      imageIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex =>
          (prevIndex + 1) % product.images.length
        );
      }, IMAGE_CYCLE_SPEED); // This will now use 3000ms
    };

  const handleMouseLeave = () => {
    if (product.images.length <= 1) return;
    clearInterval(imageIntervalRef.current);
    setCurrentImageIndex(0); // Reset to the first image
  };

  // Active key for button width
  const activeKey = isSoldOut
    ? 'soldOut'
    : isLoading
    ? 'spinner'
    : added
    ? 'added'
    : hovered
    ? 'hover'
    : 'default';

  // Measure button width
  useLayoutEffect(() => {
    const map = {
      default: refDefault.current,
      hover: refHover.current,
      added: refAdded.current,
      soldOut: refSoldOut.current,
      spinner: refSpinner.current,
    };
    const el = map[activeKey];
    if (!el) return;
    const raw = Math.ceil(el.offsetWidth || 0);
    const next = Math.max(MIN_W, Math.min(MAX_W, raw + PAD_X));
    setBtnW(prev => (prev !== next ? next : prev));
  }, [activeKey, t]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      clearInterval(imageIntervalRef.current);
    };
  }, []);

  // Handle global release for press state
  useEffect(() => {
    if (!isPressed) return;
    const handleRelease = () => setIsPressed(false);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [isPressed]);

  return (
    <div
      className={`product-card loaded ${isSoldOut ? 'sold-out' : ''} ${
        isOnSale ? 'on-sale' : ''
      } ${isPressed ? 'pressed' : ''}`}
      onClick={() => onClick(product)}
      onMouseDown={() => setIsPressed(true)}
      onTouchStart={() => setIsPressed(true)}
      // --- ADDED HOVER HANDLERS ---
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // ---
      aria-label={
        isSoldOut
          ? t?.('soldOut') || 'Sold Out'
          : isOnSale
          ? `${product?.name} ${t?.('onSale') || 'On Sale'}`
          : product?.name
      }
      data-soldout={isSoldOut}
      data-onsale={isOnSale}
    >
      {product.images?.length > 0 && (
        <div
          className={`product-image-wrap ${
            product.images.length > 1 ? 'has-multiple' : ''
          }`}
        >
          {product.images.map((imageSrc, index) => (
            <picture key={index}>
              <source
                srcSet={getOptimizedImage(imageSrc)}
                type="image/webp"
              />
              <img
                src={getOptimizedImage(imageSrc)}
                alt={`${product.name}${index > 0 ? ` (${index + 1})` : ''}`}
                className={`product-image ${index === currentImageIndex ? 'active' : ''}`}
                loading="lazy"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'low'}
                draggable="false"
              />
            </picture>
          ))}
          {isSoldOut && <div className="sold-out-overlay" aria-hidden="true" />}
        </div>
      )}

      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <p className="subtitle">{product.subtitle}</p>
        <p className="price">
          {isOnSale ? (
            <>
              <span className="current isOnSale">
                <span className="original isOnSale">
                  {formatPrice(Number(price.toFixed(2)))}
                </span>
                &nbsp;{formatPrice(Number(finalPrice.toFixed(2)))}&nbsp;
                {selectedCurrency === 'TWD' ? '' : selectedCurrency}
              </span>
            </>
          ) : (
            <span className="current">
              {typeof price === 'number' && !Number.isNaN(price)
                ? `${formatPrice(Number(price.toFixed(2)))}`
                : '--'}
              &nbsp;{selectedCurrency === 'TWD' ? '' : selectedCurrency}
            </span>
          )}
        </p>
      </div>

      {/* Hidden measurers */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          whiteSpace: 'nowrap',
          inset: '-9999px auto auto -9999px',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        <span ref={refDefault} style={{ display: 'inline-block' }}>
          {t('buy')}
        </span>
        <span ref={refHover} style={{ display: 'inline-block' }}>
          {t('addToBag')}
        </span>
        <span ref={refAdded} style={{ display: 'inline-block' }}>
          {t('addedToBag')}
        </span>
        <span ref={refSoldOut} style={{ display: 'inline-block' }}>
          {t?.('soldOut') || 'Sold Out'}
        </span>
        <span
          ref={refSpinner}
          style={{ display: 'inline-block', width: 16, height: 16 }}
        />
      </div>

      {/* Add to Bag Button */}
      <div
        className={`add-to-bag-btn
          ${isSoldOut ? 'disabled' : ''}
          ${isLoading || added ? 'visible' : hovered ? 'visible' : ''}
          ${isLoading ? 'loading' : ''}
        `}
        style={{ width: `${btnW}px` }}
        onClick={e => {
          e.stopPropagation();
          handleAddToCart();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={isLoading || added || isSoldOut}
      >
        {isSoldOut ? (
          <span className="text-soldout">{t?.('soldOut') || 'Sold Out'}</span>
        ) : isLoading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : added ? (
          <span className="text-added">{t('addedToBag')}</span>
        ) : (
          <>
            <span className="text-default">{t('buy')}</span>
            <span className="text-hover">{t('addToBag')}</span>
          </>
        )}
      </div>

    </div>
  );
};

export default ProductCard;