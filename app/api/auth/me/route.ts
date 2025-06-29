import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface AuthToken {
  userId: string;
  userName: string;
  role: string;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Read the 'token' cookie (HttpOnly cookie)
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const decoded = jwtDecode<AuthToken>(token);

    return NextResponse.json({
      role: decoded.role.toLowerCase(),
      userId: decoded.userId,
      userName: decoded.userName,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ role: null }, { status: 401 });
  }
}
