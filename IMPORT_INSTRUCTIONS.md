# Supabase Data Import Instructions

## Current Status

✅ **Schema**: roles table created with 4 roles
✅ **Chapters**: 11 chapters imported successfully
⏳ **Members**: 1000 member records ready in 10 batch files

## What's In Supabase Now

```
- roles: 4 records (Member, Chapter Admin, State Admin, National Admin)
- chapters: 11 records (1 national + 10 state chapters)
- members: 0 records (ready to import)
```

## Member Batch Files Ready

Located in: `supabase/migrations/member_batches/`

- `members_batch_001.sql` through `members_batch_010.sql`
- Each batch contains 100 member records
- Total: 1000 members

## Schema Mapping

The generated data matches your existing Supabase schema:

**Chapters Table:**
```
id, name, type, parent_chapter_id, state, city, region,
member_count, website_url, contact_email, president, description
```

**Members Table:**
```
id, email, first_name, last_name, member_type, status, chapter_id,
joined_date, expiry_date, renewal_reminder_sent, phone, company,
job_title, engagement_score, address
```

## Import Options

### Option 1: Using Supabase MCP (via Claude Code)

I can import all 10 batches automatically using the Supabase MCP tools. Just say:
- "Import all member batches"
- "Continue importing members"

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy content from each batch file
5. Run the SQL
6. Repeat for all 10 batches

### Option 3: Using Supabase CLI

```bash
# If you have Supabase CLI configured
cd supabase/migrations/member_batches
for file in members_batch_*.sql; do
  psql $DATABASE_URL < "$file"
done
```

## Next Steps After Import

1. **Verify counts**: Check that all 1000 members imported
2. **Generate more members**: The script can generate up to 20,000 members
3. **Add more chapters**: Can add remaining 40 state chapters + local chapters
4. **Add events, courses, campaigns**: Additional seed data

## Verification Queries

After import, run these in Supabase SQL Editor:

```sql
-- Check counts
SELECT
  (SELECT COUNT(*) FROM chapters) as chapter_count,
  (SELECT COUNT(*) FROM members) as member_count,
  (SELECT COUNT(*) FROM roles) as role_count;

-- Check member distribution by chapter
SELECT c.name, COUNT(m.id) as member_count
FROM chapters c
LEFT JOIN members m ON m.chapter_id = c.id
GROUP BY c.id, c.name
ORDER BY member_count DESC;

-- Check member status distribution
SELECT status, COUNT(*) as count
FROM members
GROUP BY status
ORDER BY count DESC;
```

## Scaling Up

To generate more members (e.g., 20,000):

```bash
cd scripts
python generate_members_for_existing_schema.py
```

Edit the script and change:
```python
sql_batches, members = generate_members_sql(count=20000, batch_size=100)
```

This will create 200 batch files (20,000 members / 100 per batch).
