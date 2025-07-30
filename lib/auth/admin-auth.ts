import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-key-2024';
const ADMIN_TOKEN_NAME = 'admin-auth-token';

export interface AdminSession {
  id: number;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAdminToken(admin: AdminSession): string {
  const payload = JSON.stringify({
    ...admin,
    timestamp: Date.now(),
  });
  
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  // Use a special separator that won't appear in JSON
  const combined = payload + '|||SIGNATURE|||' + signature;
  const token = Buffer.from(combined).toString('base64');
  
  console.log('🔧 Token generation:', {
    payloadLength: payload.length,
    signatureLength: signature.length,
    combinedLength: combined.length,
    tokenLength: token.length,
    separatorPresent: combined.includes('|||SIGNATURE|||')
  });
  
  return token;
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    console.log('🔓 Token verification starting...');
    console.log('📄 Token length:', token.length);
    
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    console.log('📋 Decoded token:', decoded.substring(0, 100) + '...');
    
    const parts = decoded.split('|||SIGNATURE|||');
    console.log('✂️ Parts split:', { partsCount: parts.length });
    
    if (parts.length !== 2) {
      console.log('❌ Invalid token format - expected 2 parts, got:', parts.length);
      return null;
    }
    
    const [payload, signature] = parts;
    console.log('📦 Split result:', { 
      hasPayload: !!payload, 
      hasSignature: !!signature,
      payloadLength: payload.length,
      signatureLength: signature.length
    });
    
    if (!payload || !signature) {
      console.log('❌ Missing payload or signature');
      return null;
    }
    
    const hmac = crypto.createHmac('sha256', ADMIN_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    console.log('🔐 Signature check:', { 
      received: signature.substring(0, 10) + '...', 
      expected: expectedSignature.substring(0, 10) + '...',
      match: signature === expectedSignature 
    });
    
    if (signature !== expectedSignature) {
      console.log('❌ Signature mismatch');
      return null;
    }
    
    const data = JSON.parse(payload);
    console.log('📊 Token data:', { 
      email: data.email, 
      timestamp: new Date(data.timestamp).toISOString() 
    });
    
    // Check if token is expired (7 days)
    const age = Date.now() - data.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    console.log('⏰ Token age check:', { 
      ageMs: age, 
      maxAgeMs: maxAge, 
      isExpired: age > maxAge 
    });
    
    if (age > maxAge) {
      console.log('❌ Token expired');
      return null;
    }
    
    console.log('✅ Token verification successful');
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      isSuperAdmin: data.isSuperAdmin,
      isActive: data.isActive,
    };
  } catch (error) {
    console.log('💥 Token verification error:', error);
    return null;
  }
}

export async function setAdminSession(admin: AdminSession) {
  const token = generateAdminToken(admin);
  const cookieStore = await cookies();
  
  console.log('🍪 Setting cookie:', {
    tokenName: ADMIN_TOKEN_NAME,
    tokenLength: token.length,
    settings: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
  });
  
  cookieStore.set(ADMIN_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  console.log('🍪 Cookie set successfully');
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN_NAME)?.value;
  console.log('🍪 Token from cookie:', token ? 'EXISTS' : 'MISSING');
  
  if (!token) return null;

  const session = verifyAdminToken(token);
  console.log('🔓 Token verification:', session ? 'VALID' : 'INVALID');
  
  if (!session) return null;

  // Verify admin still exists and is active
  const admin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.id))
    .limit(1);

  console.log('🗃️ Database lookup:', admin[0] ? 'FOUND' : 'NOT_FOUND');

  if (!admin[0] || !admin[0].isActive) {
    await clearAdminSession();
    return null;
  }

  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_NAME);
  console.log('🧹 Admin session cleared');
}

export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const admin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (!admin[0] || !admin[0].isActive) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, admin[0].passwordHash);
  
  if (!isValidPassword) {
    return null;
  }

  // Update last login
  await db
    .update(adminUsers)
    .set({ lastLogin: new Date() })
    .where(eq(adminUsers.id, admin[0].id));

  return {
    id: admin[0].id,
    email: admin[0].email,
    name: admin[0].name,
    isSuperAdmin: admin[0].isSuperAdmin,
    isActive: admin[0].isActive,
  };
}
