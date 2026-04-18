import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npaddbkovfvrtwiubucv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWRkYmtvdmZ2cnR3aXVidWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzYxNjQsImV4cCI6MjA5MjAxMjE2NH0.rqmw23hoOtkpNoZ_D2ZcuxYqJ0ZNrras3JD62Z3UPBg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase Connection...");
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error("SUPABASE ERROR:", error.message);
  } else {
    console.log("SUPABASE SUCCESS! Found projects:", data.length);
  }
}

test();
