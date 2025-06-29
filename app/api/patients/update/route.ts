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

export async function PUT(request: NextRequest) {
  // Check authentication
  const { token, error } = checkAuth(request);
  if (error) return error;

  // Parse the request body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  // Prepare the API call to the backend
  const baseUrl = getBaseUrl();
  //const url = `${baseUrl}/Patient/update`;
  const url = `${baseUrl}/Patient/update?userId=${1}&branchId=${1}`;

  try {
    const apiRes = await fetch(`${getBaseUrl()}/Patient/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      agent: getHttpsAgent(),
    } as any); // 'agent' is not standard in fetch, but supported in node-fetch

    const data = await apiRes.json();
    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }
    return NextResponse.json(data);
  } 
  catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed to update patient' }, { status: 500 });
  }
}
