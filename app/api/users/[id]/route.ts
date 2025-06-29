import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

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

    const response = await fetch(`https://myclinic.solutions/api/Roles/AssignToUser/${params.id}/${body.roleId}`, {
      method: 'PUT',
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
        { message: errorData?.message || errorData?.title || 'Failed to update user role' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Failed to update user role' },
      { status: 500 }
    );
  }
}