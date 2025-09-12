import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '../../../../firebase/utils';
import fumartLogo from '../../../../assets/fumart-m-t-bg.png';
import fumartTextLogo from '../../../../assets/fumart-text-logo-bombarda.png';
import './ReviewSection.scss';
import { useTranslation } from 'react-i18next';

const Stars = ({ value = 0 }) => {
  const { t } = useTranslation(['storefront']);
  return (
    <div className="rev-stars" aria-label={t('reviews.starsLabel', { value })}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`star ${i < value ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
};

/**
 * Reusable Reviews section
 * Props:
 * - productId (string)
 * - onWriteReview?: () => void
 * - className?: string
 * - initialTab?: 'all'|'purchased'|'photos'
 * - initialSort?: 'default'|'newest'|'highest'|'lowest'
 */
const ReviewsSection = ({
  productId,
  productName,
  productSubtitle,
  onWriteReview,
  className = '',
  initialTab = 'all',
  initialSort = 'default',
}) => {
  const { t } = useTranslation(['storefront']);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    if (!productId) return;
    const run = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(firestore, 'reviews'),
          where('productId', '==', productId),
          orderBy('createdAt', 'desc'),
          fbLimit(30)
        );
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setReviews(list);
      } catch (e) {
        console.error('Reviews fetch error:', e);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [productId]);

  const filtered = useMemo(() => {
    if (tab === 'purchased') return reviews.filter(r => !!r.verifiedPurchase);
    if (tab === 'photos')    return reviews.filter(r => Array.isArray(r.photos) && r.photos.length);
    return reviews;
  }, [reviews, tab]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'newest')  return arr.sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if (sort === 'highest') return arr.sort((a,b) => (b.rating||0)-(a.rating||0));
    if (sort === 'lowest')  return arr.sort((a,b) => (a.rating||0)-(b.rating||0));
    return arr;
  }, [filtered, sort]);

  const handleWriteReview = () => {
    if (onWriteReview) return onWriteReview();
    navigate(`/reviews/new?product=${encodeURIComponent(productId)}`);
  };

  return (
    <section className={`reviews-section ${className}`}>
      <div className="reviews-header">
        <h2>{t('reviews.title')}</h2>
      </div>

      <div className='review-wrap'>
        <div className="reviews-subheader">
          <div
            className="write-review-btn"
            onClick={() => navigate('/ComingSoon')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/ComingSoon')}
            aria-label={t('reviews.writeFor', { subtitle: productSubtitle })}
            title={t('reviews.writeFor', { subtitle: productSubtitle, name: productName })}
          >
            <div className='write-review-wrap'>
              <div className='logo-wrap'>
                <img src={fumartLogo} alt="" aria-hidden />
              </div>
              <span>{t('reviews.writeFor', { subtitle: productSubtitle, name: productName })}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="review-cards">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="review-card skeleton" key={`rev-skel-${i}`}>
                <div className="line w40" />
                <div className="line w90" />
                <div className="line w75" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="no-reviews-wrap">
            <div className="no-reviews">
              {t('reviews.noReviews')}
            </div>
          </div>
        ) : (
          <div className="review-cards">
            {sorted.map((r) => (
              <div className="review-card" key={r.id}>
                <div className="review-top">
                  <div className="avatar" aria-hidden />
                  <div className="meta">
                    <div className="user">{r.userName || t('reviews.anonymous')}</div>
                    <div className="submeta">
                      <span className="date">
                        {r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleDateString() : ''}
                      </span>
                      {r.verifiedPurchase && <span className="verified">{t('reviews.verified')}</span>}
                    </div>
                  </div>
                </div>

                <div className="rating-row">
                  <Stars value={r.rating || 0} />
                  {r.flavor && <span className="flavor">{t('reviews.flavor', { flavor: r.flavor })}</span>}
                </div>

                {r.text && <div className="body">{r.text}</div>}

                {Array.isArray(r.photos) && r.photos.length > 0 && (
                  <div className="photos">
                    {r.photos.slice(0, 4).map((p, idx) => (
                      <img key={idx} src={p} alt="review" />
                    ))}
                  </div>
                )}

                <div className="actions">
                  <button className="linkish">{t('reviews.showOriginal')}</button>
                  <div className="votes">
                    <button title={t('reviews.helpful')} aria-label={t('reviews.helpful')}>👍</button>
                    <button title={t('reviews.notHelpful')} aria-label={t('reviews.notHelpful')}>👎</button>
                    <button title={t('reviews.more')} aria-label={t('reviews.more')}>•••</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
