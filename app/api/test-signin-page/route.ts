import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple test to see if the page can load
    const url = request.url;
    const searchParams = new URL(url).searchParams;
    
    return NextResponse.json({
      success: true,
      message: 'Signin page API test successful',
      url,
      searchParams: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Signin page test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
