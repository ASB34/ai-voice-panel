import { NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/db/admin-queries';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET() {
  try {
    await requireAdminAuth();
    const stats = await getSystemStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
