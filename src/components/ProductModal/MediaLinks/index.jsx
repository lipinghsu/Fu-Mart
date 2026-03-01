// src/components/MediaLinks/MediaLinks.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './MediaLinks.scss';
import MediaCard from './MediaCard';

/* ---------------------- URL helpers ---------------------- */
const isYouTube = (url = '') => {
  try { const u = new URL(url); return u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be'); }
  catch { return false; }
};

const isDirectVideo = (url = '') => {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    return p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.ogg');
  } catch { return false; }
};

const isYouTubeShort = (url = '') => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return false;
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[0] === 'shorts';
  } catch { return false; }
};

/* ---------------------- YouTube helpers ---------------------- */
const getYouTubeId = (url = '') => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex((p) => p === 'shorts' || p === 'embed' || p === 'live');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch (_) {}
  return null;
};

/* ---- load YT Iframe API once ---- */
let ytApiPromise;
function loadYouTubeIframeAPI() {
  if (typeof window !== 'undefined' && window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      if (typeof document !== 'undefined') {
        const prev = document.getElementById('yt-iframe-api');
        if (!prev) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
      }
      const onReady = () => resolve(window.YT);
      if (typeof window !== 'undefined' && window.YT && window.YT.Player) return onReady();
      window.onYouTubeIframeAPIReady = onReady;
    });
  }
  return ytApiPromise;
}

