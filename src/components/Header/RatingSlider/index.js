import React, { useState, useEffect } from "react";
import './styles.scss';

const ratingOptions = [
  { id: 1, value: '1', label: 'Bad' },
  { id: 2, value: '2', label: 'Fair' },
  { id: 3, value: '3', label: 'Good' },
  { id: 4, value: '4', label: 'Great' },
  { id: 5, value: '5', label: 'Superb' }
];

export default function RatingSlider({ onChange, className, value }) {
  const [hovered, setHovered] = useState(null);
  const [current, setCurrent] = useState(value || null);

  // Update the current rating when the value prop changes
  useEffect(() => {
    setCurrent(value);
  }, [value]);

  function handleMouseEnter(rating) {
    setHovered(rating.id);
  }

  function handleMouseLeave() {
    setHovered(null);
  }

  function handleSelectedButton(rating) {
    const newRating = rating.id === current ? null : rating.id; // Toggle rating
    setCurrent(newRating);
    if (onChange) {
      onChange(newRating ? rating.value : null); // Send the updated value or null to the parent
    }
  }

  // Determine the label text based on hovered or selected rating
  const getLabel = () => {
    if (hovered !== null) {
      return ratingOptions.find(option => option.id === hovered)?.label || 'Rating';
    }
    if (current !== null) {
      return ratingOptions.find(option => option.id === current)?.label || 'Rating';
    }
    return 'Rating';
  };

  return (
    <>
      <div className="slider-label">{getLabel()}</div>
      <div className="button-group-container">
        {ratingOptions.map((ratingOption) => {
          const isActive = current >= ratingOption.id;
          const buttonClass = `button-container ${className} ${isActive ? " active" : ""} ${hovered ? ` hovered-${hovered}` : ""}`;
          return (
            <div
              className={buttonClass}
              key={ratingOption.id}
              onClick={() => handleSelectedButton(ratingOption)}
              onMouseEnter={() => handleMouseEnter(ratingOption)}
              onMouseLeave={handleMouseLeave}
            >
              {/* <div className="button"></div> */}
            </div>
          );
        })}
      </div>
    </>
  );
}
