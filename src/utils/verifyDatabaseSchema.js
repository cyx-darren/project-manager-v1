// Database Schema Verification Utility
// This script can be run to verify that the database schema was set up correctly
// Use this after executing the database-setup.sql script in Supabase Dashboard

import { createClient } from '@supabase/supabase-js'

// Read environment variables directly for Node.js
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qdazqudzhzuqocsnwtry.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYXpxdWR6aHp1cW9jc253dHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDQxODAsImV4cCI6MjA2NTg4MDE4MH0.1Udg81xFu_8udmn0fm7NBgrcUEUkdjISEAqCKaM13K8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Verify that all required database tables and types exist
 */
async function verifyDatabaseSchema() {
  console.log('🔍 Verifying database schema...')
  
  const results = {
    tables: {},
    connection: false,
    overall: false
  }

  try {
    // Test basic connection and tables
    console.log('\n📋 Testing database tables...')
    
    const tablesToTest = ['projects', 'project_members', 'tasks']
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)
        
        if (error) {
          results.tables[tableName] = false
          console.log(`  ❌ ${tableName}: ${error.message}`)
        } else {
          results.tables[tableName] = true
          console.log(`  ✅ ${tableName}: Table accessible`)
        }
      } catch (err) {
        results.tables[tableName] = false
        console.log(`  ❌ ${tableName}: ${err.message}`)
      }
    }

    // Test overall connection
    console.log('\n🔗 Testing Supabase connection...')
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('count', { count: 'exact' })
        .limit(0)

      if (error) {
        console.log(`  ❌ Connection failed: ${error.message}`)
        results.connection = false
      } else {
        console.log(`  ✅ Connection successful`)
        results.connection = true
      }
    } catch (err) {
      console.log(`  ❌ Connection error: ${err.message}`)
      results.connection = false
    }

    // Calculate overall status
    const tableCount = Object.values(results.tables).filter(Boolean).length
    results.overall = tableCount === 3 && results.connection

    // Summary
    console.log('\n📊 VERIFICATION SUMMARY:')
    console.log('='.repeat(40))
    console.log(`Tables accessible: ${tableCount}/3`)
    console.log(`Connection status: ${results.connection ? 'SUCCESS' : 'FAILED'}`)
    
    if (results.overall) {
      console.log('\n🎉 DATABASE SCHEMA VERIFICATION: PASSED ✅')
      console.log('Your Supabase database is properly set up and ready for development!')
    } else {
      console.log('\n⚠️  DATABASE SCHEMA VERIFICATION: FAILED ❌')
      console.log('Some components are missing or inaccessible.')
      
      const missingTables = Object.entries(results.tables)
        .filter(([, exists]) => !exists)
        .map(([name]) => name)
      
      if (missingTables.length > 0) {
        console.log(`Missing tables: ${missingTables.join(', ')}`)
      }
    }

    return results

  } catch (error) {
    console.error('\n💥 Verification failed with error:', error.message)
    results.overall = false
    return results
  }
}

// Run verification
verifyDatabaseSchema()
  .then(results => {
    process.exit(results.overall ? 0 : 1)
  })
  .catch(error => {
    console.error('Script failed:', error.message)
    process.exit(1)
  }) 