const MediaLinks = ({ mediaLink, className = '', isAdmin = false, onSaveLinks }) => {
  const railRef = useRef(null);
  const rootRef = useRef(null);
  const { t } = useTranslation(['storefront']);

  const [openIndex, setOpenIndex] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const iframeRefs = useRef({});
  const registerIframeRef = (idx, el) => { if (el) iframeRefs.current[idx] = el; else delete iframeRefs.current[idx]; };
  const videoRefs = useRef({});
  const registerVideoRef = (idx, el) => { if (el) videoRefs.current[idx] = el; else delete videoRefs.current[idx]; };
  const ytPlayers = useRef({});

  const previewIframeRefs = useRef({});
  const registerPreviewIframeRef = (idx, el) => { if (el) previewIframeRefs.current[idx] = el; else delete previewIframeRefs.current[idx]; };
  const previewVideoRefs = useRef({});
  const registerPreviewVideoRef = (idx, el) => { if (el) previewVideoRefs.current[idx] = el; else delete previewVideoRefs.current[idx]; };
  const previewYTPlayerRef = useRef(null);

  const normalized = useMemo(() => {
    if (!mediaLink) return [];
    const list = Array.isArray(mediaLink) ? mediaLink.filter(Boolean)
      : (typeof mediaLink === 'string' && mediaLink.trim() ? [mediaLink.trim()] : []);
    return list
      .map((link) => {
        const kind = isYouTube(link) ? 'yt' : isDirectVideo(link) ? 'file' : 'other';
        const ytId = kind === 'yt' ? getYouTubeId(link) : null;
        const isShort = kind === 'yt' ? isYouTubeShort(link) : false;
        return { link, kind, ytId, isShort };
      })
      .filter((m) => m.kind === 'yt' || m.kind === 'file')
      .sort((a, b) => Number(b.isShort) - Number(a.isShort));
  }, [mediaLink]);

  const [augLinks, setAugLinks] = useState(normalized);
  useEffect(() => { setAugLinks(normalized); setPreviewIndex(0); }, [normalized]);

  const teardownOpenPlayer = (idx) => {
    if (idx == null) return;
    const yp = ytPlayers.current[idx];
    if (yp) { try { yp.stopVideo?.(); yp.destroy?.(); } catch {} delete ytPlayers.current[idx]; }
    const hv = videoRefs.current[idx];
    if (hv) { try { hv.pause(); } catch {} }
  };

  const lastProgrammaticScroll = useRef(0);
  const PROGRAMMATIC_GRACE_MS = 350;

  const centerToIndex = (idx) => {
    const rail = railRef.current;
    if (idx == null || !rail) return;
    const slot = rail.querySelector(`.suggested-item[data-slot-index="${idx}"]`)
      || rail.querySelector(`.media-card[data-index="${idx}"]`)?.parentElement;
    if (!slot) return;

    const slotCenter = slot.offsetLeft + slot.offsetWidth / 2;
    const targetLeft = Math.max(0, slotCenter - rail.clientWidth / 2);
    lastProgrammaticScroll.current = performance.now();
    rail.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const openToIndex = (idx, { fromScroll = false } = {}) => {
    if (idx == null || !augLinks[idx]) return;
    if (openIndex != null && openIndex !== idx) teardownOpenPlayer(openIndex);
    if (previewYTPlayerRef.current) { try { previewYTPlayerRef.current.pauseVideo?.(); } catch {} }
    setOpenIndex(idx);
    if (!fromScroll) requestAnimationFrame(() => centerToIndex(idx));
    const vid = videoRefs.current[idx];
    if (vid) { try { vid.play(); } catch {} }
  };

  /* ------- Close on outside click ------- */
  useEffect(() => {
    const handler = (e) => {
      if (openIndex == null) return;
      const openEl = rootRef.current?.querySelector(`.media-card.is-open[data-index="${openIndex}"]`);
      if (openEl && !openEl.contains(e.target)) { teardownOpenPlayer(openIndex); setOpenIndex(null); }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [openIndex]);

  /* ------- Ensure YT when open ------- */
  useEffect(() => {
    if (openIndex == null) return;
    const meta = augLinks[openIndex];
    if (!meta || meta.kind !== 'yt') return;

    const containerEl = iframeRefs.current[openIndex];
    if (!containerEl) return;

    let cancelled = false;
    (async () => {
      const YT = await loadYouTubeIframeAPI(); if (cancelled) return;
      const existing = ytPlayers.current[openIndex];
      const playerVars = { autoplay: 1, mute: 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '' };
      const onReady = (ev) => { try { ev.target.playVideo(); } catch {}; requestAnimationFrame(() => centerToIndex(openIndex)); };

      if (existing) {
        try {
          const iframeEl = existing.getIframe && existing.getIframe();
          if (!iframeEl || (iframeEl.parentElement !== containerEl)) {
            existing.destroy();
            ytPlayers.current[openIndex] = new YT.Player(containerEl, { host: 'https://www.youtube-nocookie.com', videoId: meta.ytId, playerVars, events: { onReady } });
          } else {
            existing.loadVideoById({ videoId: meta.ytId });
            try { existing.unMute(); existing.playVideo(); } catch {}
            requestAnimationFrame(() => centerToIndex(openIndex));
          }
        } catch {
          try { existing.destroy(); } catch {}
          ytPlayers.current[openIndex] = new YT.Player(containerEl, { host: 'https://www.youtube-nocookie.com', videoId: meta.ytId, playerVars, events: { onReady } });
        }
      } else {
        ytPlayers.current[openIndex] = new YT.Player(containerEl, { host: 'https://www.youtube-nocookie.com', videoId: meta.ytId, playerVars, events: { onReady } });
      }
    })();
    return () => { cancelled = true; };
  }, [openIndex, augLinks]);

  /* ------- Pause others when one is open ------- */
  useEffect(() => {
    Object.entries(ytPlayers.current).forEach(([idx, player]) => {
      const i = Number(idx); if (openIndex !== i) { try { player.pauseVideo(); } catch {} }
    });
    Object.entries(videoRefs.current).forEach(([idx, vid]) => {
      const i = Number(idx); if (openIndex !== i && vid && !vid.paused) { try { vid.pause(); } catch {} }
    });
  }, [openIndex]);

  /* ------- Center when HTML5 starts playing ------- */
  useEffect(() => {
    if (openIndex == null) return;
    const vid = videoRefs.current[openIndex]; if (!vid) return;
    let done = false;
    const onStart = () => { if (done) return; done = true; centerToIndex(openIndex); };
    vid.addEventListener('playing', onStart, { once: true });
    vid.addEventListener('play', onStart, { once: true });
    requestAnimationFrame(() => centerToIndex(openIndex));
    return () => { vid.removeEventListener('playing', onStart); vid.removeEventListener('play', onStart); };
  }, [openIndex, videoRefs]);

  /* ------- Keep centered on resize/orientation ------- */
  useEffect(() => {
    const onResize = () => { if (openIndex != null) centerToIndex(openIndex); };
    const onOrient = () => { if (openIndex != null) centerToIndex(openIndex); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
    };
  }, [openIndex]);

  /* ------- Preview autoplay & cycle (unchanged) ------- */
  const advancePreview = () => setPreviewIndex((i) => (i + 1) % Math.max(augLinks.length, 1));
  useEffect(() => {
    if (openIndex != null) {
      if (previewYTPlayerRef.current) { try { previewYTPlayerRef.current.destroy(); } catch {} previewYTPlayerRef.current = null; }
      Object.values(previewVideoRefs.current).forEach((vid) => { try { vid.pause(); } catch {} });
      return;
    }
    const meta = augLinks[previewIndex]; if (!meta) return;
    let cancelled = false;

    const forceYTAutoplay = (player) => {
      try { player.mute?.(); player.playVideo?.(); } catch {}
      let tries = 0; const tick = () => {
        if (cancelled) return;
        const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : undefined;
        if (state === 1) return; tries += 1; try { player.playVideo?.(); } catch {}; if (tries < 4) setTimeout(tick, 160);
      }; setTimeout(tick, 100);
    };

    Object.values(previewVideoRefs.current).forEach((vid) => { try { vid.pause(); } catch {} });

    if (meta.kind === 'yt') {
      const containerEl = previewIframeRefs.current[previewIndex]; if (!containerEl) return;
      (async () => {
        const YT = await loadYouTubeIframeAPI(); if (cancelled) return;
        if (previewYTPlayerRef.current) { try { previewYTPlayerRef.current.destroy(); } catch {} previewYTPlayerRef.current = null; }
        previewYTPlayerRef.current = new YT.Player(containerEl, {
          host: 'https://www.youtube-nocookie.com', videoId: meta.ytId,
          playerVars: { autoplay: 1, mute: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '' },
          events: { onReady: (ev) => forceYTAutoplay(ev.target),
            onStateChange: (ev) => { if (ev?.data === 0) advancePreview(); if (ev?.data === -1 || ev?.data === 2 || ev?.data === 5) { try { ev.target.mute(); ev.target.playVideo(); } catch {} } } }
        });
      })();
    } else if (meta.kind === 'file') {
      const vid = previewVideoRefs.current[previewIndex];
      if (vid) {
        const onEnded = () => advancePreview();
        vid.addEventListener('ended', onEnded);
        vid.muted = true; try { vid.currentTime = 0; vid.play(); } catch {}
        let tries = 0; const kick = () => { if (!vid.paused) return; tries += 1; try { vid.play(); } catch {}; if (tries < 3) setTimeout(kick, 150); };
        setTimeout(kick, 120);
        return () => vid.removeEventListener('ended', onEnded);
      }
    }
    return () => { cancelled = true; };
  }, [previewIndex, augLinks, openIndex]);

  /* ------------------ ADMIN ------------------ */
  const persistLinks = async (nextArray) => {
    setErrorMsg('');
    if (!onSaveLinks) return;
    try { setSaving(true); await onSaveLinks(nextArray.map((m) => m.link)); }
    catch (e) { console.error('Save mediaLink failed:', e); setErrorMsg(t('saveFailed') || 'Save failed. Try again.'); }
    finally { setSaving(false); }
  };

  const toMeta = (url) => ({
    link: url,
    kind: isYouTube(url) ? 'yt' : isDirectVideo(url) ? 'file' : 'other',
    ytId: isYouTube(url) ? getYouTubeId(url) : null,
    isShort: isYouTube(url) ? isYouTubeShort(url) : false,
  });

  const handleAddLink = async () => {
    const url = window.prompt(t('enterVideoUrl') || 'Paste a video URL (YouTube or direct .mp4/.webm/.ogg)');
    if (!url) return;
    const meta = toMeta(url.trim()); if (meta.kind === 'other') return;
    const next = [...augLinks, meta].sort((a, b) => Number(b.isShort) - Number(a.isShort));
    setAugLinks(next); await persistLinks(next);
  };

  const handleEditLink = async (index) => {
    const current = augLinks[index]?.link || '';
    const url = window.prompt(t('editVideoUrl') || 'Edit video URL', current); if (!url) return;
    const meta = toMeta(url.trim()); if (meta.kind === 'other') return;
    const next = augLinks.map((m, i) => (i === index ? meta : m)).sort((a, b) => Number(b.isShort) - Number(a.isShort));
    setAugLinks(next); await persistLinks(next);
  };

  const handleDeleteLink = async (index) => {
    const ok = window.confirm(t('confirmDelete') || 'Remove this video?'); if (!ok) return;
    const next = augLinks.filter((_, i) => i !== index);
    setAugLinks(next); await persistLinks(next);
    setPreviewIndex((i) => (next.length ? Math.min(i, next.length - 1) : 0));
  };

  /* --------- AUTO-SWITCH on scroll (still useful when paging is off) --------- */
/* --------- AUTO-SWITCH on scroll (clamped to adjacent when open) --------- */
useEffect(() => {
  const rail = railRef.current; if (!rail) return;
  let raf = null;

  const getNearestIndexFromScroll = () => {
    const children = Array.from(rail.querySelectorAll('.suggested-item'));
    if (!children.length) return null;
    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let bestIdx = 0, bestDist = Infinity;
    children.forEach((el, i) => {
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(elCenter - railCenter);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    return bestIdx;
  };

  const onScroll = () => {
    // Only care when a card is open
    if (openIndex == null) return;

    // Ignore programmatic re-centers for a short grace period
    const now = performance.now();
    if (now - lastProgrammaticScroll.current < PROGRAMMATIC_GRACE_MS) return;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const nearest = getNearestIndexFromScroll();
      if (nearest == null) return;
      if (nearest === openIndex) return;

      // 👇 clamp to adjacent only
      const delta = nearest - openIndex;
      const step = delta > 0 ? +1 : -1;
      const target = Math.min(Math.max(openIndex + step, 0), augLinks.length - 1);

      if (target !== openIndex) {
        openToIndex(target, { fromScroll: true }); // don't double-center inside openToIndex
        // Snap to center explicitly (we intercepted user scroll)
        requestAnimationFrame(() => centerToIndex(target));
      }
    });
  };

  rail.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    rail.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}, [openIndex, augLinks.length]);


  /* ---------------- PAGING-ONLY WHEN OPEN ---------------- */
  useEffect(() => {
    const rail = railRef.current; if (!rail) return;

    // Toggle class to apply min-height & optional snap-stop styling
    if (openIndex != null) rail.classList.add('has-open', 'paging-mode');
    else rail.classList.remove('has-open', 'paging-mode');

    if (openIndex == null) return; // only lock when a card is open

    let cooldown = false;
    const COOLDOWN_MS = 420;
    const SWIPE_THRESHOLD = 48; // px
    const WHEEL_THRESHOLD = 30; // accumulated deltaX

    let touchStartX = 0, touchStartY = 0;

    const go = (dir) => {
      if (cooldown) return;
      const next = Math.min(Math.max((openIndex ?? 0) + dir, 0), augLinks.length - 1);
      if (next === openIndex) return;
      cooldown = true;
      openToIndex(next, { fromScroll: false }); // we will also center
      setTimeout(() => { cooldown = false; }, COOLDOWN_MS);
    };

    // Touch (mobile)
    const onTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      // horizontal intent: prevent default to stop native scroll
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      const changed = e.changedTouches && e.changedTouches[0];
      if (!changed) return;
      const dx = changed.clientX - touchStartX;
      const dy = changed.clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        go(dx < 0 ? +1 : -1);
      }
    };

    // Wheel / trackpad (desktop)
    let wheelAccumX = 0;
    let wheelRAF = null;
    const onWheel = (e) => {
      // If predominantly horizontal, treat as paging gesture
      const absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
      if (absX >= absY) {
        e.preventDefault();
        wheelAccumX += e.deltaX;
        if (wheelRAF) cancelAnimationFrame(wheelRAF);
        wheelRAF = requestAnimationFrame(() => {
          if (wheelAccumX > WHEEL_THRESHOLD) { go(+1); wheelAccumX = 0; }
          else if (wheelAccumX < -WHEEL_THRESHOLD) { go(-1); wheelAccumX = 0; }
        });
      }
    };

    // Attach with passive:false so preventDefault works
    rail.addEventListener('touchstart', onTouchStart, { passive: true });
    rail.addEventListener('touchmove', onTouchMove, { passive: false });
    rail.addEventListener('touchend', onTouchEnd, { passive: true });
    rail.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      rail.removeEventListener('touchstart', onTouchStart);
      rail.removeEventListener('touchmove', onTouchMove);
      rail.removeEventListener('touchend', onTouchEnd);
      rail.removeEventListener('wheel', onWheel);
      if (wheelRAF) cancelAnimationFrame(wheelRAF);
    };
  }, [openIndex, augLinks.length]);

  // pause when tab is backgrounded
  useEffect(() => {
  const onVis = () => {
    if (document.hidden) {
      Object.values(ytPlayers.current).forEach((p) => { try { p.pauseVideo?.(); } catch {} });
      Object.values(videoRefs.current).forEach((v) => { try { v.pause(); } catch {} });
      Object.values(previewVideoRefs.current).forEach((v) => { try { v.pause(); } catch {} });
    }
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}, []);

// Pause/unload off-screen with IntersectionObserver
useEffect(() => {
  const rail = railRef.current;
  if (!rail) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = Number(e.target.getAttribute('data-slot-index'));
      if (!Number.isFinite(idx)) return;

      if (!e.isIntersecting) {
        // Pause everything tied to this slot
        const yp = ytPlayers.current[idx]; if (yp) { try { yp.pauseVideo?.(); } catch {} }
        const hv = videoRefs.current[idx]; if (hv) { try { hv.pause(); } catch {} }
        if (openIndex === idx) { teardownOpenPlayer(idx); setOpenIndex(null); }
      }
    });
  }, { root: rail, threshold: 0.05 });

  // Observe each slot
  const slots = rail.querySelectorAll('.suggested-item');
  slots.forEach((el) => io.observe(el));

  return () => io.disconnect();
}, [augLinks.length, openIndex]);


  /* -------- render -------- */
  if (!augLinks.length) {
    return (
      <div ref={rootRef} className={`media-links ${className}`.trim()}>
        <div className="media-links__header">
          <h2>{t('Product Related Videos')}</h2>
          {isAdmin && (
            <div className="media-links__actions">
              <button type="button" className="ml-btn ml-btn--primary" onClick={handleAddLink} disabled={saving}>
                {saving ? (t('saving') || 'Saving…') : (t('addLink') || 'Add link')}
              </button>
            </div>
          )}
        </div>
        {errorMsg && <div className="ml-error">{errorMsg}</div>}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`media-links ${className}`.trim()}>
      <div className="media-links__header">
        <h2>{t('Product Related Videos')}</h2>
        {isAdmin && (
          <div className="media-links__actions">
            <button type="button" className="ml-btn ml-btn--primary" onClick={handleAddLink} disabled={saving}>
              {saving ? (t('saving') || 'Saving…') : (t('addLink') || 'Add link')}
            </button>
          </div>
        )}
      </div>
      {errorMsg && <div className="ml-error">{errorMsg}</div>}

      <div className="suggested-items horizontal-scroll media-links__rail" ref={railRef}>
        {augLinks.map((meta, i) => {
          const itemKey = `${meta.kind}:${meta.ytId || meta.link}`;
          return (
            <div className={`suggested-item ${openIndex === i ? 'is-open-slot' : ''}`} key={itemKey} data-slot-index={i}>
              {isAdmin && (
                <div className="ml-card-actions">
                  <button type="button" className="ml-icon-btn" title={t('edit') || 'Edit'}
                    onClick={(e) => { e.stopPropagation(); handleEditLink(i); }}>✎</button>
                  <button type="button" className="ml-icon-btn ml-danger" title={t('delete') || 'Delete'}
                    onClick={(e) => { e.stopPropagation(); handleDeleteLink(i); }}>⨯</button>
                </div>
              )}
              <MediaCard
                link={meta.link}
                meta={meta}
                index={i}
                isOpen={openIndex === i}
                onOpen={(idx) => openToIndex(idx, { fromScroll: false })}
                onClose={() => { teardownOpenPlayer(openIndex); setOpenIndex(null); }}
                showPreview={openIndex == null && i === previewIndex}
                onHoverStart={(idx) => { setPreviewIndex(idx); }}
                onHoverEnd={() => {}}
                registerIframeRef={registerIframeRef}
                registerVideoRef={registerVideoRef}
                registerPreviewIframeRef={registerPreviewIframeRef}
                registerPreviewVideoRef={registerPreviewVideoRef}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaLinks;
