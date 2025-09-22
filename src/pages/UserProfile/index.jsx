import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, limit as fbLimit, getDocs } from 'firebase/firestore';

import { firestore } from '../../firebase/utils';
import MainLayout from '../../layouts/MainLayout';
import Profile from '../../components/Profile';
import './UserProfile.scss';

import fumartLogo from '../../assets/fu.png';

const UserProfile = () => {
  const { username } = useParams();
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setStatus('loading');
        const usersRef = collection(firestore, 'users');

        // exact username
        let snap = await getDocs(query(usersRef, where('username', '==', username), fbLimit(1)));
        // fallback to handle
        if (snap.empty) {
          snap = await getDocs(query(usersRef, where('handle', '==', username), fbLimit(1)));
        }

        if (cancelled) return;

        if (!snap.empty) {
          setUserId(snap.docs[0].id);
          setStatus('ready');
        } else {
          setStatus('notfound');
        }
      } catch (err) {
        console.error('Username lookup failed:', err);
        if (!cancelled) setStatus('notfound');
      }
    })();

    return () => { cancelled = true; };
  }, [username]);

  if (status === 'loading') {
    return (
      <div className="brand-splash" role="status" aria-live="polite" aria-label="Opening seller profile">
        <img src={fumartLogo} alt="FuMart" className="brand-splash__logo" />
        <div className="brand-splash__slogan">
          List your own products on Fü-Mart
        </div>
        {/* <div className="brand-splash__sub">Redirecting to the seller’s profile…</div> */}
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="page-status notfound">
        User <strong>@{username}</strong> not found.
      </div>
    );
  }

  return (
    <div className="user-profile">
      <Profile userId={userId} firestore={firestore} />
    </div>
  );
};

export default UserProfile;
