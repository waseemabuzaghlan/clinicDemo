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
  { params }: { params: { doctorId: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(`${getBaseUrl()}/Appointment/by-doctor/${params.doctorId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // @ts-ignore
      agent: getHttpsAgent()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || `Failed to fetch appointments. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate the response data structure
    if (!Array.isArray(data)) {
      console.error('Invalid response format:', data);
      return NextResponse.json(
        { message: 'Invalid response format from server' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}