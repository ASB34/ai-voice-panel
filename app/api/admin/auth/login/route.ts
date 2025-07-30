import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, setAdminSession } from '@/lib/auth/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 Admin login attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await authenticateAdmin(email, password);
    console.log('🔐 Authentication result:', admin ? '✅ SUCCESS' : '❌ FAILED');
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await setAdminSession(admin);
    console.log('🍪 Session set for:', admin.email);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
