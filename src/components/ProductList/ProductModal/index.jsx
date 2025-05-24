import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from '../../ProductCard';
import './ProductModal.scss';
import closeImage from '../../../assets/closeImage.png';
import fumartLogo from '../../../assets/fumart-m-t-bg.png';

const ProductModal = ({ product, onClose, onAddToCart, onBuyNow, onSelectSuggested, isDarkMode }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['storefront']);
  const cartItems = useSelector(state => state.cart.items);

  if (!product) return null;

  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [quantity, setQuantity] = useState(1);
  const [fadeIn, setFadeIn] = useState(false);
  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [activeThumbnail, setActiveThumbnail] = useState(product.images?.[0]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  
  const cartItem = cartItems.find(item => item.id === product.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  useEffect(() => {
    setQuantity(currentCartQuantity > 0 ? currentCartQuantity : 1);
  }, [currentCartQuantity, product.id]);

  const handleUpdateQuantity = () => {
    const updatedProduct = {
      ...product,
      createdAt: product.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
      quantity // Set the final quantity directly
    };
    dispatch({ type: 'cart/updateItemQuantity', payload: updatedProduct });
  };

  const handleAddToCart = () => {
    const safeProduct = {
      ...product,
      createdAt: product.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
      addedQuantity: quantity
    };
    dispatch(addToCart(safeProduct));

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 2000); // 提示顯示 2 秒
  };

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
      requestAnimationFrame(() => {
        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [product]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        if (doc.id !== product.id && doc.id !== product?.id) {
          suggestions.push({ id: doc.id, ...data });
        }
      });
      const shuffled = suggestions.sort(() => 0.5 - Math.random());
      setSuggestedProducts(shuffled.slice(0, 8));
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

  const showUpdateButton = currentCartQuantity > 0 && quantity !== currentCartQuantity;

  return (
    <div className={`product-modal-overlay ${fadeIn ? 'fade-in' : 'fade-out'}`} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`product-modal styled-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close-button" onClick={handleOverlayClick}>
          <img src={closeImage} alt="close" />
        </div>

        <div className="modal-content styled-content">
          <div className="left styled-left">
            <div
              className="image-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={mainImage}
                alt={product.name}
                className={`main-image ${isZooming && hasMouseMoved ? 'zooming' : ''}`}
                style={{ transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }}
              />
            </div>
          </div>

          <div className="right styled-right">
            <div className="button-wrap">
              <div className='btn-inner-wrap-top'>
                <div className="name-title-wrap">
                  <h2 className="product-name">{product.name}</h2>
                  <div className="price">${product.price?.toFixed(2)} <span className='currency'>USD</span></div>
                </div>
                <div className="subtitle">{product.subtitle}</div>
                <div className="thumbnail-row">
                  {product.images?.map((img, idx) => (
                    <div className="thumbnail-wrapper" key={idx}>
                      <div className="thumbnail-container">
                        <img
                          src={img}
                          alt={`Thumbnail`}
                          className={`thumbnail ${activeThumbnail === img ? 'active' : ''}`}
                          onClick={() => {
                            setMainImage(img);
                            setActiveThumbnail(img);
                          }}
                          onMouseEnter={() => setMainImage(img)}
                          onMouseLeave={() => setMainImage(activeThumbnail)}
                        />
                      </div>
                      <div className={`thumbnail-bar ${activeThumbnail === img ? 'active' : ''}`} />
                    </div>
                  ))}
                </div>
                <div className="quantity-control" ref={dropdownRef}>
                  <div
                    className={`quantity-button ${dropdownOpen ? 'active' : ''} ${
                      currentCartQuantity > 0
                        ? quantity !== currentCartQuantity
                          ? 'quantity-changed'
                          : 'in-bag'
                        : ''
                    }`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className='selected-quantity'>
                      
                      {(currentCartQuantity > 0) && (quantity === currentCartQuantity) ?  `${currentCartQuantity} ${t('inBag')}`: `${t('quantity')}: ${quantity}`}
                      {/* {currentCartQuantity > 0 && ` (${t('inBag')}: ${currentCartQuantity})`} */}
                    </span>
                    <span className="arrow">▼</span>
                  </div>
                  <div className={`quantity-dropdown ${dropdownOpen ? 'open' : ''}`}>
                    <div className="option block" />
                    {[...Array(9)].map((_, i) => (
                      <div key={i + 1} className="option" onClick={() => handleSelectQuantity(i + 1)}>
                        {i + 1}
                      </div>
                    ))}
                    <div className="option" onClick={() => handleSelectQuantity(10)}>
                      {t('customQuantity')}
                    </div>
                    {currentCartQuantity > 0 && (
                      <div
                        className="option remove-option"
                        onClick={() => {
                          dispatch({ type: 'cart/removeItem', payload: product.id });
                          setQuantity(1);
                          setDropdownOpen(false);
                        }}
                      >
                         {t('removeFromBag') || 'Remove from Bag'}
                      </div>
                    )}
                  </div>
                </div>
                {showAddedMessage && (
                  <div className="added-message">
                     {t('addedToBag')}
                  </div>
                )}

                {cartItem ? (
                  showUpdateButton && (
                    <div className="button-group">
                      <button className="add-to-bag" onClick={handleUpdateQuantity}>
                        {t('updateQuantity')}
                      </button>
                      <button className="buy-now" onClick={() => onBuyNow(product, quantity)}>
                        {t('buyNow')}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="button-group">
                    <button className="add-to-bag" onClick={handleAddToCart}>
                      {t('addToBag')}
                    </button>
                    <button className="buy-now" onClick={() => onBuyNow(product, quantity)}>
                      {t('buyNow')}
                    </button>
                  </div>
                )}
              </div>
              <div className='btn-inner-wrap-bot'>
                <div className='top-text'>
                  <div className='text-img-wrap'>
                    <div className='img-wrap'>
                      <img src={fumartLogo} alt="logo" />
                    </div>
                    <div className='qualityGuaranteed'>{t('qualityGuaranteed')}</div>
                  </div>
                </div>
                <div className='qualityPromise'>{t('qualityPromise')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="suggestions styled-suggestions">
          <div className="suggestion-title">
            <h2>{t('youMayAlsoLike')}</h2>
          </div>
          <div className="suggested-items horizontal-scroll" ref={suggestionsRef}>
            {loadingSuggestions ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div className="suggested-item skeleton" key={i}>
                  <div className="skeleton-box" />
                </div>
              ))
            ) : suggestedProducts.length > 0 ? (
              suggestedProducts.map((item) => (
                <div className="suggested-item" key={item.id}>
                  <ProductCard
                    product={item}
                    onClick={async () => {
                      await onSelectSuggested(item);
                      modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      suggestionsRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
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
