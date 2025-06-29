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

// Helper to flatten nested objects for query string
const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  return Object.entries(obj).reduce((acc: Record<string, string>, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = String(value);
    }
    return acc;
  }, {});
};

export async function POST(request: NextRequest) {
  console.log('GET /api/patients/search invoked');

  const auth = checkAuth(request);
  if ('error' in auth) return auth.error;

  const sp = request.nextUrl.searchParams;

  let body: any = {};
  if (request.headers.get('content-type')?.includes('application/json')) {
    body = await request.json();
  }

  // Build a complete PatientSearch object for .NET backend
  const searchBody = {
    patnano: '',
    Gate: 0,
    DocumentID: '',
    OCRValue: '',
    ocrObj: {},
    NatID: '',
    PatNumber: 0,
    Trano: '',
    PatName: body.patName || '',
    PatarName: body.patarName || '',
    Mobile: body.patMobile || '',
    Email: '',
    flag: 1,
    PatientList: [],
    PatientType: 0,
    Branch: '',
    MobileCountryCode: body.mobileCountryCode || 0,
    CountryId: 0,
    IsLinked: false,
  };

  // If all search fields are empty, return empty result
  if (!searchBody.PatName && !searchBody.PatarName && !searchBody.Mobile) {
    return NextResponse.json({ patientList: [] });
  }

  console.log('Constructed request body:', searchBody);

  try {
    const apiRes = await fetch(`${getBaseUrl()}/Patient/search`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify(searchBody),
      // @ts-ignore
      agent: getHttpsAgent(),
    });

    console.log('API response status:', apiRes.status);

    if (!apiRes.ok) {
      const error = await apiRes.json().catch(() => apiRes.text());
      console.error('Validation error from /Patient/search:', error);
      return NextResponse.json({ message: 'Validation failed', details: error }, { status: apiRes.status });
    }

    const result = await apiRes.json();
    console.log('API response data:', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ message: 'Failed to search patients' }, { status: 500 });
  }
}
