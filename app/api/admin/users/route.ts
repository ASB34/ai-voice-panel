import { NextResponse, NextRequest } from 'next/server';
import { getAllUsers } from '@/lib/db/admin-queries';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const users = await getAllUsers(page, limit, search);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
