import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  console.log('Visit consultation API - Token check:', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenStart: token?.substring(0, 20) + '...'
  });
  
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

export async function PUT(request: NextRequest) {
  console.log('Visit consultation API - PUT request received');
  
  try {
    const auth = checkAuth(request);
    if ('error' in auth) {
      console.log('Visit consultation API - Auth failed');
      return auth.error;
    }    console.log('Visit consultation API - Auth successful');

    let body;
    try {
      body = await request.json();
      console.log('Visit consultation API - Request body parsed successfully:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Visit consultation API - Failed to parse request body:', parseError);
      return NextResponse.json({
        title: "Invalid request body.",
        status: 400,
        errors: {
          Body: ["Request body must be valid JSON"]
        }
      }, { status: 400 });
    }// Validate required fields - more lenient validation for debugging
    console.log('Visit consultation API - All body keys:', Object.keys(body));
    console.log('Visit consultation API - Body values:', {
      visitId: body.visitId,
      visitIdLength: body.visitId?.length,
      updatedBy: body.updatedBy,
      updatedByLength: body.updatedBy?.length,
      note: body.note
    });

    if (!body.visitId || body.visitId.trim() === '' || !body.updatedBy || body.updatedBy.trim() === '') {
      console.log('Visit consultation API - Validation failed:', {
        visitId: body.visitId,
        visitIdType: typeof body.visitId,
        updatedBy: body.updatedBy,
        updatedByType: typeof body.updatedBy,
        bodyKeys: Object.keys(body)
      });
      return NextResponse.json({ 
        title: "Validation failed.",
        status: 400,
        errors: {
          VisitId: !body.visitId ? ["Visit ID is required"] : undefined,
          UpdatedBy: !body.updatedBy ? ["Updated by is required"] : undefined,
        }
      }, { status: 400 });
    }    console.log('Visit consultation API - Validation passed, calling backend API...');
    console.log('Visit consultation API - Base URL:', getBaseUrl());
    console.log('Visit consultation API - Full backend URL:', `${getBaseUrl()}/Visit/save`);

    const response = await fetch(`${getBaseUrl()}/Visit/save`, {
      method: 'PUT',
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
      body: JSON.stringify({
        visitId: body.visitId,
        note: body.note || '',
        updatedBy: body.updatedBy
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json({
        title: "Failed to save consultation.",
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
      message: "Consultation saved successfully",
      data: data
    });
  } catch (error) {
    console.error('Error saving consultation:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while saving consultation"]
      }    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({
        title: "Missing required parameter.",
        status: 400,
        errors: {
          VisitId: ["Visit ID is required"]
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/VisitConsultation/by-visit/${visitId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // @ts-ignore
      agent: getHttpsAgent()
    });

    if (!response.ok) {
      // Return empty consultation if not found
      if (response.status === 404) {
        return NextResponse.json({
          visitId,
          note: '',
          notes: ''
        });
      }
      
      const errorData = await response.json().catch(() => null);
      return NextResponse.json({
        title: "Failed to fetch consultation.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "Failed to fetch consultation details"]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: ["An unexpected error occurred while fetching consultation"]
      }
    }, { status: 500 });
  }
}
