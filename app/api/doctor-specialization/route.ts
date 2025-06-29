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
    // Fetch specializations from the API
    const response = await fetch(`${getBaseUrl()}/DoctorSpecialization`, {
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
        { message: errorData?.message || 'Failed to fetch specializations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch specializations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
 
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();

    // Validate required fields
    const validationErrors: Record<string, string[]> = {};
    
    if (!body.name?.trim()) {
      validationErrors.name = ['Name is required'];
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBaseUrl()}/DoctorSpecialization`, {
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
        name: body.name.trim(),
        description: body.description?.trim() || ''
      })
    });

    let responseData = null;
    let errorData = null;

    try {
      const textData = await response.text();
      if (textData) {
        responseData = JSON.parse(textData);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }

    if (!response.ok) {
      errorData = responseData;
      console.error('Error response from API:', errorData);
      
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to create specialization',
          errors: errorData?.errors || {}
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData || { message: 'Specialization created successfully' });
  } catch (error) {
    console.error('Error creating specialization:', error);
    return NextResponse.json(
      { message: 'Failed to create specialization' },
      { status: 500 }
    );
  }
}