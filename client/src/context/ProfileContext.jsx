import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from './AuthContext.jsx';

const ProfileContext = createContext(null);

function fireConfetti() {
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: ['#818cf8', '#34d399', '#fbbf24'] });
  setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, colors: ['#a5b4fc', '#6ee7b7'] }), 250);
}

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevLevel = useRef(null);

  const refresh = useCallback(async () => {
    const data = await api.getProfile();
    if (prevLevel.current !== null && data.level > prevLevel.current) {
      fireConfetti();
    }
    prevLevel.current = data.level;
    setProfile(data);
    return data;
  }, []);

  // Merge a profile object returned inline from another API call (answer,
  // exam submit, etc.) without re-fetching, but still catch level-ups.
  const applyProfile = useCallback((data) => {
    if (!data) return;
    if (prevLevel.current !== null && data.level > prevLevel.current) {
      fireConfetti();
    }
    prevLevel.current = data.level;
    setProfile(data);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      prevLevel.current = null;
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, applyProfile, fireConfetti }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
