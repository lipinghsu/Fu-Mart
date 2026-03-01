import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore, auth } from '../../../firebase/utils';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged } from 'firebase/auth';
import fumartLogo from '../../../assets/fumart-m-t-bg.png';
import addImageIcon from '../../../assets/icons/addImage-icon.png';
import ReviewCard from './ReviewCard';
import './ReviewSection.scss';

const Stars = ({ value = 0, onChange }) => {
  const { t } = useTranslation(['storefront']);
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value; // use hover while hovering

  return (
    <div
      className="rev-stars"
      aria-label={t('reviews.starsLabel', { value: displayValue })}
      onMouseLeave={() => setHoverValue(0)}        // reset when leaving the row
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`star ${i < displayValue ? 'filled' : ''}`}
          onClick={() => onChange?.(i + 1)}
          onMouseEnter={() => setHoverValue(i + 1)} // hover 3 => fill 0–3
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewsSection = ({ productId, productName, productSubtitle, className = '' }) => {
  const { t } = useTranslation(['storefront']);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  
  const fileInputRef = useRef(null);
  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!productId) return;
    const run = async () => {
      try {
        setLoading(true);
        const productRef = doc(firestore, 'products', productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const data = productSnap.data();
          const revs = Array.isArray(data.reviews)
            ? [...data.reviews].sort(
                (a, b) =>
                  (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
              )
            : [];
          setReviews(revs);
        } else {
          setReviews([]);
        }
      } catch (e) {
        console.error('Reviews fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [productId]);

  const handleUpload = async (files) => {
    const uploads = Array.from(files).map(async (file) => {
      const storageRef = ref(storage, `review_photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });
    const urls = await Promise.all(uploads);
    setPhotos((prev) => [...prev, ...urls]);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!text.trim()) {
      setValidationMessage(t('reviews.emptyComment', 'Please write something before submitting.'));
      setShowValidationHint(true);
      setTimeout(() => setShowValidationHint(false), 2500);
      return;
    }

    if (rating === 0) {
      setValidationMessage(t('reviews.emptyStars', 'Please select a star rating.'));
      setShowValidationHint(true);
      setTimeout(() => setShowValidationHint(false), 2500);
      return;
    }

    try {
      // 🔹 Step 1: fetch user info from "users" collection
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let displayName = 'Anonymous';
      let avatar = '';
      let userName = ''; // 👈 add username field

      if (userSnap.exists()) {
        const userData = userSnap.data();
        displayName = userData.displayName || user.displayName || 'Anonymous';
        avatar = userData.avatar || '';
        userName = userData.userName || ''; // 👈 read from Firestore
      }

      // 🔹 Step 2: create new review
      const productRef = doc(firestore, 'products', productId);
      const newReview = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        rating,
        text,
        photos,
        createdAt: new Date(),
        verifiedPurchase: false,
        userId: user.uid,
        displayName,
        avatar,
        userName, // 👈 include username in uploaded review
      };

      // 🔹 Step 3: push to Firestore
      await updateDoc(productRef, {
        reviews: arrayUnion(newReview),
      });
      await updateDoc(productRef, { lastReviewAt: serverTimestamp() });

      // 🔹 Step 4: update local state
      setReviews((prev) => [newReview, ...prev]);
      setExpanded(false);
      setText('');
      setPhotos([]);
      setRating(0);
    } catch (err) {
      console.error('Error adding review:', err);
    }
  };

  return (
    <section className={`reviews-section ${className}`}>
      <div className="reviews-header">
        <h2>{t('reviews.title')}</h2>
      </div>

      <div className="review-wrap">
        <div
          className={`write-review-container ${expanded ? 'active' : ''}`}
          onClick={() => !expanded && setExpanded(true)}
        >
          <div className="logo-wrap">
            <img src={fumartLogo} alt="logo" />
          </div>

          {expanded && <Stars value={rating} onChange={setRating} />}

          <textarea
            placeholder={
              expanded
                ? t('reviews.placeholder', {
                    name: productName,
                    subtitle: productSubtitle,
                  })
                : t('reviews.writeFor', {
                    name: productName,
                    subtitle: productSubtitle,
                  })
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
          />

          {photos.length > 0 && (
            <div className="photo-preview">
              {photos.map((p, idx) => (
                <div className="photo-thumb" key={idx}>
                  <img src={p} alt="preview" />
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="actions">
              {/* 📷 Add Image Button on LEFT */}
              <div
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <img className="add-img-icon" src={addImageIcon} alt="upload"/>
              </div>

              <div className="right-actions">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setExpanded(false);
                    setText('');
                    setPhotos([]);
                    setRating(0);
                    setShowLoginHint(false);
                  }}
                >
                  {t('reviews.cancel')}
                </button>

                <div
                  className="submit-wrap"
                  onMouseEnter={() => {
                    if (!user) setShowLoginHint(true);
                  }}
                  onMouseLeave={() => {
                    setShowLoginHint(false);
                    setShowValidationHint(false);
                  }}
                >
                  <button
                    className="submit-btn"
                    disabled={!user}
                    onClick={handleSubmit}
                  >
                    {t('reviews.submit')}
                  </button>

                  {/* 🔒 Login Required */}
                  {showLoginHint && !user && (
                    <div className="login-hint-dropdown visible">
                      <span>
                        {t('reviews.loginRequired', 'Only logged-in users can write reviews.')}
                      </span>
                      <button className="go-login-btn" onClick={() => navigate('/login')}>
                        {t('reviews.goLogin', 'Sign in')}
                      </button>
                    </div>
                  )}

                  {/* ⚠️ Empty comment / missing stars */}
                  {showValidationHint && user && (
                    <div className="login-hint-dropdown visible">
                      <span>{validationMessage}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files)}
        />

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
        ) : reviews.length === 0 ? (
          <div className="no-reviews-wrap">
            <div className="no-reviews">{t('reviews.noReviews')}</div>
          </div>
        ) : (
          <div className="review-cards">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;