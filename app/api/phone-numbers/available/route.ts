import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'US';
    const areaCode = searchParams.get('areaCode') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Initialize ElevenLabs client
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new ElevenLabsClientWrapper({ apiKey: elevenlabsApiKey });

    // Get all available phone numbers from ElevenLabs system
    const allNumbers = await client.listAllPhoneNumbers();
    
    // Filter by country and area code if provided
    let filteredNumbers = allNumbers;
    
    if (country && country !== 'ALL') {
      filteredNumbers = filteredNumbers.filter(num => 
        num.country === country || num.phoneNumber?.startsWith(`+${country}`)
      );
    }
    
    if (areaCode) {
      filteredNumbers = filteredNumbers.filter(num => 
        num.areaCode === areaCode || num.phoneNumber?.includes(areaCode)
      );
    }
    
    // Limit results
    const phoneNumbers = filteredNumbers.slice(0, limit);

    return NextResponse.json({ phoneNumbers });
  } catch (error: any) {
    console.error('Error fetching available phone numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available phone numbers', details: error.message },
      { status: 500 }
    );
  }
}
