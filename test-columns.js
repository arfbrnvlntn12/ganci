import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  'https://npaddbkovfvrtwiubucv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWRkYmtvdmZ2cnR3aXVidWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzYxNjQsImV4cCI6MjA5MjAxMjE2NH0.rqmw23hoOtkpNoZ_D2ZcuxYqJ0ZNrras3JD62Z3UPBg'
);

async function check() {
  const { data: projects } = await supabase.from('projects').select('*').limit(1);
  const projId = projects[0].id;
  console.log("Using project ID:", projId);

  const testId = randomUUID();
  const { data, error } = await supabase.from('keychain_items').insert([{
    id: testId,
    project_id: projId
  }]).select();
  
  if (error) {
    console.log("Insert error:", error.message);
  } else {
    console.log("SUCCESS! All columns in keychain_items table:");
    const cols = Object.keys(data[0]);
    cols.forEach(c => console.log(`  - ${c}: ${JSON.stringify(data[0][c])}`));
    await supabase.from('keychain_items').delete().eq('id', testId);
    console.log("Test row cleaned up.");
  }
}

check();
