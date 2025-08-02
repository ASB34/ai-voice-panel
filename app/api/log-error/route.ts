import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // This endpoint will capture any client-side errors
    const body = await request.json();
    
    console.error('Client-side error captured:', {
      error: body.error,
      stack: body.stack,
      url: body.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Error logged successfully'
    });

  } catch (error) {
    console.error('Error logging endpoint failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
