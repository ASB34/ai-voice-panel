import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';

export async function GET() {
  try {
    console.log('🔍 Checking admin session...');
    const session = await getAdminSession();
    console.log('👤 Session result:', session ? `✅ ${session.email}` : '❌ No session');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      admin: {
        id: session.id,
        email: session.email,
        name: session.name,
        isSuperAdmin: session.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('💥 Admin session check error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
