import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './../Header';
import Footer from './../Footer';
import RecommendedProducts from './RecommendedProducts';
import Ticker from './Ticker';
import arrowIcon from './../../assets/Icons/arrowIcon400.png';
import slide1a from './../../assets/Images/slide-img-v3-1.jpg';
import slide1b from './../../assets/Images/slide-img-v3-2.jpg';
import slide1c from './../../assets/Images/slide-img-v3-5.jpg';
import slide1d from './../../assets/Images/slide-img-v3-6.jpg';


import './Directory.scss';

const Directory = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('preferredTheme') === 'dark'
  );
  const navigate = useNavigate();
  const { t } = useTranslation(['home', 'storefront']);
  const [latestProducts, setLatestProducts] = useState([]);

  const slides = [
    {
      image: slide1a,
      heading: t('slides.fortunate.heading'),
      cta: t('slides.fortunate.cta'),
      link: '/search?term=viewall',
    },
    {
      image: slide1b,
      heading: t('slides.taipei2025.heading'),
      cta: t('slides.taipei2025.cta'),
      link: '/search?term=viewall&cat=Merch',
    },
    {
      image: slide1c,
      heading: t('slides.classics.heading'),
      cta: t('slides.classics.cta'),
      link: '/search?term=viewall&cat=Pantry&origins=Taiwan',
    },
    {
      image: slide1d,
      heading: t('slides.taste.heading'),
      cta: t('slides.taste.cta'),
      link: '/search?term=viewall&origins=Taiwan',
    },
  ];

  const [dragStartX, setDragStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);
  const topSectionRef = useRef(null);
  const [showJoinDoc, setShowJoinDoc] = useState(true);

  useEffect(() => {
    const handleResize = () => setCurrentIndex(0);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getOffset = (index) => {
    const track = trackRef.current;
    if (!track) return 0;
    const slide = track.children[0];
    if (!slide) return 0;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return index * (slideWidth + gap);
  };

  const handleNext = () => {
    const slidesPerView =
      window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 2;
    const maxIndex = slides.length - slidesPerView;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    const slidesPerView =
      window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 2;
    const maxIndex = slides.length - slidesPerView;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleDragStart = (e) => {
    setDragStartX(e.clientX || e.touches[0].clientX);
    setDragging(true);
    setDragOffset(0);
    setDragMoved(false);
  };

  const handleDragMove = (e) => {
    if (!dragging) return;
    const currentX = e.clientX || e.touches[0].clientX;
    const deltaX = currentX - dragStartX;
    if (Math.abs(deltaX) > 5) setDragMoved(true);
    setDragOffset(deltaX);
  };

  const handleDragEnd = () => {
    if (!dragging) return;
    const threshold = 120;
    if (dragOffset > threshold) handlePrev();
    else if (dragOffset < -threshold) handleNext();
    setDragging(false);
    setDragOffset(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    const fetchLatestProducts = async (retry = 0) => {
      try {
        const q = query(
          collection(firestore, 'products'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);

        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLatestProducts(products);
      } catch (err) {
        console.error(`Error fetching latest products (attempt ${retry + 1}):`, err);

        const ua = navigator.userAgent.toLowerCase();
        const isInstagram = ua.includes('instagram');
        const isFacebook = ua.includes('fbav') || ua.includes('fban');

        if ((isInstagram || isFacebook || err.message.includes('Failed to fetch')) && retry < 3) {
          console.warn('Retrying Firestore fetch in 2s...');
          setTimeout(() => fetchLatestProducts(retry + 1), 2000);
        } else {
          console.error('Giving up after multiple retries.');
        }
      }
    };

    fetchLatestProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!topSectionRef.current) return;

      const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
      const windowHeight = window.innerHeight;

      if (topSectionBottom <= windowHeight) {
        setShowJoinDoc(false);
      } else {
        setShowJoinDoc(true);
      }
    };

    // Run immediately on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  return (
    <div className="cg-root">
      <Ticker />
      <div className="directory">
        <Header
          title={t('title')}
          mainPageHeader
          hasSearchBar
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <div className="cg-main">
          <div className="top-section" ref={topSectionRef}>
            <div
              className="slideshow-wrapper"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <button className="nav-btn global prev" onClick={handlePrev}>
                  <img src={arrowIcon} alt="previous" />
              </button>

              <div
                className="carousel-track"
                ref={trackRef}
                style={{
                  transform: `translateX(calc(-${getOffset(
                    currentIndex
                  )}px + ${dragOffset}px))`,
                  transition: dragging ? 'none' : 'transform 0.4s ease-in-out',
                }}
              >
                {slides.map((slide, i) => (
                  <div key={i} className="dir-slide">
                    <img
                      src={slide.image}
                      className="slide-image"
                      alt={`slide-${i}`}
                      draggable="false"
                      onClick={() => {
                        if (!dragMoved) navigate(slide.link);
                      }}
                    />
                    <div className="slide-content">
                      <h2 className="slide-heading">{slide.heading}</h2>
                      <a href={slide.link} className="slide-cta">
                        {slide.cta}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <button className="nav-btn global next" onClick={handleNext}>
                <img src={arrowIcon} alt="next" />
              </button>
            </div>
          </div>

          <RecommendedProducts products={latestProducts} />

          <Footer
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            showFull
          />
        </div>
      </div>
    </div>
  );
};

export default Directory;
