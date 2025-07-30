import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function addVoiceAgentColumns() {
  console.log('Adding new columns to voice_agents table...');
  
  try {
    // Add new columns for enhanced ElevenLabs sync
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS first_message text`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS temperature integer DEFAULT 70`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 512`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS model_id varchar(50) DEFAULT 'eleven_multilingual_v2'`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS voice_settings text`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS response_format varchar(50) DEFAULT 'mp3'`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS enable_ssml_parsing boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS optimize_streaming boolean DEFAULT true`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS stability integer DEFAULT 50`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS similarity_boost integer DEFAULT 50`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS style integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE voice_agents ADD COLUMN IF NOT EXISTS use_speaker_boost boolean DEFAULT true`);
    
    console.log('✅ Successfully added new columns to voice_agents table');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addVoiceAgentColumns().then(() => {
  console.log('🎉 Migration completed successfully');
  process.exit(0);
});
