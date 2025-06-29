import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ 
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 30000
});

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }    const response = await fetch(`${getBaseUrl()}/Visit/visits/${patientId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // @ts-ignore
      agent: getHttpsAgent(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to fetch patient visits',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching patient visits:', error);
    return NextResponse.json(
      { message: 'Failed to fetch patient visits' },
      { status: 500 }
    );
  }
}
