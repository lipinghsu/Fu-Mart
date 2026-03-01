import React, { useEffect, useRef, useState, useMemo } from 'react';
import './ImageCarousel.scss';

const ImageCarousel = ({
  images = [],
  productName,
  isSoldOut,
  selectedIndex = 0,
  onChangeIndex,
  slideIntervalMs = 5000,
  transitionMs = 400,
  descriptionHeight = 0, // This prop is from our previous conversation
}) => {
  // ——— data prep
  const hasLoop = images.length > 1;
  const isSingle = images.length === 1;
  const loopImages = hasLoop ? [images[images.length - 1], ...images, images[0]] : images;
  const lastIdx = Math.max(0, loopImages.length - 1); // = images.length + 1 when looping

  // ——— loop/animation state
  const [loopIndex, setLoopIndex] = useState(hasLoop ? 1 : 0); // 1..n are real frames
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

  // ——— one-shot flag to suppress selectedIndex -> loopIndex sync when we initiated it
  const suppressSelectedSyncRef = useRef(false);

  // --- Use CSS Variables from the prop ---
  const dynamicStyles = useMemo(() => {
    if (descriptionHeight > 0) {
      // 📐 Your logic here:
      return {
        '--dynamic-container-height': `${descriptionHeight}px`,
        '--dynamic-image-height': `${descriptionHeight - 64}px`, // Example: 64px smaller
      };
    }
    return {};
  }, [descriptionHeight]);


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

  // --- MODIFIED handlePointerLeave ---
  const handlePointerEnter = () => { addPauseReason('hover'); };
  const handlePointerLeave = () => { 
    removePauseReason('hover'); 
    setZooming(false); // Unconditionally zoom out
    removePauseReason('zoom'); // Remove zoom pause reason
  };

  const handleFocus       = () => addPauseReason('focus');
  const handleBlur        = () => removePauseReason('focus');
  const handleTouchStart  = () => addPauseReason('touch');
  const handleTouchEnd    = () => removePauseReason('touch');
  const handleTouchCancel = () => removePauseReason('touch');

  const handleClick = (e) => {
    e.stopPropagation();
    setZooming(prevZooming => {
      const nextZooming = !prevZooming;
      if (nextZooming) {
        addPauseReason('zoom'); 
      } else {
        removePauseReason('zoom');
      }
      return nextZooming;
    });
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') addPauseReason('hidden');
      else removePauseReason('hidden');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleMouseMove = (e) => {
    if (!zooming) {
      setTransformOrigin('center center');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  // ——— single-image guard
  useEffect(() => {
    if (!hasLoop) {
      clearSlideTimeout();
      setAnimate(false);
      setLoopIndex(0);
    }
    return clearSlideTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoop]);

  // ——— derived: real index & clone status
  const currentRealIndex = hasLoop ? (loopIndex - 1 + images.length) % images.length : 0;
  const isOnClone = hasLoop && (loopIndex === 0 || loopIndex === lastIdx);

  // ——— sync with parent selectedIndex (skip once if we triggered the change locally)
  useEffect(() => {
    if (!hasLoop) {
      setLoopIndex(0);
      return;
    }
    if (suppressSelectedSyncRef.current) {
      suppressSelectedSyncRef.current = false; // ignore the echo from our own onChangeIndex
      return;
    }
    const target = selectedIndex + 1;
    if (target !== loopIndex) {
      setAnimate(true);
      setLoopIndex(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, hasLoop]);

  // ——— restart timing when we land on a REAL slide (never on clones)
  useEffect(() => {
    if (!hasLoop || isOnClone) return;
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
  }, [hasLoop, slideIntervalMs, loopIndex, isOnClone]);

  // ——— handle wrap snapping with double-RAF (no visible pause, no spurious onChangeIndex)
  const reenableAnimNextFrame = () => {
    // ensure the no-anim snap is committed before re-enabling transitions
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  };

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!hasLoop) return;

    // snap from front-clone -> real last
    if (loopIndex === 0) {
      setAnimate(false);
      setLoopIndex(images.length);
      // tell parent we're on the last real slide
      suppressSelectedSyncRef.current = true;
      onChangeIndex?.(images.length - 1);

      // re-enable animation next frame
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      return;
    }

    // snap from end-clone -> real first
    if (loopIndex === lastIdx) {
      setAnimate(false);
      setLoopIndex(1);
      // tell parent we're on the first real slide
      suppressSelectedSyncRef.current = true;
      onChangeIndex?.(0);

      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      return;
    }

    // regular transitions
    onChangeIndex?.(currentRealIndex);
  };

  

  // ——— bump progress animation only when REAL index changes
  useEffect(() => {
    setProgressCycle((c) => c + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRealIndex]);

  // ——— programmatic jump (dots / progress bar)
  const jumpTo = (i) => {
    if (!hasLoop) {
      setAnimate(false);
      setLoopIndex(i);
      onChangeIndex?.(i);
      return;
    }

    const cur = currentRealIndex;
    suppressSelectedSyncRef.current = true; // avoid fighting ourselves

    setAnimate(true);

    if (cur === images.length - 1 && i === 0) {
      // tail -> head: animate to end-clone, then snap to 1 (no onChangeIndex in snap)
      setLoopIndex(lastIdx);
      onChangeIndex?.(0); // reflect active dot immediately
    } else if (cur === 0 && i === images.length - 1) {
      // head -> tail: animate to front-clone, then snap to n
      setLoopIndex(0);
      onChangeIndex?.(images.length - 1);
    } else {
      // normal jump
      setLoopIndex(i + 1);
      onChangeIndex?.(i);
    }
    // autoplay will restart when the real slide is reached (timer effect skips clones)
  };

  const translatePct = -(loopIndex * 100);
  const isProgressRunning = hasLoop && !paused && !isOnClone; // don't run while snapping

  return (
    <div className="image-carousel">
      <div
        className={`image-container ${zooming ? 'zooming' : ''} ${isSoldOut ? 'sold-out' : ''}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave} // This handler now controls zoom out
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={dynamicStyles} // Apply CSS variables
      >
        {isSingle ? (
          images[0] && (
            <img
              src={images[0]}
              alt={productName}
              className={`main-image ${isSoldOut ? 'sold-out' : ''}`}
              style={{
                transform: zooming ? 'scale(1.8)' : 'scale(1)',
                transformOrigin,
              }}
            />
          )
        ) : (
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