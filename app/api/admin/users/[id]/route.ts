import { NextResponse, NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, subscriptionPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET(
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
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        teamMembers: {
          with: {
            team: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
    
    const { name, email, role, planId, newPassword } = await request.json();
    
    console.log('Received update request for user:', userId);
    console.log('Update data:', { name, email, role, planId, newPassword: !!newPassword });
    
    // User update object'i hazırla
    const updateData: any = {
      name,
      email,
      updatedAt: new Date()
    };
    
    // Eğer yeni password varsa, hash'le ve ekle
    if (newPassword && newPassword.trim()) {
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      updateData.passwordHash = hashedPassword;
    }
    
    // User'ı güncelle
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Eğer role değiştiriliyorsa, team membership'i güncelle
    if (role) {
      const userTeam = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, userId)
      });
      
      if (userTeam) {
        await db
          .update(teamMembers)
          .set({
            role
          })
          .where(and(
            eq(teamMembers.userId, userId),
            eq(teamMembers.teamId, userTeam.teamId)
          ));
      }
    }
    
    // Eğer plan değiştiriliyorsa, subscription'ı güncelle
    if (planId && planId !== 'no-change') {
      console.log('Updating subscription plan to:', planId);
      
      const newPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, parseInt(planId))
      });
      
      console.log('Found plan:', newPlan);
      
      if (newPlan) {
        const userTeam = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, userId),
          with: {
            team: true
          }
        });
        
        console.log('User team:', userTeam);
        
        if (userTeam?.team) {
          // Team'in subscription'ını güncelle
          await db
            .update(teams)
            .set({
              planName: newPlan.name,
              planId: newPlan.id,
              stripeProductId: newPlan.stripeProductId,
              updatedAt: new Date()
            })
            .where(eq(teams.id, userTeam.team.id));
          
          console.log(`Updated user ${userId} subscription to plan: ${newPlan.displayName}`);
        }
      }
    } else {
      console.log('Plan not being updated. planId:', planId);
    }
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Önce user'ın var olup olmadığını kontrol et
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Owner role'une sahip son user'ı silmeyi önle
    const userMembership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId)
    });
    
    if (userMembership?.role === 'owner') {
      const ownerCount = await db.query.teamMembers.findMany({
        where: and(
          eq(teamMembers.teamId, userMembership.teamId),
          eq(teamMembers.role, 'owner')
        )
      });
      
      if (ownerCount.length <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the last owner of a team' 
        }, { status: 400 });
      }
    }
    
    // Team membership'leri sil
    await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
    
    // User'ı sil
    await db.delete(users).where(eq(users.id, userId));
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
