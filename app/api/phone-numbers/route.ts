import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClientWrapper } from '@/lib/elevenlabs/client';
import { getSessionWithTeam } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { voiceAgents, phoneNumbers } from '@/lib/db/schema';
import UsageService from '@/lib/billing/usage';

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await getSessionWithTeam();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's phone numbers from database
    const userNumbers = await db.query.phoneNumbers.findMany({
      where: eq(phoneNumbers.userId, session.user.id),
      with: {
        assignedAgent: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Format response to match frontend expectations
    const formattedNumbers = userNumbers.map(num => ({
      id: num.id,
      phoneNumberId: num.phoneNumberId,
      phoneNumber: num.phoneNumber,
      assignedAgentId: num.assignedAgentId,
      assignedAgentName: num.assignedAgent?.name,
      status: num.status,
      provider: num.provider,
      country: num.country,
      areaCode: num.areaCode,
      label: num.label,
      addedAt: num.createdAt?.toISOString(),
      systemData: num.systemData ? JSON.parse(num.systemData) : null
    }));

    return NextResponse.json({ phoneNumbers: formattedNumbers });
  } catch (error: any) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phone numbers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await getSessionWithTeam();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check phone number usage limit
    if (session.user.teamId) {
      const usageCheck = await UsageService.checkUsageLimit(
        session.user.teamId,
        'phone_number_purchase',
        1
      );

      if (!usageCheck.allowed) {
        return NextResponse.json({ 
          error: usageCheck.reason || 'Telefon numarası limitini aştınız',
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Telefon numarası gereklidir' }, { status: 400 });
    }

    // Basic phone number validation
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json({ 
        error: 'Geçerli bir telefon numarası girin (ör: +905551234567)' 
      }, { status: 400 });
    }

    // Telefon numarası sistemde kontrol et
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Ses sistemi yapılandırılmamış' }, { status: 500 });
    }

    let foundNumber: any = null;

    try {
      console.log('🔍 Checking phone number in system:', phoneNumber);
      
      // Get all available phone numbers from system
      const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 API Error response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📋 Full API response:', data);
      
      // API directly returns an array of phone numbers
      const allNumbers = Array.isArray(data) ? data : [];
      console.log('📋 System phone numbers found:', allNumbers.length);
      console.log('📋 Phone numbers:', allNumbers.map((p: any) => `${p.phone_number} (${p.label})`));
      
      // Check if the entered number exists in the system
      foundNumber = allNumbers.find((num: any) => 
        (num.phone_number === phoneNumber) || 
        (num.phone_number === phoneNumber.replace(/\s/g, ''))
      );
      
      console.log('🔍 Looking for number:', phoneNumber);
      console.log('🔍 Found number details:', foundNumber);
      
      if (!foundNumber) {
        return NextResponse.json({ 
          error: `Bu telefon numarası sistemde kayıtlı değil. Girilen: ${phoneNumber}`,
          debug: {
            enteredNumber: phoneNumber,
            totalAvailableNumbers: allNumbers.length,
            availableNumbers: allNumbers.map((num: any) => ({
              phone_number: num.phone_number,
              label: num.label,
              provider: num.provider,
              assigned_agent: num.assigned_agent?.agent_name || 'Atanmamış'
            }))
          }
        }, { status: 404 });
      }

      // If number is assigned to an agent, check if user owns that agent
      if (foundNumber.assigned_agent) {
        const assignedAgentId = foundNumber.assigned_agent.agent_id;
        
        // Get user's agents to check ownership
        const userAgents = await db.query.voiceAgents.findMany({
          where: eq(voiceAgents.customerId, session.user.id),
        });

        const userOwnsAgent = userAgents.some(agent => 
          agent.elevenLabsAgentId === assignedAgentId
        );

        if (!userOwnsAgent) {
          return NextResponse.json({ 
            error: `Bu telefon numarası "${foundNumber.assigned_agent.agent_name}" agent'ına atanmış ve bu agent sizin panelinizdeki agent'larınız arasında bulunmuyor.`,
            debug: { 
              assignedAgentId,
              assignedAgentName: foundNumber.assigned_agent.agent_name,
              userAgentIds: userAgents.map(a => a.elevenLabsAgentId)
            }
          }, { status: 403 });
        }
        
        console.log('✅ User owns the assigned agent, allowing phone number addition');
      }
      
      console.log('✅ Phone number found and available:', foundNumber);
      
    } catch (error: any) {
      console.error('System phone number check failed:', error);
      return NextResponse.json({ 
        error: 'Telefon numarası sistemde doğrulanamadı. Lütfen daha sonra tekrar deneyin.',
        debug: { error: error?.message || 'Unknown error' }
      }, { status: 500 });
    }

    // Check if number is already assigned to this user in database
    const existingUserNumber = await db.query.phoneNumbers.findFirst({
      where: eq(phoneNumbers.phoneNumber, phoneNumber) && eq(phoneNumbers.userId, session.user.id)
    });

    if (existingUserNumber) {
      return NextResponse.json({ 
        error: 'Bu telefon numarası zaten panelinizdeki numaralar arasında mevcut.' 
      }, { status: 400 });
    }

    // Check if number is already assigned to another user in database
    const existingOtherUserNumber = await db.query.phoneNumbers.findFirst({
      where: eq(phoneNumbers.phoneNumber, phoneNumber)
    });

    if (existingOtherUserNumber && existingOtherUserNumber.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Bu telefon numarası başka bir kullanıcı tarafından kullanılmaktadır.' 
      }, { status: 400 });
    }

    // Add phone number to database
    // Note: We don't assign ElevenLabs agent_id directly because it's not a UUID
    // User can assign agents manually later from their own voice agents
    const [newPhoneNumber] = await db.insert(phoneNumbers).values({
      userId: session.user.id,
      phoneNumber,
      phoneNumberId: foundNumber.phone_number_id,
      assignedAgentId: null, // Set to null, user can assign later
      status: 'active',
      provider: foundNumber.provider,
      country: foundNumber.country,
      areaCode: foundNumber.area_code,
      label: foundNumber.label,
      systemData: JSON.stringify(foundNumber)
    }).returning();

    // Format response to match frontend expectations
    const responseNumber = {
      id: newPhoneNumber.id,
      phoneNumberId: newPhoneNumber.phoneNumberId,
      phoneNumber: newPhoneNumber.phoneNumber,
      assignedAgentId: newPhoneNumber.assignedAgentId,
      assignedAgentName: null, // No agent assigned initially
      status: newPhoneNumber.status,
      provider: newPhoneNumber.provider,
      country: newPhoneNumber.country,
      areaCode: newPhoneNumber.areaCode,
      label: newPhoneNumber.label,
      addedAt: newPhoneNumber.createdAt?.toISOString(),
      systemData: foundNumber
    };

    // Record usage for phone number purchase
    if (session.user.teamId) {
      try {
        await UsageService.recordUsage({
          teamId: session.user.teamId,
          userId: session.user.id,
          usageType: 'phone_number_purchase',
          quantity: 1,
          unit: 'count',
          phoneNumberId: newPhoneNumber.id,
          metadata: {
            phoneNumber,
            provider: foundNumber.provider,
            country: foundNumber.country,
            source: 'phone_numbers_api'
          }
        });
      } catch (usageError) {
        console.error('Failed to record phone number usage:', usageError);
        // Don't fail the request if usage recording fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      phoneNumber: responseNumber,
      message: 'Telefon numarası başarıyla panelınıza eklendi!'
    });
  } catch (error: any) {
    console.error('Error adding phone number:', error);
    return NextResponse.json(
      { error: 'Telefon numarası eklenemedi', details: error.message },
      { status: 500 }
    );
  }
}
