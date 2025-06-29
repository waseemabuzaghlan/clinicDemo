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
    const { id, photo } = body;
  if (!id || !photo) {
    return NextResponse.json({ message: 'Missing id or image parameter' }, { status: 400 });
  }

  // Prepare the API call to the backend
  const url = `${getBaseUrl()}/Patient/updatePatientImage`;

  try {
  
    const apiRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, photo }),
      agent: getHttpsAgent(),
    } as any);

  const rawResponse = await apiRes.text();
    console.log('Raw backend response:', rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return NextResponse.json({ message: 'Invalid JSON response from backend' }, { status: 500 });
    }

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Fetch failed with error:', err); // Log the error details
    return NextResponse.json({ message: err.message || 'Failed to update patient Photo' }, { status: 500 });
  }
}
