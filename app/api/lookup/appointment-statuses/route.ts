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

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(`${getBaseUrl()}/Dropdown/appointment-statuses`, {
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
        { message: errorData?.message || 'Failed to fetch appointment statuses' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the response to match the expected format
    const transformedData = data.map((status: any) => ({
      id: status.Id,
      name: status.Name
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching appointment statuses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch appointment statuses' },
      { status: 500 }
    );
  }
}