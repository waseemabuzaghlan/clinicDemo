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

// GET - Fetch visit prescriptions by visitId
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
          Business: ["Visit ID is required"]
        }
      }, { status: 400 });
    }

    const response = await fetch(
      `${getBaseUrl()}/VisitPrescription/by-visit/${visitId}`,
      {
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
          Backend: ["Failed to fetch visit prescriptions"]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching visit prescriptions:', error);
    return NextResponse.json({
      title: "Internal server error",
      status: 500,
      errors: {
        Server: ["An unexpected error occurred"]
      }
    }, { status: 500 });
  }
}

// POST - Add new visit prescription
export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    
    // Validate required fields
    if (!body.visitId || !body.drugName || !body.dosage || !body.frequency || !body.duration) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        errors: {
          Business: ["All prescription fields are required: visitId, drugName, dosage, frequency, duration"]
        }
      }, { status: 400 });
    }

    const response = await fetch(
      `${getBaseUrl()}/VisitPrescription`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          visitId: body.visitId,
          drugName: body.drugName,
          dosage: body.dosage,
          frequency: body.frequency,
          duration: body.duration,
          instructions: body.instructions || '',
        }),
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
          Backend: ["Failed to add prescription"]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding prescription:', error);
    return NextResponse.json({
      title: "Internal server error",
      status: 500,
      errors: {
        Server: ["An unexpected error occurred"]
      }
    }, { status: 500 });
  }
}
