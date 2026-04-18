import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npaddbkovfvrtwiubucv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWRkYmtvdmZ2cnR3aXVidWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzYxNjQsImV4cCI6MjA5MjAxMjE2NH0.rqmw23hoOtkpNoZ_D2ZcuxYqJ0ZNrras3JD62Z3UPBg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
