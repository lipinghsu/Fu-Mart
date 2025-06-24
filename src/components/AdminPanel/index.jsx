import React, { useState, useEffect } from 'react';
import { auth, storage, firestore, getCurrentUser } from '../../firebase/utils';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import fumartLogo from '../../assets/fumart-m-red-bg.png';
import './AdminPanel.scss';

const AdminPanel = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // 1) On mount, wait for Auth → getCurrentUser() → then fetch userDoc → check userRole
  useEffect(() => {
    (async () => {
      try {
        const userAuth = await getCurrentUser(); 
        if (!userAuth) {
          // Not signed in at all
          navigate('/login');
          return;
        }

        // Fetch this user’s Firestore document:
        const userDocRef = doc(firestore, 'users', userAuth.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          // No user doc in Firestore (shouldn’t happen if you create one on signup)
          console.warn('No user document found for', userAuth.uid);
          navigate('/');
          return;
        }

        const userData = userSnap.data();
        console.log(userData.userRole);
        console.log(userData.userRole);
        console.log(userData.userRole);
        // If your user document has `userRole: "admin"`:
        if (userData.userRole !== 'admin') {
          // Not an admin → redirect away
          navigate('/');
          return;
        }

        // If it passed the check, allow them to see the panel:
        setAuthorized(true);
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
      // 1. Upload each image to Storage → /products/…
      const imageUrls = [];
      for (const img of formData.images) {
        const imgRef = ref(storage, `products/${Date.now()}_${img.name}`);
        // console.log("About to upload", imgRef.fullPath);
        const snap = await uploadBytes(imgRef, img);
        // console.log("Upload succeeded!", snap.ref.fullPath);
        const url = await getDownloadURL(snap.ref);
        // console.log(url);
        imageUrls.push(url);
      }
      // console.log(url)

      // 2. Write a new document in Firestore under “products” collection
      //    Use “stockQuantity” instead of the old “stockQuantity” field.
      await addDoc(collection(firestore, 'products'), {
        name: formData.name,
        brand: formData.brand,
        subtitle: formData.subtitle,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        subCategory: formData.subCategory,
        stockQuantity: parseInt(formData.stockQuantity, 10),
        sizeLabel: formData.sizeLabel,
        sku: formData.sku,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
        weight: formData.weight,
        dimensions: formData.dimensions,
        priceDiscount: formData.priceDiscount
          ? parseFloat(formData.priceDiscount)
          : 0,
        isOnSale: formData.isOnSale,
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        reviewCount: formData.reviewCount
          ? parseInt(formData.reviewCount, 10)
          : 0,
        expirationDate: formData.expirationDate
          ? Timestamp.fromDate(new Date(formData.expirationDate))
          : null,
        origin: formData.origin,
        ingredients: formData.ingredients
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i !== ''),
        instructions: formData.instructions,
        mediaLink: formData.mediaLink,
        images: imageUrls,
        createdAt: Timestamp.now()
      });

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
        value={formData.brand}
        onChange={(e) => handleChange('brand', e.target.value)}
        required
        disabled={uploading}
      />
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
      <input
        type="text"
        placeholder="Category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        required
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Sub-Category"
        value={formData.subCategory}
        onChange={(e) => handleChange('subCategory', e.target.value)}
        required
        disabled={uploading}
      />
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
        value={formData.origin}
        onChange={(e) => handleChange('origin', e.target.value)}
        disabled={uploading}
      />
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
              <button type="submit" disabled={uploading}>
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
