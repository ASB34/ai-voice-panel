import { NextResponse, NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // User'ın var olup olmadığını kontrol et
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Temporary password oluştur
    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
    
    // Password'u hash'le
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    // User'ın password'unu güncelle
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // TODO: Email ile temporary password'u gönder (email service entegrasyonu gerekiyor)
    console.log(`Password reset for user ${user.email}: ${temporaryPassword}`);
    
    return NextResponse.json({ 
      message: 'Password reset successfully',
      temporaryPassword: temporaryPassword
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
