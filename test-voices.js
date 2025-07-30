const { ElevenLabsClientWrapper } = require('./lib/elevenlabs/client.ts');

async function testElevenLabsAgents() {
  const client = new ElevenLabsClientWrapper({
    apiKey: 'sk_9045c396dacd8b9ef18c45f61ae2536e4473184258e00e7b'
  });

  try {
    console.log('Testing ElevenLabs Agent API...');
    
    // Test: List all agents
    console.log('\n1. Getting agents list...');
    const agents = await client.listAgents();
    console.log('Found agents:', JSON.stringify(agents, null, 2));
    
    // Test: Get specific agent details if any exists
    if (agents && agents.length > 0) {
      console.log('\n2. Getting specific agent details...');
      const agentId = agents[0].agent_id || agents[0].agentId;
      console.log('Testing with agent ID:', agentId);
      
      const agentDetails = await client.getAgent(agentId);
      console.log('Agent details:', JSON.stringify(agentDetails, null, 2));
    } else {
      console.log('\nNo agents found in account');
    }
    
  } catch (error) {
    console.error('Error:', error);
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    if (error.body) {
      console.error('Error body:', error.body);
    }
  }
}

testElevenLabsAgents();
