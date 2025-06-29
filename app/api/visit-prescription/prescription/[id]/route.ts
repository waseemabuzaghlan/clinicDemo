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
      errors: {
        Authorization: ["Unauthorized access. Please login."]
      }
    }, { status: 401 }) };
  }
  return { token };
};

// DELETE - Delete visit prescription by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const prescriptionId = params.id;

    if (!prescriptionId) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        errors: {
          Business: ["Prescription ID is required"]
        }
      }, { status: 400 });
    }

    const response = await fetch(
      `${getBaseUrl()}/VisitPrescription/${prescriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // @ts-ignore
        agent: getHttpsAgent(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API Error:', response.status, errorText);
      return NextResponse.json({
        title: "Backend API Error",
        status: response.status,
        errors: {
          Backend: ["Failed to delete prescription"]
        }
      }, { status: response.status });
    }

    return NextResponse.json({ success: true });  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({
      title: "Internal server error",
      status: 500,
      errors: {
        Server: ["An unexpected error occurred"]
      }
    }, { status: 500 });
  }
}
