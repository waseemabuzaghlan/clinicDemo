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

export async function DELETE(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = request.nextUrl;
    const doctorId = searchParams.get('doctorId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    if (!doctorId || !dayOfWeek) {
      return NextResponse.json(
        { message: 'Doctor ID and day of week are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${getBaseUrl()}/doctor-availability/delete-Availability?doctorId=${doctorId}&dayOfWeek=${dayOfWeek}`,
      {
        method: 'DELETE',
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to delete availability',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json(
      { message: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}