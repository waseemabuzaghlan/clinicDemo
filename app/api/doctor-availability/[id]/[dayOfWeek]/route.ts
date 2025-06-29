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
  { params }: { params: { id: string; dayOfWeek: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const response = await fetch(
      `${getBaseUrl()}/doctor-availability/${params.id}/${params.dayOfWeek}`,
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
      const contentType = response.headers.get("content-type");
      let errorMessage = 'Failed to delete availability';

      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.title || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
        }
      } else {
        try {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        } catch (textError) {
          console.error('Error reading response text:', textError);
        }
      }

      return NextResponse.json({
        title: "Failed to delete availability.",
        status: response.status,
        instance: `/api/doctor-availability/${params.id}/${params.dayOfWeek}`,
        errors: {
          Business: [errorMessage]
        }
      }, { status: response.status });
    }

    return NextResponse.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      instance: `/api/doctor-availability/${params.id}/${params.dayOfWeek}`,
      errors: {
        Business: ["Failed to delete availability"]
      }
    }, { status: 500 });
  }
}