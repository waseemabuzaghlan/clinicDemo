import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({
      title: "Authentication failed.",
      status: 401,
      instance: "/api/doctor-availability",
      errors: {
        Authorization: ["Unauthorized access. Please login."]
      }
    }, { status: 401 }) };
  }
  return { token };
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(
      `${getBaseUrl()}/doctor-availability/${params.id}`,
      {
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
      }
    );

    if (!response.ok) {
      let errorMessage: string;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData?.message || 
                        errorData?.title || 
                        (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) ||
                        'Failed to delete availability';
        } else {
          errorMessage = await response.text();
        }
      } catch (parseError) {
        errorMessage = 'Failed to delete availability';
      }

      return NextResponse.json({
        title: "Failed to delete availability.",
        status: response.status,
        instance: `/api/doctor-availability/${params.id}`,
        errors: {
          Business: [errorMessage]
        }
      }, { status: response.status });
    }

    // Return a JSON response even for successful deletion
    return NextResponse.json({
      title: "Availability deleted successfully",
      status: 200,
      instance: `/api/doctor-availability/${params.id}`
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      instance: `/api/doctor-availability/${params.id}`,
      errors: {
        Business: ["An unexpected error occurred while deleting availability"]
      }
    }, { status: 500 });
  }
}