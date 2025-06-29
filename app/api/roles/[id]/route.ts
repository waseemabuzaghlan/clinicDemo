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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(`${getBaseUrl()}/Roles/${params.id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      // @ts-ignore
      agent: getHttpsAgent()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || 'Failed to fetch role' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { message: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  debugger;

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

    const response = await fetch(`${getBaseUrl()}/Roles/${params.id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      // @ts-ignore
      agent: getHttpsAgent(),
      body: JSON.stringify({
        name: body.name.trim(),
        description: body.description?.trim() || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || errorData?.title || 'Failed to update role' },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { message: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    debugger;
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    console.log('Deleting role with ID:', params.id);

    const response = await fetch(`${getBaseUrl()}/Roles/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      // @ts-ignore
      agent: getHttpsAgent()
    });

    console.log('Delete response status:', response.status);

    // Handle successful deletion (204 No Content or 200 OK)
    if (response.status === 204 || response.status === 200) {
      return new NextResponse(null, { status: 204 });
    }

    // Try to get error details if available
    let errorMessage = 'Failed to delete role';
    try {
      const errorData = await response.json();
      errorMessage = errorData?.message || errorData?.title || errorMessage;
      console.error('Delete error response:', errorData);
    } catch (e) {
      console.error('Could not parse error response');
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: response.status || 500 }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { message: 'Failed to delete role' },
      { status: 500 }
    );
  }
}