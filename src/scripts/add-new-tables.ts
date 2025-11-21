import { db } from '@/db';

async function addNewTables() {
  console.log('🔄 Adding new tables to database...\n');

  try {
    // 1. Writer Tiers table
    console.log('📋 Creating writer_tiers table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS writer_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        min_rating REAL NOT NULL,
        min_jobs INTEGER NOT NULL,
        min_success_rate REAL NOT NULL,
        benefits TEXT,
        color TEXT,
        icon TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✅ writer_tiers table created\n');

    // 2. Conversations table
    console.log('📋 Creating conversations table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER REFERENCES jobs(id),
        participant1_id INTEGER NOT NULL REFERENCES users(id),
        participant2_id INTEGER NOT NULL REFERENCES users(id),
        last_message_at TEXT,
        last_message_sender_id INTEGER REFERENCES users(id),
        last_message_preview TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✅ conversations table created\n');

    // 3. Freelancer Profiles table
    console.log('📋 Creating freelancer_profiles table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS freelancer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        bio TEXT,
        skills TEXT,
        certifications TEXT,
        portfolio TEXT,
        hourly_rate REAL,
        languages TEXT,
        timezone TEXT,
        availability TEXT DEFAULT 'part-time',
        response_time INTEGER,
        total_clients INTEGER DEFAULT 0,
        repeat_client_rate REAL DEFAULT 0,
        jobs_completed INTEGER DEFAULT 0,
        is_profile_complete INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✅ freelancer_profiles table created\n');

    // 4. Client Profiles table
    console.log('📋 Creating client_profiles table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS client_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        company_name TEXT,
        industry TEXT,
        website TEXT,
        tax_id TEXT,
        business_registration TEXT,
        billing_address TEXT,
        shipping_address TEXT,
        preferred_payment_method TEXT,
        automate_payments INTEGER DEFAULT 0,
        total_jobs_posted INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        recurring_client_discount REAL DEFAULT 0,
        is_profile_complete INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✅ client_profiles table created\n');

    // 5. Seed writer tiers
    console.log('📋 Seeding writer tiers...');
    const now = new Date().toISOString();
    
    const tiers = [
      { name: 'Beginner', minRating: 0, minJobs: 0, minSuccessRate: 0, color: '#9E9E9E', icon: '🌱' },
      { name: 'Intermediate', minRating: 4.0, minJobs: 10, minSuccessRate: 0.8, color: '#2196F3', icon: '📈' },
      { name: 'Advanced', minRating: 4.3, minJobs: 30, minSuccessRate: 0.85, color: '#4CAF50', icon: '🎯' },
      { name: 'Expert', minRating: 4.6, minJobs: 75, minSuccessRate: 0.9, color: '#FF9800', icon: '⚡' },
      { name: 'Master', minRating: 4.8, minJobs: 150, minSuccessRate: 0.95, color: '#FFD700', icon: '👑' }
    ];

    for (const tier of tiers) {
      await db.run(`
        INSERT OR IGNORE INTO writer_tiers (name, min_rating, min_jobs, min_success_rate, color, icon, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [tier.name, tier.minRating, tier.minJobs, tier.minSuccessRate, tier.color, tier.icon, now, now]);
    }
    console.log('✅ Writer tiers seeded\n');

    // 6. Create indexes
    console.log('📋 Creating indexes...');
    await db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id)`);
    console.log('✅ Indexes created\n');

    console.log('✅ ✅ ✅ All tables added successfully! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addNewTables()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
