import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi, signUpApi, updateUserProfile, uploadAvatarApi } from '../api/usersApi';
import { setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role?: UserRole; phone?: string; department?: string; gender?: string; location?: string; age?: number }) => Promise<{ message: string }>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (pendingJobId?: string) => void;
  closeAuthModal: () => void;
  pendingJobId: string | null;
  clearPendingJobId: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('talentpulse_user');
    const hasToken = !!localStorage.getItem('talentpulse_token');
    // If a user object exists but there's no token (e.g. a session saved
    // before real JWTs were introduced), don't trust it — force a fresh login.
    if (saved && hasToken) {
      return JSON.parse(saved);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const role: UserRole = user ? user.role : 'candidate';

  useEffect(() => {
    if (user) {
      localStorage.setItem('talentpulse_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('talentpulse_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setStoredToken(res.token);
    setUser(res.user);
  };

  const signup = async (data: { name: string; email: string; password: string; role?: UserRole; phone?: string; department?: string; gender?: string; location?: string; age?: number }) => {
    // Signing up no longer logs the user in — the account is created inactive
    // and only becomes usable once the emailed activation link is clicked.
    // We deliberately do NOT call setUser(...) here.
    const res = await signUpApi(data);
    return { message: res.message };
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = await updateUserProfile(user.id, updatedData);
    setUser(updated);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const updated = await uploadAvatarApi(user.id, file);
    setUser(updated);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  useEffect(() => {
    const onSessionExpired = () => {
      // Ensure local user and token are cleared when the session is invalid.
      setStoredToken(null);
      setUser(null);
    };

    window.addEventListener('session:expired', onSessionExpired);
    return () => window.removeEventListener('session:expired', onSessionExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAuthModal = (jobId?: string) => {
    if (jobId) setPendingJobId(jobId);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const clearPendingJobId = () => {
    setPendingJobId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        signup,
        updateUser,
        uploadAvatar,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingJobId,
        clearPendingJobId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};