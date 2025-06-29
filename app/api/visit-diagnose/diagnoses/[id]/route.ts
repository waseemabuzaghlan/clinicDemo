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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    if (!params.id) {
      return NextResponse.json({ 
        title: "Validation failed.",
        status: 400,
        errors: {
          DiagnosisId: ["Diagnosis ID is required"]
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/VisitDiagnose/${params.id}`, {
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
      return NextResponse.json({
        title: "Failed to delete diagnosis.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "The operation failed. Please try again."]
        }
      }, { status: response.status });
    }

    return NextResponse.json({
      title: "Success",
      status: 200,
      message: "Diagnosis deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while deleting the diagnosis"]
      }
    }, { status: 500 });
  }
}
