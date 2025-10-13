-- Script to create test customer accounts
-- Run this via Supabase SQL Editor or via service role key

-- Create 10 test customers using admin API
-- Note: This needs to be run with service role key via edge function or backend

-- For now, we'll create sample orders using existing admin users as "customers"
-- In production, real customers would sign up via the mobile app

SELECT 'Run the edge function to create real customer accounts' as note;
