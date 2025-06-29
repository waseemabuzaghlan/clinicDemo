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

    const response = await fetch(`${getBaseUrl()}/Dropdown/lab-tests`, {
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
    });    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // If backend controller is missing (404 or specific error), return mock data temporarily
      if (response.status === 404 || response.status === 400) {
        console.warn('Lab tests dropdown endpoint not available, returning mock data');
        const mockLabTests = [
          {
            id: "1",
            name: "Complete Blood Count (CBC)",
            code: "CBC001",
            description: "Full blood count analysis including RBC, WBC, and platelets"
          },
          {
            id: "2", 
            name: "Blood Glucose",
            code: "GLU001",
            description: "Fasting blood glucose level test"
          },
          {
            id: "3",
            name: "Cholesterol Panel",
            code: "CHOL001", 
            description: "Total cholesterol, HDL, LDL, and triglycerides"
          },
          {
            id: "4",
            name: "Liver Function Test",
            code: "LFT001",
            description: "ALT, AST, bilirubin, and other liver enzymes"
          },
          {
            id: "5",
            name: "Kidney Function Test",
            code: "KFT001",
            description: "Creatinine, BUN, and other kidney markers"
          }
        ];
        
        return NextResponse.json(mockLabTests, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      return NextResponse.json({
        title: "Failed to fetch lab tests dropdown.",
        status: response.status,
        errors: {
          Business: [errorData?.message || errorData?.title || "The operation failed. Please try again."]
        }
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching lab tests dropdown:', error);
    return NextResponse.json({
      title: "Internal server error.",
      status: 500,
      errors: {
        Business: [error instanceof Error ? error.message : 'Unknown error occurred']
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