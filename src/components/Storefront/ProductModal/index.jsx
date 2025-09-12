import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from '../../ProductCard';
import ReviewSection from './ReviewSection';
import './ProductModal.scss';
import closeImage from '../../../assets/Icons/closeImage.png';
import fumartLogo from '../../../assets/fumart-m-t-bg.png';
import fumartTextLogo from '../../../assets/fumart-text-logo-bombarda.png';
import arrowIcon from '../../../assets/Icons/arrowIcon2.png';
import arrowIcon2 from '../../../assets/Icons/arrowIcon600-128px.png';

const ProductModal = ({ product, onClose, onAddToCart, onBuyNow, onSelectSuggested, isDarkMode, allProducts, setSelectedProduct }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['storefront']);
  const cartItems = useSelector(state => state.cart.items);
  const navigate = useNavigate();
  const location = useLocation();

  if (!product) return null;

  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);

  // refs & state for brand row
  const brandRef = useRef(null); 
  const [loadingBrand, setLoadingBrand] = useState(true); 
  const [brandProducts, setBrandProducts] = useState([]); 

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
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 870);

  const cartItem = cartItems.find(item => item.id === product.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  // --- NEW: availability & sale ---
  const stockQty = Number(product?.stockQuantity ?? 0);
  const isSoldOut = stockQty <= 0;

  const price = typeof product?.price === 'number' ? product.price : Number(product?.price ?? 0);
  const discount = Number(product?.priceDiscount ?? 0); // flat amount off
  const isOnSale = !isSoldOut && price > 0 && discount > 0;
  const finalPrice = isOnSale ? Math.max(price - discount, 0) : price;
  const percentOff = isOnSale && price > 0 ? Math.round((discount / price) * 100) : null;

  // fetch other products by same brand
  const fetchBrandProducts = async () => {
    try {
      setLoadingBrand(true);
      if (!product?.brand) {
        setBrandProducts([]);
        return;
      }

      const q = query(
        collection(firestore, 'products'),
        where('brand', '==', product.brand)
      );
      const snap = await getDocs(q);

      const items = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== product.id) items.push({ id: doc.id, ...data });
      });

      // Prefer same subCategory first, then others, keep to 8 like suggestions
      const sameSub = items.filter(i => i.subCategory === product.subCategory);
      const diffSub = items.filter(i => i.subCategory !== product.subCategory);
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
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 870);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function getYouTubeEmbedUrl(url) {
    if (!url) return '';

    // Extract video ID from URL
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regExp);

    const videoId = match ? match[1] : null;
    if (!videoId) return '';

    return `https://www.youtube.com/embed/${videoId}`;
  }
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!allProducts || !product) return;

      const currentIndex = allProducts.findIndex((p) => p.id === product.id);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedProduct(allProducts[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < allProducts.length - 1) {
        setSelectedProduct(allProducts[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, allProducts]);


  useEffect(() => {
    setQuantity(currentCartQuantity > 0 ? currentCartQuantity : 1);
  }, [currentCartQuantity, product.id]);

  useEffect(() => {
    setMainImage(product.images?.[0]);
    setActiveThumbnail(product.images?.[0]);
    fetchSuggestedProducts();
    fetchBrandProducts();
    setFadeIn(true);
    const timer = setTimeout(() => setThumbnailsLoading(false), 500);
    if (modalRef.current) {
      requestAnimationFrame(() => {
        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    return () => clearTimeout(timer);
  }, [product]);

  const handleNotifyRestock = () => {
    if (typeof onNotifyRestock === 'function') {
      onNotifyRestock(product);
    } else {
      // fallback: send users to a restock page
      // navigate(`/restock?pid=${product.id}`, { replace: false });
      navigate(`/comingsoon`, { replace: false });
    }
  };

  const handleUpdateQuantity = () => {
    const updatedProduct = {
      ...product,
      createdAt: product.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
      quantity
    };
    dispatch({ type: 'cart/updateItemQuantity', payload: updatedProduct });
    setShowUpdatedMessage(true);
    setTimeout(() => setShowUpdatedMessage(false), 2000);
  };

  const handleAddToCart = () => {
    if (isSoldOut) return; // NEW
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

      const allSuggestions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== product.id) {
          allSuggestions.push({ id: doc.id, ...data });
        }
      });

      const sameSub = allSuggestions.filter(
        (item) => item.subCategory === product.subCategory
      );
      const diffSub = allSuggestions.filter(
        (item) => item.subCategory !== product.subCategory
      );

      const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random());
      const shuffledSameSub = shuffleArray(sameSub);
      const shuffledDiffSub = shuffleArray(diffSub);

      const combined = [...shuffledSameSub, ...shuffledDiffSub].slice(0, 8);
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
      onClose();
    }, 200);
  };

  const handleSelectQuantity = (value) => {
    if (isSoldOut) return;        // NEW
    setQuantity(value);
    setDropdownOpen(false);
  };

  const showUpdateButton = currentCartQuantity > 0 && quantity !== currentCartQuantity;

  // prevent thumbnail iamges from being dragged
  document.addEventListener('dragstart', (e) => {
    if (e.target.matches('img.thumbnail')) e.preventDefault();
  });
  return (
    <div className={`product-modal-overlay ${fadeIn ? 'fade-in' : 'fade-out'}`} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`product-modal styled-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close-button-modal" onClick={handleOverlayClick}>
          <img src={closeImage} alt="close" />
        </div>

        <div className="modal-content styled-content">
          <div className="left styled-left">
            <div className="image-container" onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <img
              src={mainImage}
              alt={product.name}
              className={`main-image ${isZooming && hasMouseMoved ? 'zooming' : ''} ${isSoldOut ? 'is-sold-out' : ''}`}
              style={{ transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }}
            />

              {isSoldOut && <div className="sold-out-overlay" aria-hidden="true" />}

              {/* SALE badge (top-right) — hidden when sold out */}
              {/* {isOnSale && !isSoldOut && (
                <div className="sale-badge" aria-hidden="true">
                  {percentOff ? `-${percentOff}%` : (t('sale') || 'SALE')}
                </div>
              )} */}

              {/* SOLD OUT badge (centered) */}
              {isSoldOut && (
                <div className="sold-out-badge center" role="status">
                  {t('soldOut') || 'Sold Out'}
                </div>
              )}
            </div>
          </div>

          <div className="right styled-right">
            <div className="button-wrap">
              <div className='btn-inner-wrap-top'>
                <div className="name-title-wrap">
                  <h2 className="product-name">{product.name}</h2>
                  {/* {product.stockQuantity < 5 && (
                    <div className="low-stock-label">
                      {t('lowInStock')}
                    </div>
                  )} */}
                <div className={`price-wrap ${isOnSale ? 'on-sale' : ''} ${isSoldOut ? 'sold-out' : ''}`}>
                  {isSoldOut ? (
                    <>
                      <span className="price current soldout-label">
                        {t('soldOut') || 'SOLD OUT'}
                      </span>
                      <div className='isSoldOut-wrap'>
                        {price ? <span className="price original">${price.toFixed(2)} <span className="currency">USD</span></span> : null}
                      </div>
                    </>
                  ) : isOnSale ? (
                    <>
                      <span className="price current">${finalPrice.toFixed(2)}</span>
                      <div className='isOnSale-wrap'>
                        {price ? <span className="price original">${price.toFixed(2)} <span className="currency">USD</span></span> : null}
                      </div>
 
                    </>
                  ) : (
                    <>

                      <span className="price">{price ? `$${price.toFixed(2)}` : '--'}</span>
                      <span className="currency">USD</span>
                    </>
                  )}
                </div>
                </div>
                <div className="subtitle">{product.subtitle}</div>
                <div className="thumbnail-row">
                  {thumbnailsLoading
                    ? Array.from({ length: product.images.length }).map((_, idx) => (
                        <div className="thumbnail-wrapper skeleton" key={idx}>
                          <div className="thumbnail-container skeleton-box" />
                        </div>
                      ))
                    : product.images?.map((img, idx) => (
                        <div className="thumbnail-wrapper" key={idx}>
                          <div className="thumbnail-container">
                            <img
                              src={img}
                              // alt={`Thumbnail`}
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
                {!isSoldOut && (
                <div className="quantity-control" ref={dropdownRef}>
                  <div
                    className={`quantity-button ${dropdownOpen ? 'active' : ''} ${
                      currentCartQuantity > 0
                        ? quantity !== currentCartQuantity
                          ? 'quantity-changed'
                          : 'in-bag'
                        : ''
                    } ${isSoldOut ? 'disabled' : ''}`}                 // NEW
                    onClick={() => !isSoldOut && setDropdownOpen(!dropdownOpen)}  // NEW
                  >
                    <span className='selected-quantity'>
                      {isSoldOut
                        ? (t('soldOut') || 'Sold Out')
                        : ((currentCartQuantity > 0) && (quantity === currentCartQuantity)
                            ? `${currentCartQuantity} ${t('inBag')}`
                            : `${t('quantity')}: ${quantity}`)}
                    </span>
                    <span className="arrow">▼</span>
                  </div>
                  <div className={`quantity-dropdown ${dropdownOpen ? 'open' : ''}`}>
                    <div className="option block" />
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i + 1}
                        className={`option ${currentCartQuantity === i + 1 ? 'selected-option' : ''}`}
                        onClick={() => handleSelectQuantity(i + 1)}
                      >
                        <span>{i + 1}</span>
                        {currentCartQuantity === i + 1 && <div className="check-mark"></div>}
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

                <div className="button-group">
                  {isSoldOut ? (
                    <button
                      className="restock-btn"
                      onClick={handleNotifyRestock}
                      aria-label={t('notifyMe') || 'Notify Me'}
                      title={t('notifyMe') || 'Notify Me'}
                    >
                      {t('notifyMe') || 'Notify Me'}
                    </button>
                  ) : cartItem ? (
                    showUpdateButton ? (
                      <>
                        <button className="add-to-bag" onClick={handleUpdateQuantity}>
                          {t('updateQuantity')}
                        </button>
                        <button className="buy-now" onClick={() => onBuyNow(product, quantity)}>
                          {t('buyNow')}
                        </button>
                      </>
                    ) : null
                  ) : (
                    <>
                      <button className="add-to-bag" onClick={handleAddToCart}>
                        {t('addToBag')}
                      </button>
                      <button className="buy-now" onClick={() => onBuyNow(product, quantity)}>
                        {t('buyNow')}
                      </button>
                    </>
                  )}
                </div>

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
          // optional if you want a custom action:
          // onWriteReview={() => setOpenReviewComposer(true)}
        />

        {(product.brand && (loadingBrand || brandProducts.length > 0)) && (
          <div className="suggestions styled-suggestions brand-suggestions">
            <div className="suggestion-title">
              <h2>
                {product.brand
                  ? t('moreFromBrand', { brand: product.brand })
                  : t('moreFromBrandGeneric')}
              </h2>
            </div>
            <div className="suggested-items horizontal-scroll" ref={brandRef}>
              {loadingBrand ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div className="suggested-item skeleton" key={`brand-skel-${i}`}>
                    <div className="skeleton-box" />
                  </div>
                ))
              ) : brandProducts.length > 0 ? (
                brandProducts.map((item) => (
                  <div className="suggested-item" key={`brand-${item.id}`}>
                    <ProductCard
                      product={item}
                      onClick={async () => {
                        await onSelectSuggested(item);
                        modalRef.cuwrrent?.scrollTo({ top: 0, behavior: 'smooth' });
                        brandRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                      }}
                      t={t}
                    />
                  </div>
                ))
              ) : (
                <div className="noSuggestions-wrapper">
                  <div className="no-suggestions-title">
                    {t('noSuggestionsTitle') || 'No Related Products Found'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



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
              {/* <a href="/help" style={{ textDecoration: 'underline' }}> */}
              <a href="/ComingSoon" style={{ textDecoration: 'underline' }}>
                {t('learnMore')}
              </a>
            </strong>
          </p>
        </div>
      </div>
      {/* <div className='arrow-buttons-wrap'> */}
      {allProducts && (() => {
        const currentIndex = allProducts.findIndex(p => p.id === product.id);

        return (
          <div className='arrow-buttons-wrap'
          {...(isMobile && { onClick: (e) => e.stopPropagation() })}
          >
          <div className="close-button" onClick={handleOverlayClick}>
            <img src={closeImage} alt="close" />
          </div>
            {currentIndex > 0 && (
              <button
                className="arrow-button left"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(allProducts[currentIndex - 1]);
                }}
              >
              <img src={isMobile ? arrowIcon2 : arrowIcon} />

                
              </button>
            )}
            {isMobile &&
              <div className='fumart-logo-wrapper'>
                <img src={fumartTextLogo} alt="logo" />
              </div>}

            {currentIndex < allProducts.length - 1 && (
              <button
                className="arrow-button right"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(allProducts[currentIndex + 1]);
                }}
              >
                <img src={isMobile ? arrowIcon2 : arrowIcon} />

              </button>
            )}
          </div>
        );
      })()}
      {/* </div> */}
    </div>
  );
};

export default ProductModal;