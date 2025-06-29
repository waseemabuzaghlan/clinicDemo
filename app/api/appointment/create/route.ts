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

    // Validate required fields
    if (!body.doctorId || !body.patientId || !body.typeId) {
      return NextResponse.json(
        { 
          message: 'Missing required fields',
          errors: {
            doctorId: !body.doctorId ? ['Doctor is required'] : undefined,
            patientId: !body.patientId ? ['Patient is required'] : undefined,
            typeId: !body.typeId ? ['Appointment type is required'] : undefined,
          }
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBaseUrl()}/Appointment/create`, {
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
      body: JSON.stringify({
        doctorId: body.doctorId,
        doctorName: body.doctorName || null,
        patientId: body.patientId,
        patientName: body.patientName || null,
        slotId: body.slotId || null,
        typeId: body.typeId,
        notes: body.notes || "No additional notes"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to create appointment',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { message: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}