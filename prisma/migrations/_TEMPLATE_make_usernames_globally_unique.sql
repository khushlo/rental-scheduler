-- Migration: Make usernames globally unique
-- This migration removes the composite unique constraint on (username, tenantId)
-- and adds a simple unique constraint on username only
-- 
-- WARNING: This will fail if there are duplicate usernames across tenants
-- You should first check and resolve any conflicts before running this migration
--
-- To check for conflicts, run:
-- SELECT username, COUNT(*) as count FROM user_logins GROUP BY username HAVING COUNT(*) > 1;

-- Step 1: Drop the existing composite unique constraint
DROP INDEX IF EXISTS user_logins_username_tenantId_key;

-- Step 2: Add a unique constraint on username only
ALTER TABLE user_logins ADD CONSTRAINT user_logins_username_unique UNIQUE (username);

-- Alternative approach if you want to keep both constraints:
-- This would ensure usernames are unique globally but still maintain the relationship
-- 
-- Step 1: Add unique constraint on username only
-- ALTER TABLE user_logins ADD CONSTRAINT user_logins_username_unique UNIQUE (username);
-- 
-- Step 2: Keep the existing composite constraint (optional)
-- The composite constraint would then be redundant but might be useful for certain queries