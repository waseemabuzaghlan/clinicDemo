import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();

    const response = await fetch(`${getBaseUrl()}/doctor-availability`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // @ts-ignore
      agent: getHttpsAgent(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to set availability',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { message: 'Availability set successfully' });
  } catch (error) {
    console.error('Error setting availability:', error);
    return NextResponse.json(
      { message: 'Failed to set availability' },
      { status: 500 }
    );
  }
}