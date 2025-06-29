import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

// Helper function to create HTTPS agent
const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

// Helper function to check authorization
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

    const response = await fetch(`${getBaseUrl()}/Roles`, {
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
        { message: errorData?.message || 'Failed to fetch roles' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('TOKENdfdfdfdfdf:');
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
    console.log('TOKEN:', auth.token);
    
    const response = await fetch(`${getBaseUrl()}/roles`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      // @ts-ignore
      //agent: getHttpsAgent(),
      body: JSON.stringify({
        name: body.name.trim(),
        description: body.description?.trim() || null
      })
    });
debugger;
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || 'Failed to create role' },
        { status: response.status }
      );
    }   
   
   
    return NextResponse.json(
      { message: 'Role created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { message: 'Failed to create role' },
      { status: 500 }
    );
  }
}