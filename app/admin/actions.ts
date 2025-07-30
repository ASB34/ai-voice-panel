'use server';

import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, ActivityType, activityLogs } from '@/lib/db/schema';
import { validatedAdminAction } from '@/lib/auth/admin-middleware';
import { hashPassword } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

// Log admin activity
async function logAdminActivity(
  adminId: number,
  action: string,
  targetUserId?: number,
  ipAddress?: string
) {
  try {
    await db.insert(activityLogs).values({
      teamId: 1, // Use a default team ID for admin activities
      userId: adminId,
      action: `ADMIN_${action}`,
      ipAddress: ipAddress || '',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// Update user role
const updateUserRoleSchema = z.object({
  userId: z.string().transform(Number),
  role: z.enum(['member', 'owner', 'admin'])
});

export const updateUserRole = validatedAdminAction(
  updateUserRoleSchema,
  async (data, _, admin) => {
    const { userId, role } = data;

    try {
      await db
        .update(users)
        .set({ 
          role,
          updatedAt: new Date()
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)));

      await logAdminActivity(admin.id, 'UPDATE_USER_ROLE', userId);
      
      revalidatePath('/admin/users');
      return { success: `User role updated to ${role}` };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { error: 'Failed to update user role' };
    }
  }
);

// Create new user
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['member', 'owner', 'admin'])
});

export const createUser = validatedAdminAction(
  createUserSchema,
  async (data, _, admin) => {
    const { name, email, password, role } = data;

    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return { error: 'User with this email already exists' };
      }

      const passwordHash = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role
        })
        .returning();

      await logAdminActivity(admin.id, 'CREATE_USER', newUser.id);
      
      revalidatePath('/admin/users');
      return { success: 'User created successfully' };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error: 'Failed to create user' };
    }
  }
);

// Delete user (soft delete)
const deleteUserSchema = z.object({
  userId: z.string().transform(Number)
});

export const deleteUser = validatedAdminAction(
  deleteUserSchema,
  async (data, _, admin) => {
    const { userId } = data;

    try {
      // Prevent admin from deleting themselves
      if (userId === admin.id) {
        return { error: 'You cannot delete your own account' };
      }

      // Soft delete user
      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          email: `deleted-${Date.now()}-${userId}@deleted.com` // Prevent email conflicts
        })
        .where(eq(users.id, userId));

      // Remove from team memberships
      await db
        .delete(teamMembers)
        .where(eq(teamMembers.userId, userId));

      await logAdminActivity(admin.id, 'DELETE_USER', userId);
      
      revalidatePath('/admin/users');
      return { success: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error: 'Failed to delete user' };
    }
  }
);

// Reset user password
const resetPasswordSchema = z.object({
  userId: z.string().transform(Number),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

export const resetUserPassword = validatedAdminAction(
  resetPasswordSchema,
  async (data, _, admin) => {
    const { userId, newPassword } = data;

    try {
      const passwordHash = await hashPassword(newPassword);

      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)));

      await logAdminActivity(admin.id, 'RESET_USER_PASSWORD', userId);
      
      revalidatePath('/admin/users');
      return { success: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: 'Failed to reset password' };
    }
  }
);

// Update team subscription
const updateTeamSubscriptionSchema = z.object({
  teamId: z.string().transform(Number),
  planName: z.string().optional(),
  subscriptionStatus: z.enum(['active', 'canceled', 'unpaid', 'trialing'])
});

export const updateTeamSubscription = validatedAdminAction(
  updateTeamSubscriptionSchema,
  async (data, _, admin) => {
    const { teamId, planName, subscriptionStatus } = data;

    try {
      await db
        .update(teams)
        .set({
          planName,
          subscriptionStatus,
          updatedAt: new Date()
        })
        .where(eq(teams.id, teamId));

      await logAdminActivity(admin.id, 'UPDATE_TEAM_SUBSCRIPTION', undefined);
      
      revalidatePath('/admin/teams');
      return { success: 'Team subscription updated successfully' };
    } catch (error) {
      console.error('Error updating team subscription:', error);
      return { error: 'Failed to update team subscription' };
    }
  }
);
