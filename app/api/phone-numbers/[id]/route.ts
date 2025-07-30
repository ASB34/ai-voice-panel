import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { voiceAgents, phoneNumbers } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find phone number in database
    const phoneNumber = await db.query.phoneNumbers.findFirst({
      where: and(
        eq(phoneNumbers.id, id),
        eq(phoneNumbers.userId, session.user.id)
      ),
      with: {
        assignedAgent: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Format response
    const formattedNumber = {
      id: phoneNumber.id,
      phoneNumberId: phoneNumber.phoneNumberId,
      phoneNumber: phoneNumber.phoneNumber,
      assignedAgentId: phoneNumber.assignedAgentId,
      assignedAgentName: phoneNumber.assignedAgent?.name,
      status: phoneNumber.status,
      provider: phoneNumber.provider,
      country: phoneNumber.country,
      areaCode: phoneNumber.areaCode,
      label: phoneNumber.label,
      addedAt: phoneNumber.createdAt?.toISOString(),
      systemData: phoneNumber.systemData ? JSON.parse(phoneNumber.systemData) : null
    };

    return NextResponse.json(formattedNumber);
  } catch (error: any) {
    console.error('Error fetching phone number details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phone number details', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { agentId } = body;

    console.log('🔄 Agent assignment request:', { phoneNumberId: id, agentId });

    // Find phone number in database
    const phoneNumber = await db.query.phoneNumbers.findFirst({
      where: and(
        eq(phoneNumbers.id, id),
        eq(phoneNumbers.userId, session.user.id)
      )
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Get user's agents to verify ownership and get agent details
    let agentName = null;
    let elevenLabsAgentId = null;
    
    if (agentId && agentId !== 'unassign') {
      try {
        // Get user's agents from database
        const userAgents = await db.query.voiceAgents.findMany({
          where: eq(voiceAgents.customerId, session.user.id),
        });

        const agent = userAgents.find(a => a.id === agentId);
        if (!agent) {
          return NextResponse.json({ 
            error: 'Agent bulunamadı veya size ait değil' 
          }, { status: 404 });
        }

        agentName = agent.name;
        elevenLabsAgentId = agent.elevenLabsAgentId;
        
        console.log('✅ Agent found:', { agentName, elevenLabsAgentId });
      } catch (error) {
        console.error('Error fetching user agents:', error);
        return NextResponse.json({ 
          error: 'Agent bilgileri alınamadı' 
        }, { status: 500 });
      }
    }

    // Make ElevenLabs API call to assign/unassign agent
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey && phoneNumber.phoneNumberId) {
      try {
        const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumber.phoneNumberId}`;
        
        const elevenLabsResponse = await fetch(elevenLabsUrl, {
          method: 'PATCH',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agentId === 'unassign' ? null : elevenLabsAgentId,
          }),
        });

        if (!elevenLabsResponse.ok) {
          const errorText = await elevenLabsResponse.text();
          console.error('ElevenLabs API error:', errorText);
          return NextResponse.json({ 
            error: 'Sistem tarafında agent ataması yapılamadı. Lütfen daha sonra tekrar deneyin.',
            debug: errorText
          }, { status: 500 });
        }

        console.log('✅ ElevenLabs agent assignment successful');
      } catch (error) {
        console.error('ElevenLabs API call failed:', error);
        return NextResponse.json({ 
          error: 'Sistem tarafında agent ataması yapılamadı',
          debug: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Update phone number in database
    const [updatedPhoneNumber] = await db
      .update(phoneNumbers)
      .set({
        assignedAgentId: agentId === 'unassign' ? null : agentId,
        updatedAt: new Date()
      })
      .where(eq(phoneNumbers.id, id))
      .returning();

    // Format response
    const responseNumber = {
      id: updatedPhoneNumber.id,
      phoneNumberId: updatedPhoneNumber.phoneNumberId,
      phoneNumber: updatedPhoneNumber.phoneNumber,
      assignedAgentId: updatedPhoneNumber.assignedAgentId,
      assignedAgentName: agentId === 'unassign' ? null : agentName,
      status: updatedPhoneNumber.status,
      provider: updatedPhoneNumber.provider,
      country: updatedPhoneNumber.country,
      areaCode: updatedPhoneNumber.areaCode,
      label: updatedPhoneNumber.label,
      addedAt: updatedPhoneNumber.createdAt?.toISOString(),
      updatedAt: updatedPhoneNumber.updatedAt?.toISOString()
    };

    console.log('✅ Phone number updated:', responseNumber);

    return NextResponse.json({ 
      success: true, 
      phoneNumber: responseNumber,
      message: agentId && agentId !== 'unassign' ? 'Agent başarıyla atandı!' : 'Agent ataması başarıyla kaldırıldı!'
    });
  } catch (error: any) {
    console.error('Error updating phone number:', error);
    return NextResponse.json(
      { error: 'Failed to update phone number', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find phone number in database
    const phoneNumber = await db.query.phoneNumbers.findFirst({
      where: and(
        eq(phoneNumbers.id, id),
        eq(phoneNumbers.userId, session.user.id)
      )
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Delete from database
    await db
      .delete(phoneNumbers)
      .where(eq(phoneNumbers.id, id));

    return NextResponse.json({ 
      success: true, 
      message: 'Telefon numarası başarıyla panelınızdan kaldırıldı!'
    });
  } catch (error: any) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json(
      { error: 'Failed to delete phone number', details: error.message },
      { status: 500 }
    );
  }
}
