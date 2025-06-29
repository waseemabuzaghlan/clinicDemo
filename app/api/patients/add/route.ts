import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { getBaseUrl } from '@/lib/api';
import { PatientMedia } from '../../../../types/patient-media';

const getHttpsAgent = () => new https.Agent({ rejectUnauthorized: false });

const checkAuth = (request: NextRequest) => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { token };
};

// Dummy encrypt function for demonstration
function encrypt(value: string) {
  // Replace with your actual encryption logic
  return value ? `enc_${value}` : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if ('error' in auth) return auth.error;

    const patientData = await request.json();
    console.log('POST /api/patients patientData:', patientData);

    // Compose the backend payload as required by the .NET API
    // Fill with defaults and map from patientData as needed
    const now = new Date().toISOString();
    const userName = patientData.createdByName || 'System';
    const patNumber = patientData.patNumber || 0;
    const patNumberEnc = patientData.patNumberEnc || 'string';
    // Map media fields from patientData.media or fallback
    const media = patientData.media || {};

    const patSex = patientData.gender === 1 ? 'Male' : patientData.gender === 2 ? 'Female' : '';

    const payload = {
      patNumber: patNumber,
      patNumberEnc: patNumberEnc,
      lastVisit: now,
      gate: 0,
      have: 'true',
      _Patient_Media: {
        id: media.id || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        patientID: patNumber,
        patientPhoto: media.PatientPhoto || '',
        patientFingerprint: media.PatientFingerprint || '',
        patientScannedDoc: media.PatientScannedDoc || '',
      },
      patient_identity: patientData.patient_identity || {
        gate: 0,
        id: 0,
        patNumber: patNumber,
        fK_PatNumberEnc: patNumberEnc,
        img: '',
        firstEnName: patientData.firstEnName || '',
        fatherEnName: patientData.fatherEnName || '',
        finalEnName: patientData.familyEnName || '',
        familyEnName: patientData.finalEnName || '',
        firstArName: patientData.firstArName || '',
        fatherArName: patientData.fatherArName || '',
        familyArName: patientData.finalArName || '',
        finalArName: patientData.familyArName || '',
        patName: '',
        countryId: 0,
        patarName: '',
        lastVisit: now,
      },
      _Patient_Info: patientData._Patient_Info || {
        id: 0,
        gate: 0,
        patNumber: patNumber,
        fK_PatNumberEnc: patNumberEnc,
        patDateOfBirth: now,
        patDateOfBirthStr: '',
        dateNotCorrect: 0,
        bodValue: '',
        patAge: '',
        patSex: patSex,
        patday: '',
        communicationLanguage: '',
        patNationality: patientData.nationality||'',
        fk_NationalityID: 0,
        patnano: patientData.nationalId||'',
        documentID: patientData.documentId ||'',
        patientType: 0,
        deleted: true,
        ocr: '',
        residency: '',
        nationalityIdOrgen: '',
        _Patient_Nationality: [],
      },
      _Patient_ContactInfo: patientData._Patient_ContactInfo || {
        id: 0,
        gate: 0,
        patNumber: patNumber,
        fK_PatNumberEnc: patNumberEnc,
        _Patient_Mobile: Array.isArray(patientData.mobileNo)
          ? patientData.mobileNo.filter(Boolean).map((mobile: any) => ({
              id: 0,
              fK_PatNumber: patNumber,
              fK_PatNumberEnc: patNumberEnc,
              mobileCountryCode: mobile.countryCode || 962,
              patMobile: mobile.number,
              jorMobile: 0,
              activemobile: 1,
              activemobileDate: '',
              stopmobile: 0,
              stopmobileDate: '',
              useByDefault: true,
              deleted: true,
              createdby: 0,
              createdAt: now,
              modifiedBy: 0,
              modifiedAt: now,
              opr: '',
            }))
          : [],
        _Patient_Email: Array.isArray(patientData.email)
          ? patientData.email.filter(Boolean).map((email: string) => ({
              id: 0,
              fK_PatNumber: patNumber,
              fK_PatNumberEnc: patNumberEnc,
              patEmail: email,
              patpassword: '',
              stopEmail: 0,
              stopEmailDate: '',
              activeEmail: 1,
              activeEmailDate: '',
              useByDefault: true,
              deleted: true,
              createdby: 0,
              createdAt: now,
              modifiedBy: 0,
              modifiedAt: now,
              opr: '',
            }))
          : [],
      },
      _Patient_Notes: patientData._Patient_Notes || [],
      _Patient_Locations: patientData._Patient_Locations || {
        patNumber: patNumber,
        gate: 0,
        p_Locations: [],
      },
      _Patient_Options: patientData._Patient_Options || {
        id: 0,
        gate: 0,
        fK_PatNumber: patNumber,
        fK_PatNumberEnc: patNumberEnc,
        dontReprint: true,
        dontPrint: true,
        blockdata: true,
        useByDefault: true,
        deleted: true,
        createdby: 0,
        createdAt: now,
        modifiedBy: 0,
        modifiedAt: now,
        isActiveConditions: true,
        requestUpdateData: true,
      },
      _Patient_SendOptions: patientData._Patient_SendOptions || {
        prints: true,
        printed: '',
        userPrinted: '',
        fK_PatNumber: '',
        fK_PatNumberEnc: '',
        patientName: '',
        emails: '',
        mobiles: '',
        emailPatient: true,
        emailedPatient: '',
        useremailedPatient: '',
        anothercopytopatient: true,
        anotheredcopytopatient: '',
        userAnotheredcopytopatient: '',
        whatsAppPatient: true,
        whatsAppedPatient: '',
        whatsappStopInvoicePatient: true,
        whatsappedStopInvoicePatient: '',
        hasDoctor: true,
        doctorOne: '',
        trarefnumber: 0,
        doctorTwo: '',
        trarefnumber2: 0,
        doctorOneEmail: '',
        doctorTwoEmail: '',
        emailConsultant: true,
        emailedConsultant: '',
        useremailedConsultant: '',
        doctorOneMobile: '',
        doctorTwoMobile: '',
        whatsAppConsultant: true,
        whatsAppedConsultant: '',
        copytodoctor: true,
        copyedtodoctor: '',
        userCopyedtodoctor: '',
        hasInsurance: true,
        insuranceName: '',
        insuranceEmail: '',
        emailInsurance: true,
        insuranceMobile: '',
        whatsAppInsurance: true,
        hasCorporate: true,
        corporateName: '',
        corporateEmail: '',
        emailCorporate: true,
        emailedCorporate: '',
        corporateMobile: '',
        whatsAppCorporate: true,
        whatsAppedCorporate: '',
        hasReferral: true,
        referralName: '',
        referralEmail: '',
        emailReferral: true,
        emailedReferral: '',
        useremailedReferral: true,
        referralMobile: '',
        whatsAppReferral: true,
        whatsAppedReferral: '',
        stopSendInvoiceToReferral: true,
        note: '',
        dontPrintTransaction: true,
        hideResults: true,
        dontPrintPatient: true,
        dontReprintPatient: true,
        inpatient: true,
        balance: 0,
        sendWhatsAppLog: [],
        sendEmailsLog: [],
      },
      _Patient_InsuranceCard: {
        ...(patientData._Patient_InsuranceCard || {}),
        id: 0,
        gate: 0,
        patNumber: patNumber,
        _patient_Insurance: Array.isArray(patientData.insuranceCardNumber)
          ? patientData.insuranceCardNumber.filter(Boolean).map((cardNo: string) => ({
              id: 0,
              fK_PatNumber: patNumber,
              cardNo: cardNo,
              fK_trarefnumber3: 0,
              insuranceName: '',
              useByDefault: true,
              deleted: true,
              createdby: 0,
              createdAt: now,
              modifiedBy: 0,
              modifiedAt: now,
              opr: '',
            }))
          : [],
      },
      _Patient_Cond: patientData._Patient_Cond || [],
      createdby: 0,
      createdby_Name: userName,
      createdAt: now,
      modifiedBy: 0,
      modifiedBy_Name: userName,
      modifiedAt: now,
      labTelephone: '',
      labEmail: '',
      verifyAt: now,
      lPat_Attachment: [],
      isNationalityInfoNotMatch: true,
      _Search_PaitentProfile: patientData._Search_PaitentProfile || {},
      transactionsCount: 0,
      _Patient_Nationality: patientData._Patient_Nationality || [],
    };

    console.log('POST /api/patients payload:', payload);

    const response = await fetch(`${getBaseUrl()}/Patient/add`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify(payload),
      // @ts-ignore
      agent: getHttpsAgent(),
    });

    let errorData = null;
    if (!response.ok) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('API /Patient/add validation error:', errorData);
      if (errorData?.errors) {
        Object.entries(errorData.errors).forEach(([field, messages]) => {
          console.error(`❌ Field "${field}":`, messages);
        });
      }
      return NextResponse.json(
        { message: 'Validation failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error adding patient:', error);
    return NextResponse.json(
      { message: 'Failed to add patient' },
      { status: 500 }
    );
  }
};
