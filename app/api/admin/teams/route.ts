import { NextResponse, NextRequest } from 'next/server';
import { getAllTeams } from '@/lib/db/admin-queries';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    
    const teams = await getAllTeams(page, limit);
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
