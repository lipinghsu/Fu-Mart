import userTypes from "./user.types";
import { takeLatest, call, all, put } from "redux-saga/effects";
import {
  signInSuccess,
  signOutUserSuccess,
  resetPasswordSuccess,
  userError,
} from "./user.actions";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { handleUserProfile, getCurrentUser, auth } from "../../firebase/utils";
import { handleResetPasswordAPI } from "./user.helpers";
import { firestore } from "../../firebase/utils";
import { v4 } from "uuid";

// ----------------------------------------------------
// Helper: Create or fetch Firestore user profile
// ----------------------------------------------------
export function* getSnapshotFromUserAuth(user, additionalData = {}) {
  try {
    const userRef = yield call(handleUserProfile, {
      userAuth: user,
      additionalData,
    });
    const snapshot = yield userRef.get();
    yield put(
      signInSuccess({
        id: snapshot.id,
        ...snapshot.data(),
      })
    );
  } catch (err) {
    console.log(err);
  }
}

// ----------------------------------------------------
// Sign Up
// ----------------------------------------------------
export function* signUpUser({
  payload: { firstName, lastName, email, password, confirmPassword },
}) {
  if (password !== confirmPassword) {
    yield put(userError(["Passwords do not match."]));
    return;
  }

  try {
    const { user } = yield createUserWithEmailAndPassword(auth, email, password);
    const additionalData = { firstName, lastName };
    yield getSnapshotFromUserAuth(user, additionalData);
  } catch (error) {
    const errorMessage =
      error.code === "auth/email-already-in-use"
        ? "Email already in use."
        : error.message;
    yield put(userError([errorMessage]));
  }
}

export function* onSignUpUserStart() {
  yield takeLatest(userTypes.SIGN_UP_USER_START, signUpUser);
}

// ----------------------------------------------------
// Newsletter Sign Up
// ----------------------------------------------------
export function* newsletterSignUp({ payload: { email } }) {
  if (!email) return;
  const emailRef = firestore.doc(`newsletterEmail/${email}`);
  const snapshot = yield emailRef.get();

  if (!snapshot.exists) {
    try {
      yield emailRef.set({ email });
    } catch (error) {
      console.log(error);
    }
  }
}

export function* onNewsletterSignUpStart() {
  yield takeLatest(userTypes.NEWSLETTER_SIGN_UP_START, newsletterSignUp);
}

// ----------------------------------------------------
// Clear user error
// ----------------------------------------------------
export function* clearUserError() {
  yield put(userError([]));
}

// ----------------------------------------------------
// Email Sign In
// ----------------------------------------------------
export function* emailSignIn({ payload: { email, password } }) {
  try {
    const { user } = yield signInWithEmailAndPassword(auth, email, password);
    yield getSnapshotFromUserAuth(user);
  } catch (error) {
    const errorMessage =
      error.code === "auth/wrong-password"
        ? "Incorrect password."
        : error.code === "auth/user-not-found"
        ? "No account found with that email."
        : error.code === "auth/too-many-requests"
        ? "Too many requests. Try again later."
        : error.message;

    yield put(userError([errorMessage]));
  }
}

export function* onEmailSignInStart() {
  yield takeLatest(userTypes.EMAIL_SIGN_IN_START, emailSignIn);
}

// ----------------------------------------------------
// Check user session
// ----------------------------------------------------
export function* isUserAuthenticated() {
  try {
    const userAuth = yield getCurrentUser();
    if (!userAuth) return;
    yield getSnapshotFromUserAuth(userAuth);
  } catch (err) {
    console.log(err);
  }
}

export function* onCheckUserSession() {
  yield takeLatest(userTypes.CHECK_USER_SESSION, isUserAuthenticated);
}

// ----------------------------------------------------
// Sign Out
// ----------------------------------------------------
export function* signOutUser() {
  try {
    yield auth.signOut();
    yield put(signOutUserSuccess());
  } catch (err) {
    console.log(err);
  }
}

export function* onSignOutUserStart() {
  yield takeLatest(userTypes.SIGN_OUT_USER_START, signOutUser);
}

// ----------------------------------------------------
// Reset Password
// ----------------------------------------------------
export function* resetPassword({ payload: { email } }) {
  try {
    yield call(handleResetPasswordAPI, email);
    yield put(resetPasswordSuccess());
  } catch (err) {
    yield put(userError(err));
  }
}

export function* onResetPasswordStart() {
  yield takeLatest(userTypes.RESET_PASSWORD_START, resetPassword);
}

// ----------------------------------------------------
// Google Sign In
// ----------------------------------------------------
const GoogleProvider = new GoogleAuthProvider();
GoogleProvider.setCustomParameters({ prompt: "select_account" });

export function* googleSignIn() {
  try {
    const { user } = yield signInWithPopup(auth, GoogleProvider);
    yield getSnapshotFromUserAuth(user);
  } catch (err) {
    console.log(err);
  }
}

export function* onGoogleSignInStart() {
  yield takeLatest(userTypes.GOOGLE_SIGN_IN_START, googleSignIn);
}

// ----------------------------------------------------
// Root Saga
// ----------------------------------------------------
export default function* userSagas() {
  yield all([
    call(onEmailSignInStart),
    call(onCheckUserSession),
    call(onSignOutUserStart),
    call(onSignUpUserStart),
    call(onResetPasswordStart),
    call(onGoogleSignInStart),
    call(onNewsletterSignUpStart),
  ]);
}
