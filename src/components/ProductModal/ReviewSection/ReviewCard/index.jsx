import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './ReviewCard.scss';

const Stars = ({ value = 0, onChange }) => (
  <div className="rev-stars">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        onClick={() => onChange?.(i + 1)}
        className={`star ${i < value ? 'filled' : ''}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ⭐ Rounded Star Path */}
        <path
          d="M12 2.75c.33 0 .66.18.84.48l2.4 4.07c.1.18.27.3.47.33l4.64.72c.83.13 1.16 1.13.55 1.7l-3.37 3.14c-.15.14-.22.35-.19.55l.8 4.61c.14.84-.74 1.46-1.47 1.03l-4.09-2.33a.72.72 0 0 0-.71 0l-4.09 2.33c-.73.43-1.61-.19-1.47-1.03l.8-4.61c.04-.2-.03-.41-.19-.55L3.1 9.35c-.61-.57-.28-1.57.55-1.7l4.64-.72a.88.88 0 0 0 .47-.33l2.4-4.07c.18-.3.51-.48.84-.48Z"
          fill="currentColor"
        />
      </svg>
    ))}
  </div>
);


const ReviewCard = ({ review }) => {
  const { t } = useTranslation(['storefront']);
  const navigate = useNavigate();

  // ✅ now includes username and userId
  const {
    displayName,
    userName,
    userId,
    avatar,
    createdAt,
    verifiedPurchase,
    rating,
    text,
    photos,
  } = review;

  const date =
    createdAt?.seconds || createdAt?.toDate
      ? new Date(
          createdAt?.seconds ? createdAt.seconds * 1000 : createdAt.toDate()
        ).toLocaleDateString()
      : '';
  // ✅ Determine profile path
  const profilePath = userName
    ? `/profile/${userName}`
    : null;

  const handleNavigate = (e) => {
    if (profilePath) navigate(profilePath);
  };

  return (
    <div className="review-card">
      <div className="review-top">
        <div
          className="avatar"
          aria-hidden
          onClick={handleNavigate}
          style={{ cursor: profilePath ? 'pointer' : 'default' }}
        >
          {avatar ? (
            <img src={avatar} alt={displayName} />
          ) : (
            <div className="placeholder-avatar" />
          )}
        </div>

        <div className="meta">
          <div
            className="user"
            onClick={handleNavigate}
            style={{ cursor: profilePath ? 'pointer' : 'default' }}
          >
            {displayName || t('reviews.anonymous')}
          </div>

          <div className="submeta">
            <span className="date">{date}</span>
            {verifiedPurchase && (
              <span className="verified">{t('reviews.verified')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="rating-row">
        <Stars value={rating || 0} />
      </div>

      {text && <div className="body">{text}</div>}

      {Array.isArray(photos) && photos.length > 0 && (
        <div className="photos">
          {photos.slice(0, 4).map((p, idx) => (
            <img key={idx} src={p} alt="review" />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
