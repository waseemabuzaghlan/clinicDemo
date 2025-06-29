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

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;    const body = await request.json();

    // Validate required fields
    if (!body.visitId || !body.complaint || !body.duration || !body.severity) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        errors: {
          Business: ["All fields are required: visitId, complaint, duration, severity"]
        }
      }, { status: 400 });
    }

    // Call backend API
    const response = await fetch(`${getBaseUrl()}/VisitComplaint`, {
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
      agent: getHttpsAgent(),
      body: JSON.stringify(body)
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          responseData = { message: text };
        }
      }
    } catch (e) {
      throw new Error('Failed to parse server response');
    }

    if (!response.ok) {
      return NextResponse.json({
        title: responseData?.title || "Failed to add visit complaint.",
        status: response.status,
        errors: responseData?.errors || {
          Business: [responseData?.message || responseData?.title || "Failed to add visit complaint"]
        }
      }, { status: response.status });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error adding visit complaint:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["Failed to add visit complaint"]
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    // Get visitId from query params
    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get('visitId');
    if (!visitId) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        errors: {
          visitId: ["visitId is required as a query parameter."]
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/VisitComplaint/by-visit/${visitId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        // @ts-ignore
        agent: getHttpsAgent()
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json({
        title: "Failed to fetch complaints.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "The operation failed. Please try again."]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while fetching complaints"]
      }
    }, { status: 500 });
  }
}
