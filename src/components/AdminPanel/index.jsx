import React, { useState } from 'react';
import { firestore, storage } from '../../firebase/utils';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fumartLogo from '../../assets/fumart-m-t-bg.png';
import './AdminPanel.scss';

const AdminPanel = () => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState(''); // NEW brand state
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !brand || !subtitle || !description || !price || !category || !subCategory) {
      alert('Fill in all fields.');
      return;
    }
    if (images.length === 0) {
      alert('Please select at least one image.');
      return;
    }
    setUploading(true);

    const imageUrls = [];
    try {
      for (const img of images) {
        const imgRef = ref(storage, `products/${Date.now()}_${img.name}`);
        const snap = await uploadBytes(imgRef, img);
        const url = await getDownloadURL(snap.ref);
        imageUrls.push(url);
      }

      await addDoc(collection(firestore, 'products'), {
        name,
        brand, // NEW field added to Firestore
        subtitle,
        description,
        price: parseFloat(price),
        category,
        subCategory,
        images: imageUrls,
        createdAt: Timestamp.now()
      });

      alert('Product uploaded!');
      setName('');
      setBrand('');
      setSubtitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setSubCategory('');
      setImages([]);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload product.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src={fumartLogo}
          alt="Fü-Mart Logo"
          className="login-logo"
          style={{ cursor: 'pointer' }}
        />
        <div className="login-title">Upload Product</div>
        <p className="login-subtitle">Provide the details for the new product below</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Brand Name"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Product Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            required
            disabled={uploading}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={uploading}
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            step="0.01"
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Sub-Category"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
            disabled={uploading}
          />
          <input
            type="file"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files))}
            accept="image/*"
            disabled={uploading}
          />

          {images.length > 0 && (
            <div className="image-previews">
              {images.map((img, idx) => (
                <div key={idx} className="image-preview">
                  <div className="image-wrapper">
                    <img src={URL.createObjectURL(img)} alt={`Preview ${idx}`} />
                  </div>
                  <div className="cancel-wrapper">
                    <div
                        type="button"
                        className="cancel-button"
                        onClick={() => {
                        const newImages = images.filter((_, i) => i !== idx);
                        setImages(newImages);
                        }}
                        disabled={uploading}
                    >
                        ✕
                    </div>
                    </div>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
