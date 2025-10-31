const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Konfigurasi Supabase
const supabaseUrl = 'https://dqcytzkaiiezkdhrqwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3l0emthaWllemtkaHJxd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODE1OTQsImV4cCI6MjA3NzQ1NzU5NH0.w_INRiQlefoDKZplzPHR62lJltEShEswRLrJbw70R3A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Baca data dari db.json
const data = JSON.parse(fs.readFileSync('./backend/db.json', 'utf8'));

async function migrateData() {
  try {
    console.log('Memulai migrasi data ke Supabase...');

    // Migrasi users
    console.log('Migrasi users...');
    for (const user of data.users) {
      const { error } = await supabase.from('users').insert(user);
      if (error) console.error('Error inserting user:', error);
      else console.log(`User ${user.nama} berhasil dimigrasi`);
    }

    // Migrasi properties
    console.log('Migrasi properties...');
    for (const property of data.properties) {
      const { error } = await supabase.from('properties').insert(property);
      if (error) console.error('Error inserting property:', error);
      else console.log(`Property ${property.namaProperti} berhasil dimigrasi`);
    }

    // Migrasi notifications
    console.log('Migrasi notifications...');
    for (const notification of data.notifications) {
      const { error } = await supabase.from('notifications').insert(notification);
      if (error) console.error('Error inserting notification:', error);
      else console.log(`Notification untuk user ${notification.userId} berhasil dimigrasi`);
    }

    console.log('Migrasi selesai!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateData();