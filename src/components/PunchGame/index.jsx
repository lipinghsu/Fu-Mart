// src/components/PunchGame/PunchGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./PunchGame.scss";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/utils";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { onAuthStateChanged } from "firebase/auth";

const COLLECTION_NAME = "products";
const PRICE_FIELD = "price";
const IMAGE_FIELD = "images";
const TITLE_FIELD = "name";
const GRID_SIZE = 8;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const MAX_FETCH = 200;

// 🔠 Generate random 8-character alphanumeric coupon (upper + lower + digits)
function generateCouponCode(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 🔀 Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PunchGame = () => {
  const [loading, setLoading] = useState(true);
  const [punched, setPunched] = useState(Array(CELL_COUNT).fill(false));
  const [giftPool, setGiftPool] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [couponCopied, setCouponCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 🔐 Listen for login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 1️⃣ Load products from Firestore (only if logged in)
  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError("");
      try {
        const qRef = query(
          collection(firestore, COLLECTION_NAME),
          where(PRICE_FIELD, ">=", 0),
          where(PRICE_FIELD, "<=", 10),
          limit(MAX_FETCH)
        );
        const snap = await getDocs(qRef);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const shuffled = shuffle(items);

        let pool = [];
        if (shuffled.length >= CELL_COUNT) {
          pool = shuffled.slice(0, CELL_COUNT);
        } else {
          while (pool.length < CELL_COUNT) {
            pool = pool.concat(shuffle(shuffled)).slice(0, CELL_COUNT);
          }
        }
        setGiftPool(pool);
      } catch (e) {
        console.error(e);
        setError("Failed to load gifts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) load();
  }, [currentUser]);

  const gridIndices = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, i) => i),
    []
  );

  // 2️⃣ Handle punch (only 1 punch allowed)
  const handlePunch = async (index) => {
    if (!currentUser) return;
    if (loading || punched.some((p) => p)) return; // only one punch total
    const next = [...punched];
    next[index] = true;
    setPunched(next);

    const gift = giftPool[index] || null;
    if (!gift) return;

    // 🧾 Generate 8-character coupon
    const code = generateCouponCode();

    // 💾 Save coupon to Firestore
    try {
      const couponRef = doc(firestore, "coupons", code);
      await setDoc(couponRef, {
        code,
        productId: gift.id,
        productName: gift[TITLE_FIELD],
        discountType: "fixed",
        amount: gift[PRICE_FIELD],
        isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(
          new Date().setDate(new Date().getDate() + 7)
        ).toISOString(),
        userId: currentUser.uid,
      });
    } catch (err) {
      console.error("Error saving coupon:", err);
    }

    // 🛒 Auto-add gifted item to cart (Redux + localStorage)
    const imageUrl =
      Array.isArray(gift[IMAGE_FIELD]) && gift[IMAGE_FIELD].length > 0
        ? gift[IMAGE_FIELD][0]
        : "";

    const giftedItem = {
      ...gift,
      imageUrl,
      addedQuantity: 1,
      fromGame: true,
      couponCode: code,
      createdAt: gift.createdAt || new Date().toISOString(),
    };

    dispatch(addToCart(giftedItem));

    // Persist to localStorage for checkout auto-apply
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    localStorage.setItem("cart", JSON.stringify([...cart, giftedItem]));

    // 🎉 Show modal
    setSelectedGift({ ...gift, couponCode: code });
    setModalOpen(true);
  };

  // 3️⃣ Copy coupon code
  const handleCopyCoupon = async () => {
    if (!selectedGift?.couponCode) return;
    try {
      await navigator.clipboard.writeText(selectedGift.couponCode);
      setCouponCopied(true);
    } catch (err) {
      console.error("Clipboard error:", err);
      alert("無法複製，請手動複製：" + selectedGift.couponCode);
    }
  };

  // 4️⃣ Go to checkout
  const handleGoToCheckout = () => {
    setModalOpen(false);
    navigate("/checkout");
  };

  // 🔒 Show login prompt if not signed in
  if (!currentUser) {
    return (
      <div className="punch-game-locked">
        <div className="pg-locked-card">
          <h2 className="pg-locked-title">🔒 請先登入以參加活動</h2>
          <p className="pg-locked-text">
            登入或註冊您的 Fü-Mart 帳號後，即可參加免費戳戳樂抽獎！
          </p>
          <div className="pg-locked-actions">
            <button
              className="pg-login-btn"
              onClick={() => navigate("/login")}
            >
              登入
            </button>
            <button
              className="pg-signup-btn"
              onClick={() => navigate("/signup")}
            >
              註冊
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🕹 Logged-in view
  return (
    <div className="punch-game-wrap">
      <div className="pg-header">
        <h2 className="pg-title">🎯 戳戳樂抽獎（$0–$10）</h2>
        <p className="pg-sub">現在登入即可免費戳一發！</p>
      </div>

      {loading && (
        <div className="pg-loading">
          <span>Loading gifts…</span>
        </div>
      )}
      {error && <div className="pg-error">{error}</div>}

      {!loading && !error && (
        <div className="punch-grid">
          {gridIndices.map((i) => (
            <button
              key={i}
              className={`punch-cell ${punched[i] ? "punched" : ""}`}
              onClick={() => handlePunch(i)}
              disabled={punched[i] || punched.some((p) => p)}
            >
              {!punched[i] ? (
                <span className="punch-text">戳</span>
              ) : (
                <span className="punch-dust">✶</span>
              )}
            </button>
          ))}
        </div>
      )}

      {modalOpen && selectedGift && (
        <div className="pg-modal">
          <div className="pg-modal-card">
            <h3 className="pg-modal-title">🎉 恭喜獲得！</h3>

            <div className="pg-gift">
              <div className="pg-gift-img">
                {Array.isArray(selectedGift[IMAGE_FIELD]) &&
                selectedGift[IMAGE_FIELD].length > 0 ? (
                  <img
                    src={selectedGift[IMAGE_FIELD][0]}
                    alt={selectedGift[TITLE_FIELD]}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-img">No Image</div>
                )}
              </div>

              <div className="pg-gift-info">
                <div className="pg-gift-name">{selectedGift[TITLE_FIELD]}</div>
                <div className="pg-gift-price">
                  ${Number(selectedGift[PRICE_FIELD]).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pg-modal-actions">
              {!couponCopied ? (
                <button className="claim-btn" onClick={handleCopyCoupon}>
                  📋 複製優惠碼 ({selectedGift.couponCode})
                </button>
              ) : (
                <button className="checkout-btn" onClick={handleGoToCheckout}>
                  🛒 前往結帳
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PunchGame;
