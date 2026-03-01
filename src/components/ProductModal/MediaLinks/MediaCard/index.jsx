// src/components/MediaLinks/MediaCard.jsx
import React from 'react';
import './MediaCard.scss';

// YouTube thumbnail helper
const ytThumb = (id) => (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null);

/**
 * MediaCard
 * - Pure presentational/interaction shell for a single media item
 * - All player refs (full + preview) are passed down from the parent (MediaLinks)
 */
const MediaCard = ({
  link,
  meta,                // { link, kind: 'yt' | 'file', ytId?: string, isShort?: boolean }
  index,
  isOpen,
  onOpen,
  onClose,             // (not used visually here, but kept for parity)
  showPreview,
  onHoverStart,
  onHoverEnd,
  registerIframeRef,           // full YT player container ref callback
  registerVideoRef,            // full HTML5 <video> ref callback
  registerPreviewIframeRef,    // preview YT container ref callback
  registerPreviewVideoRef,     // preview HTML5 <video> ref callback
}) => {
  const isYT = meta.kind === 'yt';
  const isFile = meta.kind === 'file';
  const thumb = isYT ? ytThumb(meta.ytId) : null;

  // shorts get 9:16, otherwise 16:9
  const ratioVar = meta.isShort ? '177.77%' : '56.25%';

  return (
    <div
      className={`media-card ${isOpen ? 'is-open' : ''} ${meta.isShort ? 'is-short' : ''}`}
      data-index={index}
      onMouseEnter={() => onHoverStart?.(index)}
      onMouseLeave={() => onHoverEnd?.(index)}
      onFocus={() => onHoverStart?.(index)}
      onBlur={() => onHoverEnd?.(index)}
      style={{ '--thumb-ratio': ratioVar }}
    >
      {!isOpen && (
        <div
          type="button"
          className="media-card__hit"
          aria-expanded="false"
          aria-label="Expand video"
          onClick={() => onOpen(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(index);
            }
          }}
        />
      )}

      <div className="media-thumb">
        {thumb && (
          <img
            className={`thumb-img ${isOpen ? 'is-hidden' : ''}`}
            src={thumb}
            alt="Video thumbnail"
            loading="lazy"
          />
        )}

        {/* Full player region — keep container mounted ALWAYS */}
        <div className={`media-player ${isOpen ? 'visible' : ''}`}>
          {isYT && (
            <div
              ref={(el) => registerIframeRef(index, el)}
              className="video-embed"
              data-yt-id={meta.ytId}
            />
          )}

          {isFile && (
            <video
              ref={(el) => registerVideoRef(index, el)}
              className="video-embed"
              src={link}
              controls
              playsInline
              preload="metadata"
            />
          )}
        </div>

        {/* Preview (closed state) — keep the YT container mounted ALWAYS */}
        {isYT && (
          <div
            ref={(el) => registerPreviewIframeRef(index, el)}
            className={`preview-embed ${!isOpen && showPreview ? 'preview-visible' : ''}`}
            data-yt-id={meta.ytId}
          />
        )}

        {!isOpen && isFile && (
          <video
            ref={(el) => registerPreviewVideoRef(index, el)}
            className={`preview-embed ${showPreview ? 'preview-visible' : ''}`}
            src={link}
            muted
            autoPlay={showPreview}
            playsInline
            preload="metadata"
          />
        )}
      </div>
    </div>
  );
};

export default MediaCard;
