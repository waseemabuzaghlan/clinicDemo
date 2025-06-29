import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ 
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 120000
});

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({
      title: "Authentication failed.",
      status: 401,
      instance: "/api/doctor-availability/availability/status",
      errors: {
        Authorization: ["Unauthorized access. Please login."]
      }
    }, { status: 401 }) };
  }
  return { token };
};

export async function PUT(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;
    
    const body = await request.json();

    // Validate required fields
    if (!body.availabilityId) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        instance: "/api/doctor-availability/availability/status",
        errors: {
          Business: ["Availability ID is required"]
        }
      }, { status: 400 });
    }

    if (typeof body.isAvailable !== 'boolean') {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        instance: "/api/doctor-availability/availability/status",
        errors: {
          Business: ["isAvailable must be a boolean value"]
        }
      }, { status: 400 });
    }

    const response = await fetch(`${getBaseUrl()}/doctor-availability/ChangeStatus`, {
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
        availabilityId: body.availabilityId,
        isAvailable: body.isAvailable
      })
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
        title: "Failed to update availability status.",
        status: response.status,
        instance: "/api/doctor-availability/availability/status",
        errors: responseData?.errors || {
          Business: [responseData?.message || responseData?.title || "Failed to update availability status"]
        }
      }, { 
        status: response.status,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error updating availability status:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      instance: "/api/doctor-availability/availability/status",
      errors: {
        Business: ["Failed to update availability status"]
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}