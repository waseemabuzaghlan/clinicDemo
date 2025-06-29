'use client';

import { jwtDecode } from 'jwt-decode';
import api from './api';
import { getBaseUrl } from '@/lib/api';

export interface AuthToken {
  userId: string;
  userName: string;
  role: string;
  exp: number;
}

export async function login(userName: string, password: string) {
  // Use the local Next.js API route instead of direct external API call
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, password }),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || 'Authentication failed');
  }

  const data = await response.json();

  // The token is already set by the API route, so we just return the data
  return data;
}

export function parseToken(token: string): AuthToken | null {
  try {
    return jwtDecode<AuthToken>(token);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

export function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  if (!tokenCookie) return null;
  return decodeURIComponent(tokenCookie.split('=')[1].trim());
}

export function getUserRole(): string | null {
  const token = getTokenFromCookie();
  if (!token) return null;

  const decoded = parseToken(token);
  return decoded?.role?.toLowerCase() || null;
}

export function isAuthenticated(): boolean {
  const token = getTokenFromCookie();
  return !!token && !isTokenExpired(token);
}

export function isTokenExpired(token: string): boolean {
  const decoded = parseToken(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function hasAccess(allowedRoles: string[]): boolean {
  const userRole = getUserRole();
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toLowerCase());
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Clear Authorization header
  delete api.defaults.headers.common['Authorization'];

  // Redirect to login
  window.location.href = '/login';
}