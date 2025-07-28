import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './RecommendedCategories.scss';

import poster1 from './../../../assets/rec-cat-1.png';
import poster2 from './../../../assets/rec-cat-2.png';
import poster3 from './../../../assets/rec-cat-3.png';
import poster7 from './../../../assets/rec-cat-7.png';
// 
import titleDecoration from './../../../assets/title-dec.png';

const categories = [
  {
    nameKey: 'beverages',
    imageUrl: poster3,
    filter: 'beverages'
  },
  {
    nameKey: 'snacks',
    imageUrl: poster1,
    filter: 'snacks'
  },    
  {
    nameKey: 'Pasta & Noodles',
    imageUrl: poster2,
    filter: 'Pasta & Noodles'
  },    
  {
    nameKey: 'Canned Goods',
    imageUrl: poster7,
    filter: 'Canned Goods'
  }
];

const RecommendedCategories = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['home', 'common']);
  const scrollRef = useRef(null);
  const cardWidthRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (filter) => {
    navigate(`/storefront?category=${encodeURIComponent(filter)}`);
  };




useEffect(() => {
  const wrapper = scrollRef.current;
  if (!wrapper) return;

  const cards = wrapper.children;
  if (!cards.length) return;

  let index = 0;
  const totalCards = cards.length;

  const gap = parseInt(
    getComputedStyle(wrapper).columnGap || getComputedStyle(wrapper).gap || '0',
    10
  );
  const cardWidth = cards[0].offsetWidth;

  let intervalId = null;

  const scrollNext = () => {
    if (!wrapper || isHovered) return;

    index = (index + 1) % (totalCards);

    // if(index === totalCards){
    //   index = 0;
    // }

    const scrollLeft = index * (cardWidth + gap);
    wrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  };

  const startInterval = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(scrollNext, 5000);
  };

  const stopInterval = () => {
    if (intervalId) clearInterval(intervalId);
  };

  // start or stop based on hover state
  if (!isHovered) {
    startInterval();
  } else {
    stopInterval();
  }

  return () => stopInterval();
}, [isHovered]);



  return (
    <section className="recommend-categories">
      <div className="suggestion-title">
        <div>{t('featuredCategories')}</div>
      </div>

      <div 
        className="category-wrapper"
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        >
        {categories.map((category, idx) => (
          <a className="category-card" key={idx}>
            <div className="category-image-wrap">
              <img
                src={category.imageUrl}
                alt={t(category.nameKey)}
                onClick={() => handleClick(category.filter)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClick(category.filter)}
              />
            </div>
            <div className="category-text">
              <div className='category-title'>
                <div className='title-wrap'>
                  {t(category.nameKey)}
                </div>
                

              </div>
              <span className="shop-now" onClick={() => handleClick(category.filter)}>
                {t('viewFumartCategory', { category: t(category.nameKey) })}
              </span>
            </div>
          </a>
        ))}
      </div>

    </section>
  );
};

export default RecommendedCategories;
