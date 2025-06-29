import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api';
import https from 'https';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    // Call the backend API to get visit details
    const response = await fetch(`${getBaseUrl()}/Visit/${params.id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      // @ts-ignore
      agent: getHttpsAgent(),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      return NextResponse.json({ message: 'Failed to fetch visit', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch visit details' },
      { status: 500 }
    );
  }
}