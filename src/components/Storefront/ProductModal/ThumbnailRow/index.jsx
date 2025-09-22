import React, { useRef } from 'react';
import './ThumbnailRow.scss';

const ThumbnailRow = ({
  loading,
  images = [],
  activeThumbnail,
  onThumbClick,
  isAdmin = false,
  isEditing = false,
  onUploadImages,
  onDeleteImage,
}) => {
  const fileInputRef = useRef(null);
  const openPicker = () => fileInputRef.current?.click();
  const onFileChange = async (e) => {
    const files = e.target.files;
    if (files && onUploadImages) await onUploadImages(files);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="thumbnail-row">
        {Array.from({ length: images.length || 4 }).map((_, idx) => (
          <div className="thumbnail-wrapper skeleton" key={idx}>
            <div className="thumbnail-container skeleton-box" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`thumbnail-row ${isAdmin && isEditing ? 'editing' : ''}`}>
      {images.map((img, idx) => {
        const isActive = activeThumbnail === img;
        return (
          <div className={`thumbnail-wrapper ${isActive ? 'is-active' : ''}`} key={`${img}-${idx}`}>
            <div className="thumbnail-container">
              <img
                src={img}
                className="thumbnail"
                onClick={() => onThumbClick?.(idx)}
                draggable={false}
                alt={`Thumbnail ${idx + 1}`}
              />
            </div>

            {/* Delete (only when editing; still hover-only via CSS) */}
            {isAdmin && isEditing && (
              <button
                type="button"
                className="thumbnail-delete"
                aria-label={`Delete image ${idx + 1}`}
                title="Delete"
                onClick={(e) => { e.stopPropagation(); onDeleteImage?.(img); }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {isAdmin && isEditing && (
        <>
          <button
            type="button"
            className="thumbnail-add-tile"
            onClick={openPicker}
            aria-label="Add photos"
            title="Add photos"
          >
            <span className="plus">+</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default ThumbnailRow;
