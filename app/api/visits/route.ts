import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/api';
import https from 'https';

const visits: Array<any> = [];

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

    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');

    const url = doctorId 
      ? `${getBaseUrl()}/Visit/by-doctor/${doctorId}`
      : `${getBaseUrl()}/Visit`;

    const response = await fetch(url, {
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
        { message: errorData?.message || 'Failed to fetch visits' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json(
      { message: 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simulate creating a new visit
    const newVisit = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: Math.floor(Math.random() * 1000),
      patientName: "New Patient",
      appointmentId: body.appointmentId,
      appointmentTime: new Date().toISOString(),
      doctorName: "Dr. Example",
      status: 'checked-in',
      identificationNumber: body.identificationNumber,
      identificationType: body.identificationType,
      fingerprintCollected: body.fingerprintCollected,
      insuranceCardNumber: body.insuranceCardNumber,
      paymentType: body.paymentType,
      createdAt: new Date().toISOString()
    };

    visits.push(newVisit);
    return NextResponse.json(newVisit);
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json(
      { message: 'Failed to create visit' },
      { status: 500 }
    );
  }
}