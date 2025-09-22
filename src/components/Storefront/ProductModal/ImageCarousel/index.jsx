import React, { useEffect, useRef, useState } from 'react';
import './ImageCarousel.scss';

const ImageCarousel = ({
  images = [],
  productName,
  isSoldOut,
  selectedIndex = 0,
  onChangeIndex,
  slideIntervalMs = 5000,
  transitionMs = 400,
}) => {
  // ——— data prep
  const hasLoop = images.length > 1;
  const isSingle = images.length === 1;
  const loopImages = hasLoop ? [images[images.length - 1], ...images, images[0]] : images;

  // ——— loop/animation state
  const [loopIndex, setLoopIndex] = useState(hasLoop ? 1 : 0);
  const [animate, setAnimate] = useState(true);

  // ——— zoom/hover states
  const [zooming, setZooming] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');

  // ——— timing
  const timeoutRef = useRef(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(slideIntervalMs);

  // ——— pause manager
  const pauseReasonsRef = useRef(new Set());
  const [paused, setPaused] = useState(false);

  // ——— progress bar cycle key (force remount to restart CSS anim)
  const [progressCycle, setProgressCycle] = useState(0);

  const clearSlideTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startSlideTimeout = (duration) => {
    clearSlideTimeout();
    remainingRef.current = duration;
    startedAtRef.current = performance.now();
    timeoutRef.current = setTimeout(() => {
      setAnimate(true);
      setLoopIndex((prev) => prev + 1);
    }, duration);
  };

  const addPauseReason = (reason) => {
    const setRef = pauseReasonsRef.current;
    if (setRef.has(reason)) return;
    const wasEmpty = setRef.size === 0;
    setRef.add(reason);
    if (wasEmpty) {
      if (timeoutRef.current) {
        const elapsed = performance.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        clearSlideTimeout();
      }
      setPaused(true);
    }
  };

  const removePauseReason = (reason) => {
    const setRef = pauseReasonsRef.current;
    if (!setRef.has(reason)) return;
    setRef.delete(reason);
    if (setRef.size === 0) {
      if (remainingRef.current <= 10) {
        setPaused(false);
        setAnimate(true);
        setLoopIndex((prev) => prev + 1);
      } else {
        setPaused(false);
        startSlideTimeout(remainingRef.current);
      }
    }
  };

  const handlePointerEnter = () => { setZooming(true); addPauseReason('hover'); };
  const handlePointerLeave = () => { setZooming(false); removePauseReason('hover'); };
  const handleFocus       = () => addPauseReason('focus');
  const handleBlur        = () => removePauseReason('focus');
  const handleTouchStart  = () => addPauseReason('touch');
  const handleTouchEnd    = () => removePauseReason('touch');
  const handleTouchCancel = () => removePauseReason('touch');

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') addPauseReason('hidden');
      else removePauseReason('hidden');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  // ——— single-image guard: kill timers & transitions
  useEffect(() => {
    if (!hasLoop) {
      clearSlideTimeout();
      setAnimate(false);
      setLoopIndex(0);
    }
    return clearSlideTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoop]);

  // ——— sync with parent selectedIndex
  useEffect(() => {
    if (!hasLoop) {
      setLoopIndex(0);
      return;
    }
    const currentReal = (loopIndex - 1 + images.length) % images.length;

    // wrap-around corrections to keep transition direction natural
    if (currentReal === images.length - 1 && selectedIndex === 0) {
      setAnimate(true);
      setLoopIndex(images.length + 1);
      return;
    }
    if (currentReal === 0 && selectedIndex === images.length - 1) {
      setAnimate(true);
      setLoopIndex(0);
      return;
    }

    setAnimate(true);
    setLoopIndex(selectedIndex + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, images.length]);

  // ——— restart timing when slide changes (multi-image only)
  useEffect(() => {
    if (!hasLoop) return;
    clearSlideTimeout();
    remainingRef.current = slideIntervalMs;
    startedAtRef.current = performance.now();

    if (pauseReasonsRef.current.size === 0) {
      setPaused(false);
      startSlideTimeout(slideIntervalMs);
    } else {
      setPaused(true);
    }
    return clearSlideTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoop, slideIntervalMs, loopIndex]);

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!hasLoop) return;

    const lastIdx = loopImages.length - 1;

    if (loopIndex === 0) {
      setAnimate(false);
      setLoopIndex(images.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      onChangeIndex?.(images.length - 1);
      return;
    }

    if (loopIndex === lastIdx) {
      setAnimate(false);
      setLoopIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      onChangeIndex?.(0);
      return;
    }

    const real = (loopIndex - 1 + images.length) % images.length;
    onChangeIndex?.(real);
  };

  const translatePct = -(loopIndex * 100);
  const currentRealIndex = hasLoop ? (loopIndex - 1 + images.length) % images.length : 0;

  // ——— bump cycle when ACTIVE real index changes (restart progress CSS)
  useEffect(() => {
    setProgressCycle((c) => c + 1);
  }, [currentRealIndex]);

  
  const jumpTo = (i) => {
    if (!hasLoop) {
      setAnimate(false);
      setLoopIndex(i);
      onChangeIndex?.(i);
      return;
    }

    const lastIdx = loopImages.length - 1;           // = images.length + 1
    const cur = currentRealIndex;                    // 目前「真實」索引 [0..n-1]

    setAnimate(true);

    if (cur === images.length - 1 && i === 0) {
      // 尾 -> 首：向右滑到「尾端複製」(lastIdx)，transitionEnd 會瞬移到 1
      setLoopIndex(lastIdx);
      onChangeIndex?.(0);
    } else if (cur === 0 && i === images.length - 1) {
      // 首 -> 尾：向左滑到「前端複製」(0)，transitionEnd 會瞬移到 images.length
      setLoopIndex(0);
      onChangeIndex?.(images.length - 1);
    } else {
      // 一般跳轉：直接到 i+1
      setLoopIndex(i + 1);
      onChangeIndex?.(i);
    }

    // 重新啟動自動播放計時
    clearSlideTimeout();
    remainingRef.current = slideIntervalMs;
    startedAtRef.current = performance.now();
    if (pauseReasonsRef.current.size === 0) {
      setPaused(false);
      startSlideTimeout(slideIntervalMs);
    } else {
      setPaused(true);
    }
  };


  const isProgressRunning = hasLoop && !paused;

  return (
    <div
      className="image-carousel"
    >
      <div
        className={`image-container ${zooming ? 'zooming' : ''}`}
        onMouseMove={handleMouseMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {isSingle ? (
          // —— SINGLE IMAGE: static (no slider, no timers) —— //
          images[0] && (
            <img
              src={images[0]}
              alt={productName}
              className="main-image"
              style={{
                transform: zooming ? 'scale(1.8)' : 'scale(1)',
                transformOrigin,
              }}
            />
          )
        ) : (
          // —— MULTI IMAGE: classic looped slider —— //
          <div
            className={`slider-track ${animate ? '' : 'no-anim'}`}
            style={{
              width: `${loopImages.length * 100}%`,
              transform: `translateX(${translatePct}%)`,
              transition: animate ? `transform ${transitionMs}ms ease` : 'none',
              display: 'flex',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {loopImages.map((src, i) => (
              <div className="slide" key={`${src}-${i}`} style={{ flex: '0 0 100%' }}>
                {src && (
                  <img
                    src={src}
                    alt={productName}
                    className="main-image"
                    style={{
                      transform: zooming ? 'scale(1.8)' : 'scale(1)',
                      transformOrigin,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {isSoldOut && <div className="sold-out-overlay" aria-hidden={true} />}
      </div>

      {/* dots only if multiple images */}
      {hasLoop && (
        <div className="carousel-dots" role="tablist" aria-label="Image slides">
          {images.map((_, i) => {
            const active = currentRealIndex === i;
            const playStateClass = active ? (isProgressRunning ? 'is-running' : 'is-paused') : '';
            return (
              <button
                key={`dot-${i}`}
                type="button"
                className={['dot', active ? 'active' : '', playStateClass].join(' ').trim()}
                style={{ '--progressMs': `${slideIntervalMs}ms` }}
                aria-label={`Go to image ${i + 1} of ${images.length}`}
                aria-selected={active}
                role="tab"
                onClick={(e) => { e.stopPropagation(); jumpTo(i); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(i); }
                }}
              >
                {/* keys force re-mount on each cycle to restart the CSS animation */}
                <span className="dot-track" aria-hidden="true" key={`track-${active ? progressCycle : 'x'}`} />
                <span className="dot-bar"   aria-hidden="true" key={`bar-${active ? progressCycle : 'x'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;

