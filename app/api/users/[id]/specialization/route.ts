import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

const validateRequest = (doctorId: string, specializationId: string | null) => {
  const errors = [];
  const parsedDoctorId = parseInt(doctorId);
  
  if (isNaN(parsedDoctorId)) {
    errors.push('Doctor ID must be a valid number');
  } else if (parsedDoctorId <= 0) {
    errors.push('Doctor ID must be a positive number');
  }

  if (specializationId !== null && typeof specializationId !== 'string') {
    errors.push('Specialization ID must be a string or null');
  }

  if (errors.length > 0) {
    return { error: errors.join(', ') };
  }

  return null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const validation = validateRequest(params.id, body.specializationId);
    
    if (validation?.error) {
      return NextResponse.json({ 
        message: validation.error,
        errors: [validation.error]
      }, { status: 400 });
    }

    const requestBody = {
      doctorId: parseInt(params.id),
      specializationId: body.specializationId || ''
    };

    const response = await fetch(`${getBaseUrl()}/Doctor/specialization/assign`, {
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
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to assign specialization';
      let errors = [];
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          errors = Object.values(errorData.errors).flat();
          errorMessage = errors.join(', ');
        } else {
          errorMessage = errorData?.message || errorData?.title || errorMessage;
          errors = [errorMessage];
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
        errors = [errorMessage];
      }
      return NextResponse.json({ 
        message: errorMessage,
        errors: errors
      }, { status: response.status });
    }

    // After successful assignment, fetch updated user data
    const updatedUserResponse = await fetch(`${getBaseUrl()}/Users/${params.id}`, {
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

    if (!updatedUserResponse.ok) {
      return NextResponse.json({ 
        message: 'Specialization assigned but failed to fetch updated user data',
        success: true 
      });
    }

    const updatedUser = await updatedUserResponse.json();
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error assigning specialization:', error);
    return NextResponse.json(
      { 
        message: 'Failed to assign specialization',
        errors: ['An unexpected error occurred while assigning specialization']
      },
      { status: 500 }
    );
  }
}