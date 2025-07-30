const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function testAgentListing() {
  const client = new ElevenLabsClient({
    apiKey: 'sk_6830e93e3bfc772c19ccd171b8e2b83528a7399a6484d001'
  });

  try {
    console.log('Testing ElevenLabs ConvAI agent listing...');
    
    // Test: Try to list existing agents
    console.log('\nTrying to list agents...');
    const listResult = await client.conversationalAi.agents.list();
    console.log('List result:', JSON.stringify(listResult, null, 2));
    
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

testAgentListing();
