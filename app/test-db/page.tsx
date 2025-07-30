import { db } from '@/lib/db/drizzle';
import { users, voiceAgents } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

async function testElevenLabsConnection() {
  try {
    const { ElevenLabsClientWrapper } = await import('@/lib/elevenlabs/client');
    const client = new ElevenLabsClientWrapper({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });
    
    // Test connection by listing agents
    const agents = await client.listAgents();
    return { success: true, agentCount: agents.length };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export default async function TestDBPage() {
  try {
    // Try to add new columns
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`);
    
    const userCount = await db.select().from(users);
    
    // Get voice agents to test
    const agents = await db.select().from(voiceAgents);
    
    // Update first agent with a test ElevenLabs ID
    if (agents.length > 0 && !agents[0].elevenLabsAgentId) {
      await db
        .update(voiceAgents)
        .set({ elevenLabsAgentId: 'test-elevenlabs-id-123' })
        .where(eq(voiceAgents.id, agents[0].id));
    }
    
    // Test ElevenLabs connection
    const elevenLabsTest = await testElevenLabsConnection();
    
    return (
      <div className="p-8">
        <h1>Database Test</h1>
        <p>✅ Database connection successful!</p>
        <p>✅ New columns added successfully!</p>
        <p>Users count: {userCount.length}</p>
        <p>Voice agents count: {agents.length}</p>
        {agents.length > 0 && (
          <p>✅ First agent updated with test ElevenLabs ID</p>
        )}
        
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h2>ElevenLabs Connection Test</h2>
          {elevenLabsTest.success ? (
            <p>✅ ElevenLabs API connected! Found {elevenLabsTest.agentCount} agents</p>
          ) : (
            <p>❌ ElevenLabs API failed: {elevenLabsTest.error}</p>
          )}
        </div>
        
        <div className="mt-4">
          <h2>Voice Agents:</h2>
          <ul>
            {agents.map((agent) => (
              <li key={agent.id} className="mb-2">
                <strong>{agent.name}</strong> - 
                ElevenLabs ID: {agent.elevenLabsAgentId || 'None'} - 
                Active: {agent.isActive ? 'Yes' : 'No'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1>Database Test</h1>
        <p>❌ Database operation failed!</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}
