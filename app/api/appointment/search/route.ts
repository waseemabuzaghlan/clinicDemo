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

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    
    console.log('Appointment search request body:', body);
    
    // Ensure all parameters are explicitly null if undefined
    const searchParams = {
      doctorId: body.doctorId ?? null,
      patientId: body.patientId ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      appointmentTypeId: body.appointmentTypeId ?? null,
      statusId: body.statusId ?? null
    };

    console.log('Constructed search params:', searchParams);

    const response = await fetch(`${getBaseUrl()}/Appointment/search`, {
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
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || 'Failed to search appointments' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend API response:', data);
    console.log('Response keys:', Object.keys(data));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching appointments:', error);
    return NextResponse.json(
      { message: 'Failed to search appointments' },
      { status: 500 }
    );
  }
}