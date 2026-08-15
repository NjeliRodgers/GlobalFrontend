import { User } from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function loginApi(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await apiFetch('/users/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error || 'Login failed');
    err.code = data.code; // e.g. 'ACCOUNT_NOT_ACTIVATED'
    throw err;
  }
  return data;
}

export async function signUpApi(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
  gender?: string;
}): Promise<{ user: User; message: string }> {
  const res = await apiFetch('/users/signup', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sign up failed');
  // No token is returned here — the account is inactive until the
  // activation link is clicked, so callers must NOT treat this as a login.
  return data;
}

export async function activateAccountApi(email: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/activate', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, token })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to activate account');
  return data;
}

export async function resendActivationApi(email: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/resend-activation', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resend activation link');
  return data;
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/forgot-password', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
  return data;
}

export async function resetPasswordApi(data: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/reset-password', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to reset password');
  return result;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await apiFetch('/users');
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    return [];
  }
}

export async function updateUserProfile(userId: string, updates: {
  name?: string;
  phone?: string;
  department?: string;
  gender?: string;
  location?: string;
}): Promise<User> {
  const res = await apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data.user;
}

export async function uploadAvatarApi(userId: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await apiFetch(`/users/${userId}/avatar`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');
  return data.user;
}
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
}): Promise<User> {
  try {
    const res = await signUpApi(userData);
    return res.user;
  } catch (err) {
    return {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: (userData.role || 'recruiter') as any,
      department: userData.department,
      createdAt: new Date().toISOString()
    };
  }
}