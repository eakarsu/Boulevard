import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

async function main() {
  const email=String(process.env.PROVISION_ADMIN_EMAIL||process.env.ADMIN_EMAIL||'').trim().toLowerCase()
  const password=String(process.env.PROVISION_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD||'')
  if(!email||password.length<12)throw new Error('Runtime administrator credentials are required')
  const client=await pool.connect()
  try{
    await client.query('BEGIN')
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS users(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email VARCHAR(255) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,phone VARCHAR(20),role VARCHAR(20) NOT NULL DEFAULT 'client',
        avatar_url VARCHAR(500),is_active BOOLEAN NOT NULL DEFAULT TRUE,email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS businesses(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name VARCHAR(255) NOT NULL,description TEXT,logo_url VARCHAR(500),website VARCHAR(255),
        phone VARCHAR(20) NOT NULL,email VARCHAR(255) NOT NULL,owner_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS staff(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),business_id UUID NOT NULL REFERENCES businesses(id),user_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL DEFAULT 'Owner',skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],commission_rate DECIMAL(5,2) DEFAULT 0,
        hourly_rate DECIMAL(10,2),is_active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(business_id,user_id)
      );
      CREATE TABLE IF NOT EXISTS services(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),business_id UUID NOT NULL REFERENCES businesses(id),name VARCHAR(255) NOT NULL,
        description TEXT,category VARCHAR(100),duration_minutes INTEGER NOT NULL,price DECIMAL(10,2) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_results(
        id BIGSERIAL PRIMARY KEY,user_id TEXT,business_id TEXT,endpoint VARCHAR(100) NOT NULL,request_params JSONB,
        result_text TEXT NOT NULL,model_used VARCHAR(100) NOT NULL,tokens_used INTEGER,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ai_results_business_idx ON ai_results(business_id,created_at DESC);
    `)
    const hash=await bcrypt.hash(password,12)
    const user=(await client.query(`INSERT INTO users(email,password_hash,first_name,last_name,role,is_active,email_verified) VALUES($1,$2,'Runtime','Administrator','owner',TRUE,TRUE)
      ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='owner',is_active=TRUE,email_verified=TRUE,updated_at=NOW() RETURNING id`,[email,hash])).rows[0]
    await client.query(`INSERT INTO businesses(name,phone,email,owner_id) SELECT 'Runtime Boulevard','+1 555 0100',$1,$2 WHERE NOT EXISTS(SELECT 1 FROM businesses WHERE owner_id=$2)`,[email,user.id])
    await client.query('COMMIT')
    console.log('Runtime schema and administrator reconciled.')
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>pool.end())
