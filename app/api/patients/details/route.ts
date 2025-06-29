import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';
import { PatientMedia } from '../../../../types/patient-media';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

// Dummy encrypt function for demonstration
function encrypt(value: string) {
  // Replace with your actual encryption logic
  return value ? `enc_${value}` : '';
}

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    // Get id from query string (?id=...)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 });
    }

    // Call the backend API
    const response = await fetch(`${getBaseUrl()}/Patient/getById/${id}`, {
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
      return NextResponse.json({ message: 'Failed to fetch patient', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ message: 'Failed to fetch patient details' }, { status: 500 });
  }
}
