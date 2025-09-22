import React, { useState, useRef, useEffect } from 'react';

const HOVER_OPEN_DELAY = 120;  // ms
const HOVER_CLOSE_DELAY = 120; // ms
import './SellersStrip.scss';

const SellersStrip = ({
  resolvedSellers = [],
  SoldByIcon,
  navigate,
  getSellerPreview,           // async (username) => extra profile fields
  getSellerProducts,          // async (username) => [{ id, name, price, imageUrl, slug }]
  onMakeOffer,                // optional (seller) => void
}) => {
  const containerRef = useRef(null);

  const [hoveredSeller, setHoveredSeller] = useState(null); // { username, name, ... }
  const [anchorRect, setAnchorRect] = useState(null);       // DOMRect of hovered link
  const [isOpen, setIsOpen] = useState(false);

  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const previewRef = useRef(null);
  const sortHoverTimer = useRef(null); // (not used here but handy if you integrate later)

  // product cache to avoid refetch on re-hover
  const productCacheRef = useRef(new Map()); // username -> products[]
  const [previewProducts, setPreviewProducts] = useState([]);

  // Helpers
  const formatPrice = (value) => {
    if (value == null) return null;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value));
    } catch {
      return `$${Number(value).toFixed(2)}`;
    }
  };

  const scheduleOpen = (seller, targetEl) => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);

    setHoveredSeller(seller);
    setAnchorRect(targetEl?.getBoundingClientRect?.() || null);

    openTimer.current = setTimeout(() => setIsOpen(true), HOVER_OPEN_DELAY);
  };

  const scheduleClose = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setTimeout(() => {
        setHoveredSeller(null);
        setAnchorRect(null);
        setPreviewProducts([]);
      }, 100);
    }, HOVER_CLOSE_DELAY);
  };

  // Keep open while hovering the preview panel
  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const onEnter = () => clearTimeout(closeTimer.current);
    const onLeave = () => scheduleClose();
    node.addEventListener('mouseenter', onEnter);
    node.addEventListener('mouseleave', onLeave);
    return () => {
      node.removeEventListener('mouseenter', onEnter);
      node.removeEventListener('mouseleave', onLeave);
    };
  }, [isOpen]);

  // Fetch extra profile data and first 3 products when opening
  useEffect(() => {
    let cancelled = false;

    const hydrateProfile = async () => {
      if (!isOpen || !hoveredSeller?.username) return;
      // Optional profile extras
      if (getSellerPreview) {
        try {
          const extra = await getSellerPreview(hoveredSeller.username);
          if (!cancelled && extra) {
            setHoveredSeller(prev => (prev?.username ? { ...prev, ...extra } : prev));
          }
        } catch { /* ignore */ }
      }
      // Products (cache first)
      const uname = hoveredSeller.username;
      if (productCacheRef.current.has(uname)) {
        const cached = productCacheRef.current.get(uname) || [];
        if (!cancelled) setPreviewProducts(cached.slice(0, 3));
      } else if (getSellerProducts) {
        try {
          const prods = await getSellerProducts(uname);
          if (!cancelled && Array.isArray(prods)) {
            productCacheRef.current.set(uname, prods);
            setPreviewProducts(prods.slice(0, 3));
          }
        } catch { /* ignore */ }
      }
    };

    hydrateProfile();
    return () => { cancelled = true; };
  }, [isOpen, hoveredSeller?.username, getSellerPreview, getSellerProducts]);

  // Compute popover position: directly **below the hovered seller name**
  const getPopoverStyle = () => {
    if (!anchorRect || !containerRef.current) return {};
    const containerRect = containerRef.current.getBoundingClientRect();

    const gap = 6; // px between link and popover
    const maxWidth = Math.min(420, containerRect.width - 16);

    // Align left edge of popover to the seller link's left edge
    let left = anchorRect.left - containerRect.left;
    let top = anchorRect.bottom - containerRect.top + gap;

    // Clamp horizontally within container
    left = Math.max(8, Math.min(left, containerRect.width - maxWidth - 8));

    return {
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${maxWidth}px`,
    };
  };

  const handleMakeOffer = (e) => {
    e.stopPropagation();
    if (!hoveredSeller?.username) return;
    if (onMakeOffer) {
      onMakeOffer(hoveredSeller);
    } else if (navigate) {
      // navigate(`/offers/new?to=${encodeURIComponent(hoveredSeller.username)}`);
      navigate(`/comingSoon`);
    }
    setIsOpen(false);
  };

  const handleViewProfile = (e) => {
    e.stopPropagation();
    if (!hoveredSeller?.username || !navigate) return;
    navigate(`/profile/${hoveredSeller.username}`);
    setIsOpen(false);
  };

  const openProduct = (p) => {
    if (!navigate || !p) return;
    const dest = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;
    navigate(dest);
    setIsOpen(false);
  };

  return (
    <div className="pm-sellers" ref={containerRef}>
      <div className="pm-sellers__btn" aria-controls="seller-list">
        <img src={SoldByIcon} className="sold-by-icon" alt="" />
        <span className="pm-sellers__label" aria-hidden="true">Sold by&nbsp;</span>

        <span className="pm-sellers__text">
          {resolvedSellers.map((s, i) => (
            <React.Fragment key={s.username}>
              <span
                className="pm-sellers__link"
                role="link"
                // tabIndex={0}
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${s.username}`); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); e.stopPropagation(); navigate(`/profile/${s.username}`);
                  }
                }}
                onMouseEnter={(e) => scheduleOpen(s, e.currentTarget)}
                onMouseLeave={scheduleClose}
                onFocus={(e) => scheduleOpen(s, e.currentTarget)}
                onBlur={scheduleClose}
              >
                {s.name}
              </span>
              {i < resolvedSellers.length - 1 && ', '}
            </React.Fragment>
          ))}
        </span>
      </div>

      {isOpen && hoveredSeller && (
        <div
          ref={previewRef}
          className="seller-preview"
          style={getPopoverStyle()}
          role="dialog"
          aria-label={`${hoveredSeller.name} preview`}
        >
          <div className="seller-preview__row">
            <div className="seller-preview__avatar">
              {hoveredSeller.avatarUrl
                ? <img src={hoveredSeller.avatarUrl} alt="" />
                : <div className="avatar-fallback" aria-hidden="true">{hoveredSeller.name?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="seller-preview__meta">
              <div className="seller-preview__name">
                {hoveredSeller.name}
                <span className="seller-preview__handle">@{hoveredSeller.username}</span>
              </div>
              <div className="seller-preview__stats">
                {!!hoveredSeller.rating && (
                  <span className="stat">
                    <span className="star" aria-hidden="true">★</span>
                    {hoveredSeller.rating.toFixed(1)}
                  </span>
                )}
                {!!hoveredSeller.sales && (
                  <span className="stat">{hoveredSeller.sales.toLocaleString()} sales</span>
                )}
                {!!hoveredSeller.location && (
                  <span className="stat">{hoveredSeller.location}</span>
                )}
              </div>
            </div>
          </div>

          {hoveredSeller.bio && (
            <div className="seller-preview__bio">{hoveredSeller.bio}</div>
          )}

          {!!previewProducts?.length && (
            <div className="seller-preview__products">
              {previewProducts.map((p) => (
                <div
                  key={p.id}
                  className="seller-preview__product"
                  onClick={(e) => { e.stopPropagation(); openProduct(p); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(p); }
                  }}
                >
                  <div className="seller-preview__product-img">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" />
                      : <div className="img-fallback" aria-hidden="true" />
                    }
                  </div>
                  <div className="seller-preview__product-info">
                    <div className="seller-preview__product-name">{p.name}</div>
                    {p.price != null && (
                      <div className="seller-preview__product-price">{formatPrice(p.price)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom actions */}
          <div className="seller-preview__actions">
            <div
              type="button"
              className="seller-preview__btn"
              onClick={handleMakeOffer}
            >
              Make Offer
            </div>
            <div
              type="button"
              className="seller-preview__btn secondary"
              onClick={handleViewProfile}
            >
              View Profile
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersStrip;
