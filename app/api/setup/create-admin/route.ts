import { NextResponse, NextRequest } from 'next/server';
import { Client } from 'pg';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { databaseUrl, email, password, name } = await request.json();
    
    if (!databaseUrl || !email || !password || !name) {
      return NextResponse.json({ 
        error: 'Database URL, email, password, and name are required' 
      }, { status: 400 });
    }
    
    const client = new Client({ connectionString: databaseUrl });
    
    try {
      await client.connect();
      
      // Hash the password
      const hashedPassword = await hash(password, 12);
      
      // Create admin user
      const insertUserQuery = `
        INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
        VALUES ($1, $2, $3, 'admin', NOW(), NOW())
        ON CONFLICT (email) 
        DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = 'admin',
          updated_at = NOW()
        RETURNING id, email, name, role
      `;
      
      const result = await client.query(insertUserQuery, [email, hashedPassword, name]);
      const user = result.rows[0];
      
      await client.end();
      
      return NextResponse.json({ 
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (dbError: any) {
      await client.end();
      console.error('Admin user creation error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to create admin user',
        details: dbError?.message || 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
