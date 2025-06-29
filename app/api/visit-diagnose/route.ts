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

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({ 
        title: "Validation failed.",
        status: 400,
        errors: {
          VisitId: ["Visit ID is required"]
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/VisitDiagnose/by-visit/${visitId}`, {
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
      return NextResponse.json({
        title: "Failed to fetch diagnoses.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "The operation failed. Please try again."]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while fetching diagnoses"]
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();    // Validate required fields
    if (!body.visitId || !body.diagnoseId || !body.description) {
      return NextResponse.json({ 
        title: "Validation failed.",
        status: 400,
        errors: {
          VisitId: !body.visitId ? ["Visit ID is required"] : undefined,
          DiagnoseId: !body.diagnoseId ? ["Diagnose ID is required"] : undefined,
          Description: !body.description ? ["Description is required"] : undefined,
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/VisitDiagnose`, {
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
      agent: getHttpsAgent(),      body: JSON.stringify({
        visitId: body.visitId,
        diagnoseId: body.diagnoseId,
        description: body.description
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json({
        title: "Failed to add diagnosis.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "The operation failed. Please try again."]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      title: "Success",
      status: 200,
      message: "Diagnosis added successfully",
      data: data
    });
  } catch (error) {
    console.error('Error adding diagnosis:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while adding diagnosis"]
      }
    }, { status: 500 });
  }
}
