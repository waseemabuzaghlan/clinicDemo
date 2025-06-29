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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    let userData = { id: params.id };
    let roleName = 'Role Assigned'; // Default role name if we can't fetch it

    // First, assign the role
    const response = await fetch(`${getBaseUrl()}/Users/AssignToRole/${params.id}/${body.roleId}`, {
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
      agent: getHttpsAgent()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { message: errorData?.message || errorData?.title || 'Failed to update user role' },
        { status: response.status }
      );
    }

    // Try to get the role name, but don't fail if we can't
    try {
      const roleResponse = await fetch(`${getBaseUrl()}/Roles/${body.roleId}`, {
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

      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        roleName = roleData.name;
      }
    } catch (error) {
      console.error('Error fetching role details:', error);
      // Continue execution - we'll use the default role name
    }

    // Try to get the updated user data, but don't fail if we can't
    try {
      const userResponse = await fetch(`${getBaseUrl()}/Users/${params.id}`, {
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

      if (userResponse.ok) {
        userData = await userResponse.json();
      }
    } catch (error) {
      console.error('Error fetching updated user data:', error);
      // Continue execution - we'll use the minimal user data
    }

    // Return the available data, even if some parts couldn't be fetched
    return NextResponse.json({
      ...userData,
      roleName
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Failed to update user role' },
      { status: 500 }
    );
  }
}