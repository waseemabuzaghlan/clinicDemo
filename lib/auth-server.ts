import { jwtDecode } from 'jwt-decode';

interface AuthToken {
  userId: string;
  userName: string;
  role: string;
  exp: number;
}

export function parseToken(token: string): AuthToken | null {
  try {
    return jwtDecode<AuthToken>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = parseToken(token);
  if (!decoded) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}