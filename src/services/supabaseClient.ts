import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bmcmbieouvqnabnhfqpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtY21iaWVvdXZxbmFibmhmcXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTA5MzMsImV4cCI6MjA5NTAyNjkzM30.k_H_ZjlnO8-7OT2mGTTI1jIpf0FreB87JTiHyOK6mRc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
