import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const key = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key-for-development-only-never-use-in-production');
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    return await verifyToken(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getSessionWithTeam() {
  try {
    const session = await getSession();
    if (!session) return null;

    // Get user's primary team
    const [userTeam] = await db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
      .limit(1);

    return {
      ...session,
      user: {
        ...session.user,
        teamId: userTeam?.teamId || null,
        teamRole: userTeam?.role || null,
      }
    };
  } catch (error) {
    console.error('Error getting session with team:', error);
    return null;
  }
}

export async function setSession(user: NewUser) {
  try {
    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session: SessionData = {
      user: { id: user.id! },
      expires: expiresInOneDay.toISOString(),
    };
    const encryptedSession = await signToken(session);
    (await cookies()).set('session', encryptedSession, {
      expires: expiresInOneDay,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  } catch (error) {
    console.error('Error setting session:', error);
    throw new Error('Failed to set session');
  }
}
