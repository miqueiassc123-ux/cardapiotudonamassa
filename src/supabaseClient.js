import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qvzyemoyhqslwcnqcvug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2enllbW95aHFzbHdjbnFjdnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzUzMTMsImV4cCI6MjA5NjE1MTMxM30.GUFxVpmaZHYfoXRFyKnskrfHZJRpqOCMt4rdjWFuvIM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);