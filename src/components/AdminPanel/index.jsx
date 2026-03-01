// src/components/AdminPanel/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { auth, storage, firestore, getCurrentUser, removeBg } from '../../firebase/utils';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import fumartLogo from '../../assets/fumart-m-red-bg.png';
import './AdminPanel.scss';

/* ---------- Brand helpers: never update if brand already exists ---------- */
// Diacritic-safe slug (may be empty for CJK/emoji etc.)
const asciiSlug = (input = '') => {
  const stripped = String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return stripped || encodeURIComponent(input); // fallback for CJK
};
// Lowercased brand name for case-insensitive matching
const nameLower = (s = '') => String(s).trim().toLowerCase();

// Find an existing brand by asciiSlug OR case-insensitive name
const findExistingBrandRef = async (brandName, firestore) => {
  const slug = asciiSlug(brandName);
  const lowered = nameLower(brandName);

  if (slug) {
    const q1 = query(collection(firestore, 'brands'), where('asciiSlug', '==', slug));
    const s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0].ref;
  }

  const q2 = query(collection(firestore, 'brands'), where('brandNameLower', '==', lowered));
  const s2 = await getDocs(q2);
  if (!s2.empty) return s2.docs[0].ref;

  // Fallback for old docs that may only have brandName
  const q3 = query(collection(firestore, 'brands'), where('brandName', '==', brandName));
  const s3 = await getDocs(q3);
  if (!s3.empty) return s3.docs[0].ref;

  return null;
};



const AdminPanel = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [processedImages, setProcessedImages] = useState([]);
  const [removingBg, setRemovingBg] = useState(false);  
  const [sellerUsername, setSellerUsername] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    subtitle: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    stockQuantity: '',
    sizeLabel: '',
    sku: '',
    tags: '',
    weight: '',
    dimensions: '',
    priceDiscount: '',
    isOnSale: false,
    rating: '',
    reviewCount: '',
    expirationDate: '',
    origin: '',
    ingredients: '',
    instructions: '',
    mediaLink: '',
    images: []
  });

  const [options, setOptions] = useState({
    brands: [],
    categories: [],
    subCategoriesByCategory: {}, 
    origins: []
  });

