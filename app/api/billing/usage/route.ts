import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTeam } from '@/lib/auth/session';
import UsageService from '@/lib/billing/usage';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithTeam();
    if (!session?.user?.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limits = await UsageService.getTeamUsageLimits(session.user.teamId);
    const teamWithPlan = await UsageService.getTeamWithPlan(session.user.teamId);

    return NextResponse.json({
      limits,
      plan: teamWithPlan?.plan,
      currentPeriod: teamWithPlan ? UsageService.getCurrentBillingPeriod(teamWithPlan) : null
    });
  } catch (error) {
    console.error('Error fetching usage limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithTeam();
    if (!session?.user?.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { usageType, quantity = 1 } = body;

    if (!usageType) {
      return NextResponse.json(
        { error: 'usageType is required' },
        { status: 400 }
      );
    }

    const check = await UsageService.checkUsageLimit(
      session.user.teamId,
      usageType,
      quantity
    );

    return NextResponse.json(check);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
