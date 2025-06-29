import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check if user is already authenticated
  const token = request.cookies.get('token');
  if (token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const response = await fetch('https://myclinic.solutions/api/Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: body.userName,
        password: body.password
      })
    });

    const data = await response.json();

    // Handle validation errors
    if (response.status === 400 && data.errors) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: data.errors
        },
        { status: 400 }
      );
    }

    if (!response.ok || !data) {
      return NextResponse.json(
        { 
          message: data?.title || 'Authentication failed. Please check your credentials.' 
        },
        { status: response.status || 401 }
      );
    }

    if (!data.token) {
      return NextResponse.json(
        { message: 'Authentication failed. No token received.' },
        { status: 401 }
      );
    }

    // Create the response with dashboard redirect
    const nextResponse = NextResponse.json({
      token: data.token,
      user: data.user,
      redirect: '/' // Redirect to dashboard
    });

    // Set the token cookie with 1 minute expiration
    nextResponse.cookies.set({
      name: 'token',
      value: data.token,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 // 1 minute in seconds
    });

    return nextResponse;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Authentication failed. Please try again later.' },
      { status: 500 }
    );
  }
}