useEffect(() => {
  const fetchOptions = async () => {
    try {
      const brandSnap = await getDocs(collection(firestore, 'brands'));
      const productSnap = await getDocs(collection(firestore, 'products'));

      const brands = [...new Set(brandSnap.docs.map(d => d.data().brandName || d.data().brand))];
      const categories = [...new Set(productSnap.docs.map(d => d.data().category).filter(Boolean))];

      // 🔹 Build mapping: category → subcategories
      const subCategoriesByCategory = {};
      for (const docSnap of productSnap.docs) {
        const data = docSnap.data();
        if (data.category && data.subCategory) {
          if (!subCategoriesByCategory[data.category]) {
            subCategoriesByCategory[data.category] = new Set();
          }
          subCategoriesByCategory[data.category].add(data.subCategory);
        }
      }

      // Convert sets to arrays
      Object.keys(subCategoriesByCategory).forEach(cat => {
        subCategoriesByCategory[cat] = [...subCategoriesByCategory[cat]];
      });

      const origins = [...new Set(productSnap.docs.map(d => d.data().origin).filter(Boolean))];

      setOptions({
        brands,
        categories,
        subCategoriesByCategory,
        origins
      });
    } catch (err) {
      console.error('Failed to fetch autofill options:', err);
    }
  };
  fetchOptions();
}, []);

  const handleRemoveBackgrounds = async () => {
    // Replace with env var or your utils removeBg() if preferred
    const API_KEY = 'Hz4c9YVHEAL7QWKJRubqjdsj';
    const newImages = [];
    setRemovingBg(true);

    for (const img of formData.images) {
      const formDataData = new FormData();
      formDataData.append('image_file', img);
      formDataData.append('size', 'auto');

      try {
        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: { 'X-Api-Key': API_KEY },
          body: formDataData
        });

        if (!res.ok) throw new Error('Background removal failed');
        const blob = await res.blob();
        const fileName = `bgremoved-${img.name}`;
        const file = new File([blob], fileName, { type: 'image/png' });
        newImages.push(file);
      } catch (err) {
        console.error('Failed to remove background:', err);
        alert('Failed to remove background for one or more images.');
      }
    }

    setFormData((prev) => ({ ...prev, images: newImages }));
    setRemovingBg(false);
  };

  // On mount: auth → fetch user doc → check admin → derive sellerUsername
  useEffect(() => {
    (async () => {
      try {
        const userAuth = await getCurrentUser();
        if (!userAuth) {
          navigate('/login');
          return;
        }

        const userDocRef = doc(firestore, 'users', userAuth.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          console.warn('No user document found for', userAuth.uid);
          navigate('/');
          return;
        }

        const userData = userSnap.data();
        if (userData.userRole !== 'admin') {
          navigate('/');
          return;
        }

        setAuthorized(true);

        // Derive a username for sellBy (user doc → displayName → email local-part → uid)
        const derivedUsername =
          (userData.username && String(userData.username).trim()) ||
          (userData.userName && String(userData.userName).trim()) ||
          (userAuth.displayName && String(userAuth.displayName).trim()) ||
          (userAuth.email ? userAuth.email.split('@')[0] : '') ||
          userAuth.uid;

        setSellerUsername(derivedUsername);
      } catch (err) {
        console.error('Error checking admin access:', err);
        navigate('/');
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.brand ||
      !formData.subtitle ||
      !formData.description ||
      !formData.price ||
      !formData.category ||
      !formData.subCategory
    ) {
      alert('Fill in all required fields.');
      return;
    }
    if (formData.images.length === 0) {
      alert('Please select at least one image.');
      return;
    }

    setUploading(true);
    try {
      // 1) Upload images
      const imageUrls = [];
      for (const img of formData.images) {
        const imgRef = ref(storage, `products/${Date.now()}_${img.name}`);
        const snap = await uploadBytes(imgRef, img);
        const url = await getDownloadURL(snap.ref);
        imageUrls.push(url);
      }

      // Parse numbers once
      const qtyNum = parseInt(formData.stockQuantity, 10) || 0;
      const priceNum = parseFloat(formData.price) || 0;

      /* 2) Brand handling (create only if truly missing) */
      try {
        const brandName = String(formData.brand || '').trim();
        if (brandName) {
          const existingRef = await findExistingBrandRef(brandName, firestore);
          console.log('Existing brand ref:', existingRef?.path || 'none found');
          if (!existingRef) {
            const now = Timestamp.now();
            const slug = asciiSlug(brandName);
            console.log('Brand name:', `"${brandName}"`);

            // If slug is empty (e.g., "哥本优选"), use auto-ID
            await addDoc(collection(firestore, 'brands'), {
              brandName,
              brandNameLower: brandName.toLowerCase(),
              asciiSlug: slug || null,
              imageUrl: imageUrls[0] || '',
              origin: formData.origin || '',
              website: '',
              description: '',
              createdAt: now,
              updatedAt: now
            });
          }
          // If exists: do nothing (no update)
        }
      } catch (brandErr) {
        console.error('Brand check failed:', brandErr);
        // non-blocking
      }

      // 3) Create product
      const productRef = await addDoc(collection(firestore, 'products'), {
        name: formData.name,
        brand: formData.brand,
        subtitle: formData.subtitle,
        description: formData.description,
        price: priceNum,
        category: formData.category,
        subCategory: formData.subCategory,
        stockQuantity: qtyNum,
        sizeLabel: formData.sizeLabel || '',
        sku: formData.sku || '',
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t !== '')
          : [],
        weight: formData.weight || '',
        dimensions: formData.dimensions || '',
        priceDiscount: formData.priceDiscount
          ? parseFloat(formData.priceDiscount)
          : 0,
        isOnSale: !!formData.isOnSale,
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        reviewCount: formData.reviewCount
          ? parseInt(formData.reviewCount, 10)
          : 0,
        expirationDate: formData.expirationDate
          ? Timestamp.fromDate(new Date(formData.expirationDate))
          : null,
        origin: formData.origin || '',
        ingredients: formData.ingredients
          ? formData.ingredients.split(',').map((i) => i.trim()).filter((i) => i !== '')
          : [],
        instructions: formData.instructions || '',
        mediaLink: formData.mediaLink || '',
        images: imageUrls,

        // Init fields
        priceHistory: [],                 // empty price history
        sellBy: [sellerUsername],         // uploader as first seller

        createdAt: Timestamp.now()
      });

      const productId = productRef.id;

      // 4) Update users doc that matches the username: selling.<productId> = [qty, price]
      try {
        let updatedAny = false;

        // Try by 'username'
        const qByUsername = query(collection(firestore, 'users'), where('username', '==', sellerUsername));
        const snapByUsername = await getDocs(qByUsername);
        if (!snapByUsername.empty) {
          await Promise.all(
            snapByUsername.docs.map(d =>
              updateDoc(d.ref, { [`selling.${productId}`]: [qtyNum, priceNum] })
            )
          );
          updatedAny = true;
        }

        // If not found, try 'userName' (alternate field casing)
        if (!updatedAny) {
          const qByUserName = query(collection(firestore, 'users'), where('userName', '==', sellerUsername));
          const snapByUserName = await getDocs(qByUserName);
          if (!snapByUserName.empty) {
            await Promise.all(
              snapByUserName.docs.map(d =>
                updateDoc(d.ref, { [`selling.${productId}`]: [qtyNum, priceNum] })
              )
            );
            updatedAny = true;
          }
        }

        // Fallback: write to the uploader's UID doc
        if (!updatedAny) {
          const uploader = await getCurrentUser();
          if (uploader) {
            await updateDoc(doc(firestore, 'users', uploader.uid), {
              [`selling.${productId}`]: [qtyNum, priceNum]
            });
          }
        }
      } catch (err) {
        console.error('Failed to update user selling map:', err);
        // non-blocking
      }

      alert('Product uploaded!');

      // Reset form state and stepper
      setFormData({
        name: '',
        brand: '',
        subtitle: '',
        description: '',
        price: '',
        category: '',
        subCategory: '',
        stockQuantity: '',
        sizeLabel: '',
        sku: '',
        tags: '',
        weight: '',
        dimensions: '',
        priceDiscount: '',
        isOnSale: false,
        rating: '',
        reviewCount: '',
        expirationDate: '',
        origin: '',
        ingredients: '',
        instructions: '',
        mediaLink: '',
        images: []
      });
      setStep(0);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload product.');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    // Step 1: Basic Info
    <>
      <input
        type="text"
        placeholder="Product Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
        disabled={uploading}
      />

      <input
        type="text"
        placeholder="Brand Name"
        list="brandOptions"
        value={formData.brand}
        onChange={(e) => handleChange('brand', e.target.value)}
        required
        disabled={uploading}
      />
      <datalist id="brandOptions">
        {options.brands.map((b, i) => (
          <option key={i} value={b} />
        ))}
      </datalist>

      <input
        type="text"
        placeholder="Product Subtitle"
        value={formData.subtitle}
        onChange={(e) => handleChange('subtitle', e.target.value)}
        required
        disabled={uploading}
      />
      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => handleChange('price', e.target.value)}
        required
        step="0.01"
        disabled={uploading}
      />
      <input
        type="number"
        placeholder="Stock Quantity"
        value={formData.stockQuantity}
        onChange={(e) => handleChange('stockQuantity', e.target.value)}
        required
        disabled={uploading}
      />

      {/* CATEGORY INPUT */}
      <input
        type="text"
        placeholder="Category"
        list="categoryOptions"
        value={formData.category}
        onChange={(e) => {
          handleChange('category', e.target.value);
          // Reset sub-category when category changes
          handleChange('subCategory', '');
        }}
        required
        disabled={uploading}
      />
      <datalist id="categoryOptions">
        {options.categories.map((c, i) => (
          <option key={i} value={c} />
        ))}
      </datalist>

      {/* SUB-CATEGORY INPUT */}
      <input
        type="text"
        placeholder="Sub-Category"
        list="subCategoryOptions"
        value={formData.subCategory}
        onChange={(e) => handleChange('subCategory', e.target.value)}
        required
        disabled={uploading}
      />
      <datalist id="subCategoryOptions">
        {(options.subCategoriesByCategory[formData.category] || []).map((s, i) => (
          <option key={i} value={s} />
        ))}
      </datalist>

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        required
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Media Link (YouTube, etc)"
        value={formData.mediaLink}
        onChange={(e) => handleChange('mediaLink', e.target.value)}
        disabled={uploading}
      />
    </>,
    // Step 2: Additional Metadata
    <>
      <input
        type="text"
        placeholder="SKU"
        value={formData.sku}
        onChange={(e) => handleChange('sku', e.target.value)}
        disabled={uploading}
      />

      <input
        type="text"
        placeholder="Origin"
        list="originOptions"
        value={formData.origin}
        onChange={(e) => handleChange('origin', e.target.value)}
        disabled={uploading}
      />
      <datalist id="originOptions">
        {options.origins.map((o, i) => (
          <option key={i} value={o} />
        ))}
      </datalist>
      
      <input
        type="text"
        placeholder="Weight"
        value={formData.weight}
        onChange={(e) => handleChange('weight', e.target.value)}
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Size Label"
        value={formData.sizeLabel}
        onChange={(e) => handleChange('sizeLabel', e.target.value)}
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={formData.tags}
        onChange={(e) => handleChange('tags', e.target.value)}
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Dimensions (e.g., 10x5x2cm)"
        value={formData.dimensions}
        onChange={(e) => handleChange('dimensions', e.target.value)}
        disabled={uploading}
      />
    </>,
    // Step 3: Sales & Ratings
    <>
      <input
        type="number"
        placeholder="Discount Price"
        value={formData.priceDiscount}
        onChange={(e) => handleChange('priceDiscount', e.target.value)}
        step="0.01"
        disabled={uploading}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.isOnSale}
          onChange={(e) => handleChange('isOnSale', e.target.checked)}
          disabled={uploading}
        />{' '}
        On Sale
      </label>
      <input
        type="number"
        placeholder="Rating (1-5)"
        value={formData.rating}
        onChange={(e) => handleChange('rating', e.target.value)}
        step="0.1"
        disabled={uploading}
      />
      <input
        type="number"
        placeholder="Review Count"
        value={formData.reviewCount}
        onChange={(e) => handleChange('reviewCount', e.target.value)}
        disabled={uploading}
      />
      <input
        type="date"
        placeholder="Expiration Date"
        value={formData.expirationDate}
        onChange={(e) => handleChange('expirationDate', e.target.value)}
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Ingredients (comma-separated)"
        value={formData.ingredients}
        onChange={(e) => handleChange('ingredients', e.target.value)}
        disabled={uploading}
      />
      <textarea
        placeholder="Instructions"
        value={formData.instructions}
        onChange={(e) => handleChange('instructions', e.target.value)}
        disabled={uploading}
      />
    </>,
    // Step 4: Image Upload
    <>
      <input
        type="file"
        multiple
        onChange={(e) => handleChange('images', Array.from(e.target.files))}
        accept="image/*"
        disabled={uploading}
      />

      {formData.images.length > 0 && (
        <>
          <div className="image-previews">
            {formData.images.map((img, idx) => (
              <div key={idx} className="image-preview">
                <div className="image-wrapper">
                  <img src={URL.createObjectURL(img)} alt={`Preview ${idx}`} />
                </div>
                <div className="cancel-wrapper">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== idx);
                      handleChange('images', newImages);
                    }}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRemoveBackgrounds}
            disabled={uploading || removingBg}
            style={{
              marginTop: '8px',
              backgroundColor: '#e5341d',
              color: '#fff',
              padding: '14px',
              borderRadius: '6px',
              width: '100%',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: removingBg ? 'not-allowed' : 'pointer',
              opacity: removingBg ? 0.6 : 1
            }}
          >
            {removingBg ? 'Removing Backgrounds...' : 'Remove Backgrounds'}
          </button>
        </>
      )}
    </>
  ];

  return (
    <div className="upload-page">
      <div className="upload-card">
        <img
          src={fumartLogo}
          alt="Fü-Mart Logo"
          className="upload-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
        <div className="upload-title">Upload Product</div>

        <div className="progress-container">
          <div className="progress-line">
            <div
              className="progress-fill"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`progress-dot ${idx <= step ? 'active' : ''}`}
              style={{ left: `${(idx / (steps.length - 1)) * 100}%` }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {steps[step]}

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {step > 0 && (
              <button
                className="step-control-btn"
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={uploading}
              >
                Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                className="step-control-btn"
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={uploading}
              >
                Next
              </button>
            ) : (
              <button
                className="step-control-btn"
                type="submit"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Product'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
