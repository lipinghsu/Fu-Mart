import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";
import path from "path";
import os from "os";
import fs from "fs";
import axios from "axios";
import { Buffer } from 'buffer';

initializeApp();
const storage = getStorage();

const handleRequest = (handler) => onRequest({ cors: true }, async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error("Function Error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error_description || error.message || "Internal Server Error" 
    });
  }
});

// ==================== KAKAO CONFIG ====================
const KAKAO_REST_API_KEY = "75b6a6ff4c530399500e655d4e6e4e1f";

// ==================== Kakao Login Callback ====================
export const kakaoLoginCallback = handleRequest(async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Missing authorization code" });

  // 1. DYNAMIC REDIRECT URI: Uses origin header to match localhost or fu-mart.com
  const origin = req.headers.origin || "https://fu-mart.com";
  const redirectUri = `${origin}/auth/kakao/callback`;

  console.log(`🟡 [KAKAO] Exchanging code using redirect_uri: ${redirectUri}`);
  
  const tokenRes = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" } }
  );

  const { access_token } = tokenRes.data;

  // 2. Get User Profile
  const profileRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  const { id, kakao_account } = profileRes.data;
  const kakaoUserId = `kakao:${id}`; 

  // 3. Check Firestore
  const userRef = admin.firestore().collection("users").doc(kakaoUserId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const customToken = await admin.auth().createCustomToken(kakaoUserId);
    return res.json({ success: true, exists: true, customToken });
  }

  // 4. Return data for signup flow
  res.json({ 
    success: true, 
    exists: false, 
    kakaoUserId: kakaoUserId, 
    displayName: kakao_account?.profile?.nickname || "Kakao User", 
    avatar: kakao_account?.profile?.profile_image_url || null,
    email: kakao_account?.email || null
  });
});

// ==================== Create New Kakao User ====================
export const createKakaoUser = handleRequest(async (req, res) => {
  const { kakaoUserId, username, name, email, dob, avatar } = req.body || {};

  if (!kakaoUserId || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const usernameCheck = await admin.firestore().collection("users")
    .where("username", "==", username).limit(1).get();
  
  if (!usernameCheck.empty) {
    return res.status(400).json({ error: "此使用者名稱已被佔用" });
  }

  const customToken = await admin.auth().createCustomToken(kakaoUserId);
  await admin.firestore().collection("users").doc(kakaoUserId).set({
    uid: kakaoUserId,
    name: name || "Kakao User",
    username,
    email: email || null,
    dob: dob || null,
    avatar: avatar || null,
    kakaoUserId,
    role: 'user',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ success: true, customToken });
});

// ==================== LINE Login Callback ====================
export const lineLoginCallback = handleRequest(async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Missing authorization code" });

  const origin = req.headers.origin || "https://fu-mart.com";
  const redirectUri = `${origin}/auth/line/callback`;

  console.log(`🔵 [LINE] Exchanging code using redirect_uri: ${redirectUri}`);
  
  const tokenRes = await axios.post(
    "https://api.line.me/oauth2/v2.1/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: "2009268985",
      client_secret: "22900bafcee239fe46224820c3e06927"
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, id_token } = tokenRes.data;

  const profileRes = await axios.get("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  const { userId, displayName, pictureUrl } = profileRes.data;

  const userRef = admin.firestore().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const customToken = await admin.auth().createCustomToken(userId);
    return res.json({ success: true, exists: true, customToken });
  }

  let email = null;
  if (id_token) {
    try {
      const base64Url = id_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      email = JSON.parse(jsonPayload).email || null;
    } catch (e) {
      console.warn("⚠️ Could not parse email from ID token");
    }
  }

  res.json({ 
    success: true, 
    exists: false, 
    lineUserId: userId, 
    displayName,
    email,
    avatar: pictureUrl 
  });
});

// ==================== Create New LINE User ====================
export const createLineUser = handleRequest(async (req, res) => {
  const { lineUserId, username, name, email, dob, avatar } = req.body || {};

  if (!lineUserId || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const usernameCheck = await admin.firestore().collection("users")
    .where("username", "==", username).limit(1).get();
  
  if (!usernameCheck.empty) {
    return res.status(400).json({ error: "此使用者名稱已被佔用" });
  }

  const customToken = await admin.auth().createCustomToken(lineUserId);
  await admin.firestore().collection("users").doc(lineUserId).set({
    uid: lineUserId,
    name: name || "LINE User",
    username,
    email: email || null,
    dob: dob || null,
    avatar: avatar || null,
    lineUserId,
    role: 'user',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ success: true, customToken });
});

// ==================== Thumbnail Generator ====================
export const generateThumbnails = onObjectFinalized(async (event) => {
  const object = event.data;
  const bucket = storage.bucket(object.bucket);
  const filePath = object.name;
  const contentType = object.contentType;

  if (!contentType?.startsWith("image/")) return;
  if (filePath.includes("_thumb@")) return;

  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  await bucket.file(filePath).download({ destination: tempFilePath });

  const sizes = [400, 800];
  const uploadPromises = sizes.map(async (size) => {
    const thumbFileName = fileName.replace(/(\.[\w]+)$/, `_thumb@${size}$1`);
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
    await sharp(tempFilePath).resize(size).toFile(tempThumbPath);
    await bucket.upload(tempThumbPath, {
      destination: thumbFilePath,
      metadata: { contentType, cacheControl: "public, max-age=31536000" },
    });
    fs.unlinkSync(tempThumbPath);
    return thumbFilePath;
  });

  await Promise.all(uploadPromises);
  fs.unlinkSync(tempFilePath);
});