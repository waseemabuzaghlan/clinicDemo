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

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();

    // Validate required fields
    const validationErrors: Record<string, string[]> = {};

    if (body.doctorId === undefined || body.doctorId === null) {
      validationErrors.doctorId = ['Doctor ID is required'];
    }
    if (body.dayOfWeek === undefined || body.dayOfWeek === null) {
      validationErrors.dayOfWeek = ['Day of week is required'];
    }
    if (!body.startTime) {
      validationErrors.startTime = ['Start time is required'];
    }
    if (!body.endTime) {
      validationErrors.endTime = ['End time is required'];
    }
    if (body.isAvailable === undefined || body.isAvailable === null) {
      validationErrors.isAvailable = ['Availability status is required'];
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        title: "Validation failed.",
        status: 400,
        instance: "/api/doctor-availability",
        errors: validationErrors
      }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    const response = await fetch(`${getBaseUrl()}/doctor-availability`, {
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
      body: JSON.stringify({
        doctorId: body.doctorId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        isAvailable: body.isAvailable
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json({
        title: "Failed to set availability.",
        status: response.status,
        instance: "/api/doctor-availability",
        errors: errorData?.errors || {
          Business: [errorData?.message || errorData?.title || "Failed to set availability"]
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

    const data = await response.json();
    
    // Return the complete availability object
    return NextResponse.json({
      availabilityId: data.availabilityId,
      doctorId: body.doctorId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      isAvailable: body.isAvailable
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error setting availability:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      instance: "/api/doctor-availability",
      errors: {
        Business: ["Failed to set availability"]
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