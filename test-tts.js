const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function testTextToSpeech() {
  const client = new ElevenLabsClient({
    apiKey: 'sk_6830e93e3bfc772c19ccd171b8e2b83528a7399a6484d001'
  });

  try {
    console.log('Testing ElevenLabs Text-to-Speech...');
    
    // Test with Gülsu voice
    console.log('\nTrying text-to-speech with Gülsu voice...');
    const audio = await client.textToSpeech.convert('jbJMQWv1eS4YjQ6PCcn6', {
      text: 'Merhaba! Ben Gülsu. Size nasıl yardımcı olabilirim?',
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
    });
    
    console.log('Text-to-speech successful! Audio stream received.');
    
    // Read a few chunks to verify
    const reader = audio.getReader();
    let chunkCount = 0;
    let totalSize = 0;
    
    while (chunkCount < 5) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        totalSize += value.length;
        chunkCount++;
      }
    }
    
    console.log(`Received ${chunkCount} chunks, total size: ${totalSize} bytes`);
    
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

testTextToSpeech();
