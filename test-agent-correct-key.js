const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function testAgentCreation() {
  const client = new ElevenLabsClient({
    apiKey: 'sk_6830e93e3bfc772c19ccd171b8e2b83528a7399a6484d001'  // Using the actual API key from .env
  });

  try {
    console.log('Testing ElevenLabs ConvAI agent creation with correct API key...');
    
    // Test: Try to create a simple agent - same as our application does
    console.log('\nTrying to create a simple agent...');
    const createResult = await client.conversationalAi.agents.create({
      name: 'Test Agent',
      voiceId: 'jbJMQWv1eS4YjQ6PCcn6', // Gülsu voice from our available voices
      conversationConfig: {
        agent: {
          prompt: 'You are a helpful assistant.',
          firstMessage: 'Hello! How can I help you?',
          language: 'tr'  // Turkish for Gülsu voice
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

testAgentCreation();
