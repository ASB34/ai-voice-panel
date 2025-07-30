import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { db } from '@/lib/db/drizzle';
import { subscriptionPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyPrice);
    
    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxVoiceAgents: plan.maxVoiceAgents,
        maxPhoneNumbers: plan.maxPhoneNumbers,
        maxConversationsPerMonth: plan.maxConversationsPerMonth,
        maxMinutesPerMonth: plan.maxMinutesPerMonth,
        maxCustomVoices: plan.maxCustomVoices,
        hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
        hasApiAccess: plan.hasApiAccess,
        hasPrioritySupport: plan.hasPrioritySupport,
        isActive: plan.isActive
      }))
    });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, updates } = body;

    if (!planId || !updates) {
      return NextResponse.json(
        { error: 'Plan ID and updates are required' },
        { status: 400 }
      );
    }

    // Validate price format (in cents)
    if (updates.monthlyPrice && updates.monthlyPrice < 0) {
      return NextResponse.json(
        { error: 'Monthly price must be non-negative' },
        { status: 400 }
      );
    }

    if (updates.yearlyPrice && updates.yearlyPrice < 0) {
      return NextResponse.json(
        { error: 'Yearly price must be non-negative' },
        { status: 400 }
      );
    }

    // Calculate yearly price with 20% discount if not provided
    if (updates.monthlyPrice && !updates.yearlyPrice) {
      updates.yearlyPrice = Math.round(updates.monthlyPrice * 12 * 0.8);
    }

    const result = await db
      .update(subscriptionPlans)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, parseInt(planId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      plan: result[0]
    });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      maxVoiceAgents,
      maxPhoneNumbers,
      maxConversationsPerMonth,
      maxMinutesPerMonth,
      maxCustomVoices,
      hasAdvancedAnalytics,
      hasApiAccess,
      hasPrioritySupport
    } = body;

    if (!name || !displayName || !monthlyPrice) {
      return NextResponse.json(
        { error: 'Name, display name, and monthly price are required' },
        { status: 400 }
      );
    }

    // Calculate yearly price with 20% discount if not provided
    const calculatedYearlyPrice = yearlyPrice || Math.round(monthlyPrice * 12 * 0.8);

    const result = await db
      .insert(subscriptionPlans)
      .values({
        name,
        displayName,
        description: description || '',
        monthlyPrice,
        yearlyPrice: calculatedYearlyPrice,
        maxVoiceAgents: maxVoiceAgents || -1,
        maxPhoneNumbers: maxPhoneNumbers || -1,
        maxConversationsPerMonth: maxConversationsPerMonth || -1,
        maxMinutesPerMonth: maxMinutesPerMonth || -1,
        maxCustomVoices: maxCustomVoices || 0,
        hasAdvancedAnalytics: hasAdvancedAnalytics || false,
        hasApiAccess: hasApiAccess || false,
        hasPrioritySupport: hasPrioritySupport || false,
        isActive: true
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Plan created successfully',
      plan: result[0]
    });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false instead of deleting
    const result = await db
      .update(subscriptionPlans)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, parseInt(planId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan deactivated successfully'
    });
  } catch (error: any) {
    console.error('Error deactivating plan:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate plan' },
      { status: 500 }
    );
  }
}
