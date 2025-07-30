const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function testConversations() {
  const client = new ElevenLabsClient({
    apiKey: 'sk_9045c396dacd8b9ef18c45f61ae2536e4473184258e00e7b'
  });

  try {
    console.log('Testing ElevenLabs conversations API...');
    
    // Test: List conversations
    console.log('\nListing conversations...');
    const conversations = await client.conversationalAi.conversations.list({
      pageSize: 10
    });
    
    console.log('Conversations result:', JSON.stringify(conversations, null, 2));
    
    if (conversations.conversations && conversations.conversations.length > 0) {
      const firstConv = conversations.conversations[0];
      console.log('\nFirst conversation details:');
      console.log('ID:', firstConv.conversationId);
      console.log('Available fields:', Object.keys(firstConv));
      
      // Test: Get conversation details
      console.log('\nGetting conversation details...');
      try {
        const details = await client.conversationalAi.conversations.get(firstConv.conversationId);
        console.log('Details result:', JSON.stringify(details, null, 2));
      } catch (detailError) {
        console.error('Error getting details:', detailError);
      }
    } else {
      console.log('No conversations found');
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

testConversations();
