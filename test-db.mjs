import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aigtxqdeasdjeeeasgue.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3R4cWRlYXNkamVlZWFzZ3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMjksImV4cCI6MjA3MDgyNTIyOX0.2A7bqrbSk9YjVmbSp3BachN48AvYPVoIH98Jdw4vozs'
);

const { data, error } = await supabase.from('orders').select('id, status').limit(5);

if (error) {
  console.log('Error:', error.message);
  console.log('Details:', error);
} else {
  console.log('Orders found:', data?.length || 0);
  console.log(JSON.stringify(data, null, 2));
}
