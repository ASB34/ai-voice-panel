const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function testElevenLabs() {
  const client = new ElevenLabsClient({
    apiKey: 'sk_9045c396dacd8b9ef18c45f61ae2536e4473184258e00e7b'
  });

  try {
    console.log('Testing ElevenLabs connection...');
    
    // Test: Try to create a simple agent - same as our application does
    console.log('\nTrying to create a simple agent...');
    const createResult = await client.conversationalAi.agents.create({
      name: 'Test Agent',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Premade voice
      conversationConfig: {
        agent: {
          prompt: 'You are a helpful assistant.',
          firstMessage: 'Hello! How can I help you?',
          language: 'en'
        }
      }
    });
    console.log('Create result:', JSON.stringify(createResult, null, 2));
    
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

testElevenLabs();
