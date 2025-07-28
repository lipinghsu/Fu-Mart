// src/components/ProductDetail/ProductDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import ProductCard from '../ProductCard';
import Header from '../Header';
import Footer from '../Footer';
import closeImage from '../../assets/closeImage.png';
import arrowIcon from '../../assets/arrowIcon2.png';
import fumartLogo from '../../assets/fumart-m-t-bg.png';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation(['storefront']);
  const dropdownRef = useRef(null);

  // product must come before we try to read product.id
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddedMessage,   setShowAddedMessage]   = useState(false);
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);

  // now it's safe to read product.id (although product may be null until fetched)
  const cartItems = useSelector(state => state.cart.items);
  const cartItem = product
    ? cartItems.find(item => item.id === product.id)
    : null;
  const currentCartQuantity = cartItem?.quantity || 0;

  const [fadeIn, setFadeIn] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [activeThumbnail, setActiveThumbnail] = useState('');
  const [quantity, setQuantity] = useState(1);

  const modalRef = useRef(null);
  const suggestionsRef = useRef(null);
  // const showUpdateButton = currentCartQuantity > 0 && quantity !== currentCartQuantity;

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
    setTimeout(() => setShowAddedMessage(false), 2000);
  };
  // Fade in on mount
  useEffect(() => { setFadeIn(true); }, []);

  function getYouTubeEmbedUrl(url) {
    if (!url) return '';

    // Extract video ID from URL
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regExp);

    const videoId = match ? match[1] : null;
    if (!videoId) return '';

    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Fetch product
  useEffect(() => {
    (async () => {
      setLoading(true);
      const docRef = doc(firestore, 'products', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setProduct({ id: snap.id, ...data });
        setMainImage(data.images?.[0] || '');
        setActiveThumbnail(data.images?.[0] || '');
      }
      setLoading(false);
    })();
  }, [id]);

  // Fetch suggestions
  useEffect(() => {
    if (!product) return;
    (async () => {
      setLoadingSuggestions(true);
      const q = query(
        collection(firestore, 'products'),
        where('category', '==', product.category)
      );
      const snap = await getDocs(q);
      const items = [];
      snap.forEach(d => {
        if (d.id !== product.id) items.push({ id: d.id, ...d.data() });
      });
      setSuggestions(items.slice(0, 8));
      setLoadingSuggestions(false);
    })();
  }, [product]);

  // Sync quantity with cart
  useEffect(() => {
    if (!product) return;
    const inCart = cartItems.find(item => item.id === product.id);
    setQuantity(inCart?.quantity || 1);
  }, [cartItems, product]);

  const handleClose = () => {
    setFadeIn(false);
    setTimeout(
      () => navigate(location.pathname.split('?')[0], { replace: true }),
      200
    );
  };

  const handleArrowNav = dir => {
    if (!suggestions.length) return;
    const idx = suggestions.findIndex(p => p.id === product.id);
    const nextIdx = dir === 'left'
      ? (idx > 0 ? idx - 1 : suggestions.length - 1)
      : (idx < suggestions.length - 1 ? idx + 1 : 0);
    navigate(`/product/${suggestions[nextIdx].id}`, { replace: true });
  };

  const handleAdd = () => {
    if (!product) return;
    dispatch(addToCart({ ...product, addedQuantity: quantity }));
  };

  if (loading) return null; // or spinner

  return (
    <div className="pd-wrap">
      <Header hasSearchBar mainPageHeader />
      <div className="top-category-bar">
        <span
          className="top-category-bar-link"
          onClick={() =>
            navigate(
              `/storefront?category=${encodeURIComponent(
                product.category
              )}`
            )
          }
        >
          {product.category}
        </span>
        <span className="top-category-bar-sep">&gt;</span>
        <span
          className="top-category-bar-link"
          onClick={() =>
            navigate(
              `/storefront?subcategory=${encodeURIComponent(
                product.subCategory
              )}`
            )
          }
        >
          {product.subCategory}
        </span>
      </div>
      <div
        ref={modalRef}
        className={`pd-modal-card ${fadeIn ? 'pd-fade-in' : 'pd-fade-out'}`}
        onClick={e => e.stopPropagation()}
      >


        {/* Content Grid: exactly like modal-content.styled-content */}
        <div className="pd-content-grid">
          {/* LEFT */}
          <div className="pd-left-column">
            <div className="pd-image-wrapper">
              <img
                src={mainImage}
                alt={product.name}
                className="pd-main-image"
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="pd-right-column styled-right">
            <div className="pd-button-wrap">
              <div className="pd-btn-inner-wrap-top">
                <div className="pd-name-title-wrap">
                  <h2 className="pd-product-name">{product.name}</h2>
                  <div className="pd-price-wrap">
                    <span className="pd-price">${product.price.toFixed(2)} </span>
                    <span className="pd-currency">USD</span>
                  </div>
                </div>
                <div className="pd-subtitle">{product.subtitle}</div>

                <div className="pd-thumbnail-row">
                  {loadingSuggestions
                    ? Array.from({ length: product.images.length }).map((_, idx) => (
                        <div className="pd-thumbnail-wrapper pd-skeleton" key={idx}>
                          <div className="pd-thumbnail-container pd-skeleton-box" />
                        </div>
                      ))
                    : product.images.map((img, idx) => (
                        <div className="pd-thumbnail-wrapper" key={idx}>
                          <div className="pd-thumbnail-container">
                            <img
                              src={img}
                              className={`pd-thumbnail ${activeThumbnail === img ? 'pd-active' : ''}`}
                              onClick={() => {
                                setMainImage(img);
                                setActiveThumbnail(img);
                              }}
                              onMouseEnter={() => setMainImage(img)}
                              onMouseLeave={() => setMainImage(activeThumbnail)}
                            />
                          </div>
                          <div className={`pd-thumbnail-bar ${activeThumbnail === img ? 'pd-active' : ''}`} />
                        </div>
                      ))
                  }
                </div>

                <div className="pd-quantity-control" ref={dropdownRef}>
                  <div
                    className={`pd-quantity-button ${dropdownOpen ? 'pd-active' : ''} ${
                      currentCartQuantity > 0
                        ? quantity !== currentCartQuantity
                          ? 'pd-quantity-changed'
                          : 'pd-in-bag'
                        : ''
                    }`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className="pd-selected-quantity">
                      {currentCartQuantity > 0 && quantity === currentCartQuantity
                        ? `${currentCartQuantity} ${t('inBag')}`
                        : `${t('quantity')}: ${quantity}`}
                    </span>
                    <span className="pd-arrow">▼</span>
                  </div>
                  <div className={`pd-quantity-dropdown ${dropdownOpen ? 'pd-open' : ''}`}>
                    <div className="pd-option pd-block" />
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i + 1}
                        className={`pd-option ${currentCartQuantity === i+1 ? 'pd-selected-option' : ''}`}
                        onClick={() => handleSelectQuantity(i + 1)}
                      >
                        <span>{i + 1}</span>
                        {currentCartQuantity === i+1 && <div className="pd-check-mark" />}
                      </div>
                    ))}
                    <div className="pd-option" onClick={() => handleSelectQuantity(10)}>
                      {t('customQuantity')}
                    </div>
                    {currentCartQuantity > 0 && (
                      <div
                        className="pd-option pd-remove-option"
                        onClick={() => {
                          dispatch({ type: 'cart/removeItem', payload: product.id });
                          setQuantity(1);
                          setDropdownOpen(false);
                        }}
                      >
                        {t('removeFromBag')}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`pd-message-container ${
                  showAddedMessage || showUpdatedMessage ? 'pd-expanded' : ''
                }`}>
                  {showUpdatedMessage && (
                    <div className="pd-added-message">
                      <span>{t('updatedQuantity')}</span>
                    </div>
                  )}
                  {showAddedMessage && (
                    <div className="pd-added-message">
                      <span>{t('addedToBag')}</span>
                    </div>
                  )}
                </div>

                {cartItem ? (
                  showUpdateButton && (
                    <div className="pd-button-group">
                      <button className="pd-add-to-bag" onClick={handleUpdateQuantity}>
                        {t('updateQuantity')}
                      </button>
                      <button className="pd-buy-now" onClick={() => onBuyNow(product, quantity)}>
                        {t('buyNow')}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="pd-button-group">
                    <button className="pd-add-to-bag" onClick={handleAddToCart}>
                      {t('addToBag')}
                    </button>
                    <button className="pd-buy-now" onClick={() => onBuyNow(product, quantity)}>
                      {t('buyNow')}
                    </button>
                  </div>
                )}
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
              </div>
            </div>
          </div>

        </div>

        {/* “You May Also Like” */}
        <div className="pd-suggestions-container">
          <div className="pd-suggestion-header">
            <h2>{t('youMayAlsoLike')}</h2>
          </div>
          <div
            className="pd-suggestion-list pd-scroll-horizontal"
            ref={suggestionsRef}
          >
            {loadingSuggestions
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div className="pd-suggestion-item-skel" key={i}>
                    <div className="pd-skeleton-box" />
                  </div>
                ))
              : suggestions.map(item => (
                  <div className="pd-suggestion-item" key={item.id}>
                    <ProductCard
                      product={item}
                      onClick={() => navigate(`/product/${item.id}`)}
                      t={t}
                    />
                  </div>
                ))
            }
          </div>
        </div>
        <div className="product-description">
          <div className="description-title">
            <h2>{t('description')}</h2>
          </div>
          <p>{product.description || t('noDescription')}</p>

          {/* Embed YouTube video if mediaLink exists */}
          {product.mediaLink && (
            <div className="video-wrapper" style={{ marginTop: '1rem' }}>
              <iframe
                width="100%"
                height="100%"
                src={getYouTubeEmbedUrl(product.mediaLink)}
                title="Product Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
        <div className="product-disclaimer">
          <p>{t('productDisclaimerPart1')}</p>
          <p>
            {t('productDisclaimerPart2')}{' '}
            <strong>
              <a href="/comingsoon" style={{ textDecoration: 'underline' }}>
                {t('learnMore')}
              </a>
            </strong>
          </p>
        </div>
    
        {/* {suggestions.length > 0 && (
          <div className="pd-arrow-wrapper">
            <button
              className="pd-arrow-btn pd-arrow-left"
              onClick={e => { e.stopPropagation(); handleArrowNav('left'); }}
            >
              <img src={arrowIcon} alt="prev" />
            </button>
            <button
              className="pd-arrow-btn pd-arrow-right"
              onClick={e => { e.stopPropagation(); handleArrowNav('right'); }}
            >
              <img src={arrowIcon} alt="next" />
            </button>
          </div>
        )} */}
      </div>

      <Footer
       />
    </div>
  );
};

export default ProductDetail;
