import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from '../../ProductCard';
import './ProductModal.scss';
import closeImage from '../../../assets/closeImage.png';
import fumartLogo from '../../../assets/fumart-m-t-bg.png';

const ProductModal = ({ product, onClose, onAddToCart, onBuyNow, onSelectSuggested, isDarkMode }) => {
  const { t } = useTranslation(['storefront']);

  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [fadeIn, setFadeIn] = useState(false);
  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [activeThumbnail, setActiveThumbnail] = useState(product.images?.[0]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  const modalRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (!hasMouseMoved) setHasMouseMoved(true);
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => {
    setIsZooming(false);
    setHasMouseMoved(false);
  };

  useEffect(() => {
    setFadeIn(true);
    setMainImage(product.images?.[0]);
    setActiveThumbnail(product.images?.[0]);
    fetchSuggestedProducts();
    if (modalRef.current) {
      // Wait for next paint to ensure DOM updates
      requestAnimationFrame(() => {
        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [product]);

  const fetchSuggestedProducts = async () => {
    try {
      setLoadingSuggestions(true);
      const q = query(
        collection(firestore, 'products'),
        where('category', '==', product.category)
      );
      const querySnapshot = await getDocs(q);
      const suggestions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.id !== product.id) {
          suggestions.push({ id: doc.id, ...data });
        }
      });
      setSuggestedProducts(suggestions);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleOverlayClick = () => {
    setFadeIn(false);
    setTimeout(onClose, 200);
  };

  const handleSelectQuantity = (value) => {
    setQuantity(value);
    setDropdownOpen(false);
  };

  return (
    <div className={`product-modal-overlay ${fadeIn ? 'fade-in' : 'fade-out'}`} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`product-modal styled-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleOverlayClick}>
          <img src={closeImage} alt="close" />
        </button>

        <div className="modal-content styled-content">
          <div className="left styled-left">
            <div
              className="image-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {isProductLoading ? (
                <div className="skeleton-image" />
              ) : (
                <img
                  src={mainImage}
                  alt={product.name}
                  className={`main-image ${isZooming && hasMouseMoved ? 'zooming' : ''}`}
                  style={{ transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }}
                />
              )}
            </div>

          </div>

          <div className="right styled-right" style={{ width: '100%' }}>
            <div className="name-title-wrap">
                <h2 className="product-name">{product.name}</h2>
                <div className="subtitle">{product.subtitle}</div>
            </div>

            <div className="button-wrap">
              <div className='btn-inner-wrap-top'>
                  <div className="price">${product.price?.toFixed(2)} USD</div>
                  <div className="thumbnail-row">
                  {!isProductLoading && product.images?.map((img, idx) => (
                    <div className="thumbnail-container" key={idx}>
                      <img
                        src={img}
                        alt={`${product.name} thumb ${idx + 1}`}
                        className={`thumbnail ${activeThumbnail === img ? 'active' : ''}`}
                        onMouseEnter={() => setMainImage(img)}
                        onMouseLeave={() => setMainImage(activeThumbnail)}
                        onClick={() => {
                          setMainImage(img);
                          setActiveThumbnail(img);
                        }}
                      />
                      <div className={`thumbnail-bar ${activeThumbnail === img ? 'active' : ''}`} />
                    </div>
                  ))}
                  </div>
                  <div className="quantity-control">
                    <div className="quantity-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
                      {quantity}
                      <span className="arrow">▼</span>
                    </div>
                    {dropdownOpen && (
                      <div className="quantity-dropdown">
                        {[...Array(9)].map((_, i) => (
                          <div key={i + 1} className="option" onClick={() => handleSelectQuantity(i + 1)}>
                            {i + 1}
                          </div>
                        ))}
                        <div className="option" onClick={() => handleSelectQuantity(10)}>
                          {t('customQuantity')}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="button-group">
                    <button className="add-to-cart" onClick={() => onAddToCart(product, quantity)}>
                      {t('addToCart')}
                    </button>
                    <button className="buy-now" onClick={() => onBuyNow(product, quantity)}>
                      {t('buyNow')}
                    </button>
                  </div>

                </div>
                <div className='btn-inner-wrap-bot'>
                  <div className='top-text'>
                    <div className='text-img-wrap'>
                      <div className='img-wrap'>
                        <img src={fumartLogo} />
                      </div>
                      <div className='qualityGuaranteed'>
                      {t('qualityGuaranteed')}
                      </div>
                      
                    </div>

                  </div>
                  <div className='qualityPromise'>
                      {t('qualityPromise')}
                  </div>
                </div>

              </div>

            </div>
              
        </div>

        <div className="suggestions styled-suggestions">
          <div className="suggestion-title">
            <h2>{t('youMayAlsoLike')}</h2>
          </div>
          <div className="suggested-items horizontal-scroll">
            {loadingSuggestions ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div className="suggested-item skeleton" key={`skeleton-${idx}`}>
                  <div className="skeleton-box" />
                </div>
              ))
            ) : suggestedProducts.length > 0 ? (
              suggestedProducts.map((item) => (
                <div className="suggested-item" key={item.id}>
                  <ProductCard
                    product={item}
                    onClick={async () => {
                      setIsProductLoading(true);
                      await onSelectSuggested(item);
                      if (modalRef.current) {
                        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      setIsProductLoading(false);
                    }}
                    t={t}
                  />
                </div>
              ))
            ) : (
              <p>{t('noSuggestions')}</p>
            )}
          </div>
        </div>

        <div className="product-description">
          <div className="description-title">
            <h2>{t('description')}</h2>
          </div>
          <p>{product.description || t('noDescription')}</p>
        </div>

        <div className="product-disclaimer">
          <p>{t('productDisclaimerPart1')}</p>
          <p>
            {t('productDisclaimerPart2')}{' '}
            <strong>
              <a href="/help" style={{ textDecoration: 'underline' }}>
                {t('learnMore')}
              </a>
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
