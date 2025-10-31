import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqcytzkaiiezkdhrqwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3l0emthaWllemtkaHJxd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODE1OTQsImV4cCI6MjA3NzQ1NzU5NH0.w_INRiQlefoDKZplzPHR62lJltEShEswRLrJbw70R3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;

    console.log('✅ Database connection successful!');
    console.log('Data received:', data);

    // Test users table
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(5);
    if (usersError) throw usersError;

    console.log('✅ Users table accessible');
    console.log('Sample users:', users);

    // Test properties table
    const { data: properties, error: propertiesError } = await supabase.from('properties').select('*').limit(5);
    if (propertiesError) throw propertiesError;

    console.log('✅ Properties table accessible');
    console.log('Sample properties:', properties);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();