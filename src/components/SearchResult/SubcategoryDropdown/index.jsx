import React, { useState, useEffect } from "react";
import categoryPreview from "../../../assets/Images/category-preview.jpg";
import { categoryImages } from "../../../assets/Images/Category/categoryImages";
import "./SubcategoryDropdown.scss";


const SubcategoryDropdown = ({
  subs = [],
  onSelect,
  categoryId,
  setBarHover,
  t,
}) => {
  const mid = Math.ceil(subs.length / 2);
  const firstCol = subs.slice(0, mid);
  const secondCol = subs.slice(mid);
  const [categoryImage, setCategoryImage] = useState(categoryPreview);
  
  useEffect(() => {
    if (!categoryId) {
      setCategoryImage(categoryPreview);
      return;
    }
    //    (Checking categoryId directly)
    if (categoryId.startsWith("__") && categoryId.endsWith("__")) {
      setCategoryImage(categoryPreview);
      return;
    }

    const localImage = categoryImages[categoryId];
    
    if (localImage) {
      setCategoryImage(localImage); // Found a match
    } else {
      setCategoryImage(categoryPreview); // Use fallback
    }
  }, [categoryId]); // This effect now only depends on categoryId

  return (
    <div className="subcategory-dropdown"
      onMouseEnter={() => setBarHover(true)}
      onMouseLeave={() => setBarHover(true)} 
    >
      <div className="subcategory-grid">
        {/* Column 1 */}
        <div className="column">
          {firstCol.map((sub) => (
            <div
              key={sub}
              className="subcategory-item"
              onClick={() => onSelect(sub)}
            >
              {t(sub)}
            </div>
          ))}
        </div>

        {/* Column 2 */}
        <div className="column">
          {secondCol.map((sub) => (
            <div
              key={sub}
              className="subcategory-item"
              onClick={() => onSelect(sub)}
            >
              {t(sub)}
            </div>
          ))}
        </div>

        {/* Column 3 — Image */}
        <div className="category-image">
          {/* {categoryImage && (
            <img
              src={categoryImage}
              alt={`${categoryId} preview`}
              className="cat-img"
              // Fallback just in case the default image also fails
              onError={(e) => (e.currentTarget.src = categoryPreview)}
            />
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryDropdown;