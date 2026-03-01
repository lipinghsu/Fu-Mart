// ThumbnailRow.jsx
import React, { useRef, useMemo, useState } from 'react';
import './ThumbnailRow.scss';

const ThumbnailRow = ({
  loading,
  images = [],
  activeIndex,
  activeThumbnail,
  onThumbClick,
  isAdmin,
  isEditing,
  onUploadImages,
  onDeleteImage,
  onReorderImages, // new callback for drag reorder result
}) => {
  const fileInputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const openPicker = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const files = e.target.files;
    if (files && onUploadImages) await onUploadImages(files);
    e.target.value = '';
  };

  const safeActiveIndex = useMemo(() => {
    if (typeof activeIndex !== 'number' || images.length === 0) return undefined;
    const n = images.length;
    return ((activeIndex % n) + n) % n;
  }, [activeIndex, images.length]);

  // --- Drag logic ---
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== dragOverIndex) setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const from = dragIndex;
    const to = index;
    if (from === null || to === null || from === to) return;

    // 🔁 SWAP two items instead of inserting
    const newImages = [...images];
    [newImages[from], newImages[to]] = [newImages[to], newImages[from]];

    setDragIndex(null);
    setDragOverIndex(null);
    if (onReorderImages) onReorderImages(newImages);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    const skeletonCount = images.length > 0 ? images.length : 4;
    return (
      <div className="thumbnail-row">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div className="thumbnail-wrapper skeleton" key={`skeleton-${idx}`}>
            <div className="thumbnail-container skeleton-box" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`thumbnail-row ${isAdmin && isEditing ? 'editing' : ''}`}
      role="tablist"
      aria-label="Thumbnails"
    >
      {images.map((img, idx) => {
        const isActive =
          typeof safeActiveIndex === 'number'
            ? safeActiveIndex === idx
            : activeThumbnail === img;

        const isDragOver = idx === dragOverIndex && dragIndex !== null;

        return (
          <div
            className={`thumbnail-wrapper ${isActive ? 'is-active' : ''} ${
              isDragOver ? 'drag-over' : ''
            }`}
            key={`thumb-${idx}`}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            aria-selected={isActive}
            role="tab"
            data-index={idx}
          >
            <div className="thumbnail-container">
              <img
                src={img}
                className="thumbnail"
                onClick={() => onThumbClick?.(idx)}
                draggable={false}
                alt={`Thumbnail ${idx + 1}`}
              />
            </div>

            {isAdmin && isEditing && (
              <button
                type="button"
                className="thumbnail-delete"
                aria-label={`Delete image ${idx + 1}`}
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteImage?.(img);
                }}
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
