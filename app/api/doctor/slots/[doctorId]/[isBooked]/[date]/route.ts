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

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string; isBooked: string; date: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const apiUrl = `${getBaseUrl()}/Doctor/slots/${params.doctorId}/${params.isBooked}/${params.date}`;
    console.log('Fetching slots from:', apiUrl);

    const response = await fetch(
      apiUrl,
      {
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
        agent: getHttpsAgent(),
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch doctor slots' }));
      console.error('Error response:', errorData);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to fetch doctor slots',
          errors: errorData?.errors
        },
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const data = await response.json();
    console.log('Slots data:', data);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching doctor slots:', error);
    return NextResponse.json(
      { message: 'Failed to fetch doctor slots' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}