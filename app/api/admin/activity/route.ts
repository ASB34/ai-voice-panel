import { NextResponse, NextRequest } from 'next/server';
import { getActivityLogs } from '@/lib/db/admin-queries';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const action = searchParams.get('action') || undefined;
    
    const activities = await getActivityLogs(page, limit, action);
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
