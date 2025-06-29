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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: { name: ['Name is required'] }
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBaseUrl()}/DoctorSpecialization/${params.id}`, {
      method: 'PUT',
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

    // Try to parse the response body, but handle cases where it might be empty
    let errorData = null;
    let responseData = null;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const textData = await response.text();
        if (textData) {
          responseData = JSON.parse(textData);
        }
      } catch (e) {
        console.error('Error parsing response:', e);
      }
    }

    if (!response.ok) {
      errorData = responseData;
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to update specialization',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    // If we have valid response data, return it, otherwise return a success message
    return NextResponse.json(responseData || { message: 'Specialization updated successfully' });
  } catch (error) {
    console.error('Error updating specialization:', error);
    return NextResponse.json(
      { message: 'Failed to update specialization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {    
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(`${getBaseUrl()}/DoctorSpecialization/${params.id}`, {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          message: errorData?.message || errorData?.title || 'Failed to delete specialization',
          errors: errorData?.errors
        },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting specialization:', error);
    return NextResponse.json(
      { message: 'Failed to delete specialization' },
      { status: 500 }
    );
  }
}