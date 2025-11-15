"""
Import seed data to existing Supabase schema
Maps our seed data to the existing table structure
"""

import json
import random
from datetime import datetime, timedelta

# Existing chapters schema:
# id, name, type, parent_chapter_id, state, city, region, member_count,
# active_events_count, revenue_share, website_url, contact_email, phone,
# president, established, description, meeting_schedule, settings, social_media

# Existing members schema:
# id, email, first_name, last_name, member_type, status, chapter_id,
# joined_date, expiry_date, renewal_reminder_sent, grace_period_end_date,
# phone, company, job_title, engagement_score, last_login_date, avatar_url,
# address, designations, preferences, custom_fields

CHAPTERS_DATA = [
    {
        'id': '10000000-0000-0000-0000-000000000001',
        'name': 'NABIP National Headquarters',
        'type': 'national',
        'parent_chapter_id': None,
        'state': 'DC',
        'city': 'Washington',
        'region': 'National',
        'member_count': 15000,
        'website_url': 'https://www.nabip.org',
        'contact_email': 'info@nabip.org',
        'president': 'Janet Trautwein',
        'description': 'National headquarters - coordinating all state and local chapters'
    },
    # Add state chapters
    {'id': '10000000-0000-0001-0000-000000000001', 'name': 'NABIP California', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'CA', 'region': 'West Coast', 'member_count': 1245},
    {'id': '10000000-0000-0001-0000-000000000002', 'name': 'NABIP Texas', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'TX', 'region': 'South Central', 'member_count': 1125},
    {'id': '10000000-0000-0001-0000-000000000003', 'name': 'NABIP Florida', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'FL', 'region': 'Southeast', 'member_count': 890},
    {'id': '10000000-0000-0001-0000-000000000004', 'name': 'NABIP New York', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'NY', 'region': 'Mid-Atlantic', 'member_count': 625},
    {'id': '10000000-0000-0001-0000-000000000005', 'name': 'NABIP Illinois', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'IL', 'region': 'Midwest', 'member_count': 520},
    {'id': '10000000-0000-0001-0000-000000000006', 'name': 'NABIP Pennsylvania', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'PA', 'region': 'Mid-Atlantic', 'member_count': 520},
    {'id': '10000000-0000-0001-0000-000000000007', 'name': 'NABIP Ohio', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'OH', 'region': 'Midwest', 'member_count': 475},
    {'id': '10000000-0000-0001-0000-000000000008', 'name': 'NABIP Georgia', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'GA', 'region': 'Southeast', 'member_count': 450},
    {'id': '10000000-0000-0001-0000-000000000009', 'name': 'NABIP North Carolina', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'NC', 'region': 'Southeast', 'member_count': 425},
    {'id': '10000000-0000-0001-0000-000000000010', 'name': 'NABIP New Jersey', 'type': 'state', 'parent_chapter_id': '10000000-0000-0000-0000-000000000001', 'state': 'NJ', 'region': 'Mid-Atlantic', 'member_count': 410},
]

def generate_chapter_insert():
    """Generate INSERT statement for chapters"""
    sql = "INSERT INTO chapters (id, name, type, parent_chapter_id, state, city, region, member_count, website_url, contact_email, president, description) VALUES\n"

    values = []
    for chapter in CHAPTERS_DATA:
        parent_id = f"'{chapter['parent_chapter_id']}'" if chapter.get('parent_chapter_id') else 'NULL'
        city = f"'{chapter.get('city', '')}'" if chapter.get('city') else 'NULL'
        website = f"'{chapter.get('website_url', '')}'" if chapter.get('website_url') else 'NULL'
        email = f"'{chapter.get('contact_email', '')}'" if chapter.get('contact_email') else 'NULL'
        president = f"'{chapter.get('president', '')}'" if chapter.get('president') else 'NULL'
        description = f"'{chapter.get('description', '')}'" if chapter.get('description') else 'NULL'

        value = f"('{chapter['id']}', '{chapter['name']}', '{chapter['type']}', {parent_id}, '{chapter['state']}', {city}, '{chapter['region']}', {chapter['member_count']}, {website}, {email}, {president}, {description})"
        values.append(value)

    sql += ',\n'.join(values) + ';\n'
    return sql

def main():
    import os
    print('Generating SQL for existing Supabase schema...')

    # Generate chapters SQL
    chapters_sql = generate_chapter_insert()

    # Save to file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_file = os.path.join(base_dir, 'supabase', 'migrations', 'import_chapters_existing_schema.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(chapters_sql)

    print(f'[OK] Generated: {output_file}')
    print(f'[OK] {len(CHAPTERS_DATA)} chapters ready to import')
    print()
    print('Next: Use Supabase MCP execute_sql to run this file')

if __name__ == '__main__':
    main()
