import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from '../ProductModal';
import BrowseTitle from './BrowseTitle';
import './Storefront.scss';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/utils';

const UNKNOWN_ORIGIN_KEY = '__UNKNOWN_ORIGIN__';

const Storefront = () => {
  const { t, i18n, ready } = useTranslation(['storefront', 'common']);
  const navigate = useNavigate();

  const [brandCounts, setBrandCounts] = useState({});
  const [groupCounts, setGroupCounts] = useState({});
  const [productsByGroup, setProductsByGroup] = useState({});
  const [brandsByOrigin, setBrandsByOrigin] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productsPerBrandCount, setProductsPerBrandCount] = useState({});

  // 'category' | 'origin' | 'brand'
  const [filterBy, setFilterBy] = useState('category');

  // ---- Admin flag (claims/role/overrides) ----
  const [isAdmin, setIsAdmin] = useState(false);

  const brandKey = (s = '') =>
  String(s)
    .normalize('NFKC')                 // 統一全半形/Unicode
    .replace(/[’‘]/g, "'")             // 彎引號 -> 一般 '
    .replace(/[“”]/g, '"')             // 彎雙引號 -> "
    .replace(/\s+/g, ' ')              // 多空白 -> 單空白
    .trim()
    .toLowerCase();

  useEffect(() => {
    // Dev/QA overrides
    const params = new URLSearchParams(window.location.search);
    const override =
      params.get('admin') === '1' ||
      localStorage.getItem('forceAdmin') === '1' ||
      (localStorage.getItem('userRole') || '').toLowerCase() === 'admin';
    if (override) setIsAdmin(true);
    
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(override || false);
        return;
      }
      try {
        const token = await user.getIdTokenResult(true);
        const claims = token?.claims || {};
        const byClaims =
          !!claims.admin ||
          (typeof claims.role === 'string' && claims.role.toLowerCase() === 'admin') ||
          (Array.isArray(claims.roles) && claims.roles.map(x => String(x).toLowerCase()).includes('admin'));

        // Firestore fallback
        let byFirestore = false;
        try {
          const snap = await getDoc(doc(firestore, 'users', user.uid));
          if (snap.exists()) {
            const u = snap.data() || {};
            const fsRole = String(u.role || '').toLowerCase();
            const fsRoles = Array.isArray(u.roles) ? u.roles.map(x => String(x).toLowerCase()) : [];
            const fsBool = !!u.isAdmin;
            byFirestore = fsRole === 'admin' || fsRoles.includes('admin') || fsBool;
          }
        } catch (_) {}

        const devUserRole = (localStorage.getItem('userRole') || '').toLowerCase() === 'admin';
        const devForce = localStorage.getItem('forceAdmin') === '1';

        const result = override || byClaims || byFirestore || devUserRole || devForce;
        setIsAdmin(result);
        console.log('[Storefront Admin check]', { result });
      } catch (e) {
        console.warn('getIdTokenResult failed:', e);
        setIsAdmin(override);
      }
    });

    return () => unsub();
  }, []);


  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filterBy');
    if (filterParam) {
      setFilterBy(filterParam);
    }
  }, [location.search]);

  // ---- Upload state ----
  const [uploadingBrandId, setUploadingBrandId] = useState(null);
  const fileInputRef = useRef(null);
  const pendingBrandRef = useRef(null); // which brand to update when file chosen

  // ---------- Data fetch ----------
  useEffect(() => {
    if (selectedProduct) return; // prevent reload when modal ope

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        if (filterBy === 'brand') {
          // Fetch Brands AND Products (to calculate counts)
          const [brandSnapshot, productSnapshot] = await Promise.all([
            getDocs(collection(firestore, 'brands')),
            getDocs(collection(firestore, 'products'))
          ]);

          const brands = brandSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // --- NEW: Calculate Product Counts per Brand ---
          const pCounts = {};
          productSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            // Ensure product is not hidden and has a brand name
            if (!data.hidden && data.brand) {
              const key = brandKey(data.brand);
              if (key) pCounts[key] = (pCounts[key] || 0) + 1;
            }
          });
          // -----------------------------------------------

          // group by origin (Existing Logic)
          const grouped = {};
          for (const b of brands) {
            const raw = b.origin;
            const key =
              (typeof raw === 'string' && raw.trim()) ? raw.trim() : UNKNOWN_ORIGIN_KEY;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(b);
          }

          const originCounts = {};
          Object.entries(grouped).forEach(([k, v]) => {
            originCounts[k] = v.filter((brand) => {
              const c =
                pCounts[brandKey(brand.brandName)] ??
                pCounts[brandKey(brand.id)] ??
                0;
              return c > 0;
            }).length;
          });

          // sort by number of brands, then alphabetically
          const sortedGrouped = {};
          const keys = Object.keys(grouped).sort((a, b) => {
            const countDiff = (originCounts[b] || 0) - (originCounts[a] || 0);
            if (countDiff !== 0) return countDiff;
            if (a === UNKNOWN_ORIGIN_KEY) return 1;
            if (b === UNKNOWN_ORIGIN_KEY) return -1;
            return a.localeCompare(b);
          });

          for (const k of keys) {
            sortedGrouped[k] = grouped[k].slice().sort((a, b) =>
              String(a.brandName || a.id || '').localeCompare(String(b.brandName || b.id || ''))
            );
          }

          if (!cancelled) {
            setBrandsByOrigin(sortedGrouped);
            setProductsByGroup({});
            setBrandCounts(originCounts); 
            setProductsPerBrandCount(pCounts); // <--- Save counts to state
          }
        }
        else {
          // 取 products，依 category / origin 分組 → 每組一行產品橫捲（你原來的行為）
          const snapshot = await getDocs(collection(firestore, 'products'));
          const products = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => !p.hidden);

          const grouped = {};
          products.forEach(product => {
            const rawKey = product[filterBy];
            const safeKey =
              (typeof rawKey === 'string' && rawKey.trim()) ||
              t('uncategorized');
            if (!grouped[safeKey]) grouped[safeKey] = [];
            grouped[safeKey].push(product);
          });

          const shuffledAndSorted = {};
          const groupCounts = {}; // new
          for (const [group, items] of Object.entries(grouped)) {
            groupCounts[group] = items.length; // store original size
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            shuffledAndSorted[group] = shuffled
              .slice(0, 8)
              .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
          }
          if (!cancelled) {
            setProductsByGroup(shuffledAndSorted);
            setBrandsByOrigin({});
            setGroupCounts(groupCounts); // new state
          }
        }
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [ready, filterBy, t]);

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  const handleViewAll = (groupKey) => {
    if (filterBy === 'category') {
      navigate(`/search?term=viewall&cat=${encodeURIComponent(groupKey)}`);
    } 
    else if (filterBy === 'origin') {
      navigate(`/search?term=viewall&origins=${encodeURIComponent(groupKey)}`);
    } 
    else if (filterBy === 'brand') {
      navigate(`/search?term=viewall&brands=${encodeURIComponent(groupKey)}`);
    } 
    else {
      navigate(`/search?term=viewall`);
    }
  };

  const NEEDS_THE_EN = new Set([
      'united states', 'united kingdom', 'netherlands', 'philippines',
      'czech republic', 'united arab emirates', 'dominican republic',
      'bahamas', 'gambia', 'maldives', 'seychelles', 'marshall islands',
      'solomon islands', 'central african republic',
      'democratic republic of the congo', 'republic of the congo', 'congo'
    ]);

    const withDefiniteArticleEn = (country = '') => {
      if (!country) return country;
      if (/^\s*the\s/i.test(country)) return country; // avoid double "the"
      return NEEDS_THE_EN.has(country.trim().toLowerCase())
        ? `the ${country.trim()}`
        : country.trim();
    };

  // Don’t translate brand names; do translate categories/origins for products
  const renderGroupLabel = (key) => {
    if (filterBy === 'brand') {
      const isUnknown = key === UNKNOWN_ORIGIN_KEY || !String(key).trim();
      const raw = isUnknown ? (t('unknownOrigin') || 'Unknown Origin') : String(key);
      const country = i18n.language?.startsWith('en')
        ? withDefiniteArticleEn(raw)
        : raw;
      return t('brandsFrom', { country }); // e.g., "Brands from {{country}}"
    }
    // non-brand groups still go through i18n normally
    return t(key);
  };



  // ----------------- Admin: brand image update -----------------
  const handleClickEditBrandImage = (e, brand) => {
    e.stopPropagation();
    pendingBrandRef.current = brand;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChosen = async (e) => {
    const brand = pendingBrandRef.current;
    if (!brand) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBrandId(brand.id);
      const storage = getStorage();
      const path = `brands/${brand.id}/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);

      await updateDoc(doc(firestore, 'brands', brand.id), {
        imageUrl: url,
        updatedAt: new Date()
      });

      // 更新本地 UI
      setBrandsByOrigin(prev => {
        const next = {};
        for (const [okey, arr] of Object.entries(prev)) {
          next[okey] = arr.map(b => (b.id === brand.id ? { ...b, imageUrl: url } : b));
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to upload/update brand image:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingBrandId(null);
      pendingBrandRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('preferredTheme') === 'dark';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('preferredTheme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // ---- Admin: edit brand name/origin/country ----
  const handleEditBrand = async (e, brand) => {
    e.stopPropagation();

    const newName = prompt('Enter new brand name:', brand.brandName || '');
    if (newName === null) return;

    // const newOrigin = prompt('Enter new origin (region, e.g., East Asia):', brand.origin || '');
    // if (newOrigin === null) return;

    const newCountry = prompt('Enter new country (e.g., Japan):', brand.country || '');
    if (newCountry === null) return;

    try {
      await updateDoc(doc(firestore, 'brands', brand.id), {
        brandName: newName.trim(),
        origin: newOrigin.trim(),
        country: newCountry.trim(),
        updatedAt: new Date(),
      });

      // Update UI immediately
      setBrandsByOrigin(prev => {
        const next = {};
        for (const [okey, arr] of Object.entries(prev)) {
          next[okey] = arr.map(b =>
            b.id === brand.id
              ? {
                  ...b,
                  brandName: newName.trim(),
                  origin: newOrigin.trim(),
                  country: newCountry.trim(),
                }
              : b
          );
        }
        return next;
      });

      alert('Brand updated successfully.');
    } catch (err) {
      console.error('Failed to update brand:', err);
      alert('Update failed.');
    }
  };

  const handleDeleteBrand = async (e, brand) => {
    e.stopPropagation();
    if (!window.confirm(`Delete brand "${brand.brandName}"? This cannot be undone.`))
      return;

    try {
      await deleteDoc(doc(firestore, 'brands', brand.id));

      setBrandsByOrigin(prev => {
        const next = {};
        for (const [okey, arr] of Object.entries(prev)) {
          next[okey] = arr.filter(b => b.id !== brand.id);
        }
        return next;
      });

      alert('Brand deleted successfully.');
    } catch (err) {
      console.error('Failed to delete brand:', err);
      alert('Delete failed.');
    }
  };

  const handleToggleInvert = async (e, brand) => {
    e.stopPropagation();
    const nextInvert = !(brand?.invert === true);

    try {
      await updateDoc(doc(firestore, 'brands', brand.id), {
        invert: nextInvert,
        updatedAt: new Date(),
      });

      // Update UI immediately
      setBrandsByOrigin((prev) => {
        const next = {};
        for (const [okey, arr] of Object.entries(prev)) {
          next[okey] = arr.map((b) =>
            b.id === brand.id ? { ...b, invert: nextInvert } : b
          );
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle invert:', err);
      alert('Update failed.');
    }
  };


  return (
    <div className={`product-list ${isAdmin ? 'admin-mode' : ''}`}>
      <Header 
        mainPageHeader 
        hasSearchBar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <BrowseTitle
        filterBy={filterBy}
        setFilterBy={(newFilter) => {
          setFilterBy(newFilter);
          const params = new URLSearchParams(window.location.search);
          params.set('filterBy', newFilter);
          navigate(`${location.pathname}?${params.toString()}`, { replace: true });
        }}
      />
    
      {/* Hidden file input for admin uploads */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={handleFileChosen}
        />
      )}

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div className="product-image-wrap"><div className="skeleton-image" /></div>
              <div className="product-info">
                <div className="skeleton-text name" />
                <div className="skeleton-text subtitle" />
                <div className="skeleton-text price" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ---- 品牌模式：依「產地」分組，水平捲動 ---- */}
          {filterBy === 'brand' &&
            Object.entries(brandsByOrigin).map(([originKey, brands]) => {
              if ((brandCounts[originKey] || 0) === 0) return null;
              const isUnknown = originKey === UNKNOWN_ORIGIN_KEY;
              const label = isUnknown ? (t('unknownOrigin') || 'Unknown Origin') : originKey;

              return (
                <section className="latest-products brand-section" key={`origin-${originKey}`}>
                  <div className="latest-products-title">
                    <div className="title-left">
                      <span>{renderGroupLabel(originKey)}</span>
                      <span className="item-count">({brandCounts[originKey] || 0})</span>
                    </div>
                  </div>

                  <div className="brand-scroll latest-product-list horizontal-scroll">
                  {(brands ?? [])
                    .filter((brand) => {
                      const count =
                        productsPerBrandCount[brandKey(brand.brandName)] ??
                        productsPerBrandCount[brandKey(brand.id)] ??
                        0;
                      return count > 0;
                    })
                    .map((brand) => (
                      <div
                        className={`brand-card brand-card--scroll ${uploadingBrandId === brand.brandName ? 'is-uploading' : ''}`}
                        key={brand.brandName}
                        onClick={() => {
                          const brandParam = brand.brandName.replace(/-/g, '+');
                          navigate(`/search?term=viewall&brands=${brandParam}`);
                        }}
                      >
                        {/* Admin edit button */}
                        {isAdmin && (
                          <div className="brand-admin-actions">
                            <button
                              className={`brand-edit-btn ${brand.invert ? 'is-active' : ''}`}
                              title={`Invert logo: ${brand.invert ? 'ON' : 'OFF'}`}
                              onClick={(e) => handleToggleInvert(e, brand)}
                            >
                              ⊘
                            </button>
                            <button
                              className="brand-edit-btn"
                              title="Edit brand image"
                              onClick={(e) => handleClickEditBrandImage(e, brand)}
                            >
                              📸
                            </button>

                            <button
                              className="brand-edit-btn"
                              title="Edit brand name / origin / country"
                              onClick={(e) => handleEditBrand(e, brand)}
                            >
                              ✎
                            </button>

                            <button
                              className="brand-delete-btn"
                              title="Delete brand"
                              onClick={(e) => handleDeleteBrand(e, brand)}
                            >
                              🗑
                            </button>
                          </div>
                        )}
                        {brand.imageUrl ? (
                          <img
                            src={brand.imageUrl}
                            alt={brand.brandName || brand.id}
                            className={`brand-image ${brand.invert ? 'brand-image--invert' : ''}`}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="brand-image placeholder">
                            {(brand.brandName || brand.id || '?').slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="brand-name">{brand.brandName || brand.id}</div>
                        <div className="brand-product-count">
                          {productsPerBrandCount[brandKey(brand.brandName)] ?? productsPerBrandCount[brandKey(brand.id)] ?? 0} 
                          &nbsp;
                          {t('products', { defaultValue: 'products' })}
                        </div>

                        {uploadingBrandId === brand.id && (
                          <div className="uploading-overlay">
                            <div className="spinner" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                </section>
              );
            })
          }

          {/* ---- 產品模式（category/origin）：每組標題 + 橫捲 ---- */}
          {filterBy !== 'brand' &&
            Object.entries(productsByGroup)
              .sort(([a], [b]) => {
                const countA = groupCounts[a] || 0;
                const countB = groupCounts[b] || 0;
                // sort by descending count, then alphabetically
                if (countB !== countA) return countB - countA;
                return a.localeCompare(b);
              })
              .map(([groupKey, items]) => (
                <div className="latest-products styled-latest-products" key={`${filterBy}-${groupKey}`}>
                  <div className="latest-products-title">
                    <div className="title-left">
                      <span>{renderGroupLabel(groupKey)}</span>
                      <span className="item-count">({groupCounts[groupKey] || 0})</span>
                    </div>
                  </div>


                  <div className="latest-product-list horizontal-scroll">
                    {items.map(product => (
                      <div className="latest-product-item" key={product.id}>
                        <ProductCard
                          product={product}
                          onClick={() => setSelectedProduct(product)}
                          t={t}
                        />
                      </div>
                    ))}
                    <div
                      className="latest-product-item view-all-card"
                      onClick={() => handleViewAll(groupKey)}
                    >
                      <div className="view-all-content">
                        <span>{t('exploreCategoryAisle')}</span>
                        <br />
                        <span>{filterBy === 'brand' ? groupKey : t(groupKey)}</span>
                        <span>{t('aisle')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          }

        </>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isDarkMode={isDarkMode}
          allProducts={Object.values(productsByGroup).flat()}
          setSelectedProduct={setSelectedProduct}
          onSelectSuggested={p => setSelectedProduct(p)} 
          onAddToCart={(p, q) => console.log('Add to cart:', p, q)}
          onBuyNow={(p, q) => console.log('Buy now:', p, q)}
        />
      )}

      <Footer
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </div>
  );
};

export default Storefront;
