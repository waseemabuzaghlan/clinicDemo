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

    // Extract id from the URL path: /api/patients/GetPatientImage?id=123
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 });
    }

    // Call the backend API to get the image (adjust the backend URL as needed)
    const response = await fetch(`${getBaseUrl()}/Patient/getPatientImageById/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
        'Authorization': `Bearer ${auth.token}`,
      },
      // @ts-ignore
      agent: getHttpsAgent(),
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Failed to fetch patient image' }, { status: response.status });
    }

    // Return the image as a stream
    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('Error fetching patient image:', error);
    return NextResponse.json({ message: 'Failed to fetch patient image' }, { status: 500 });
  }
}
