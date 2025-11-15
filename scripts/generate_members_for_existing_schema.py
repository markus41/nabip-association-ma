"""
Generate member seed data matching existing Supabase schema
Simplified version - generates 1000 members initially for testing
"""

import uuid
import random
import json
from datetime import datetime, timedelta

# Existing members schema:
# id, email, first_name, last_name, member_type, status, chapter_id,
# joined_date, expiry_date, renewal_reminder_sent, grace_period_end_date,
# phone, company, job_title, engagement_score, last_login_date, avatar_url,
# address, designations, preferences, custom_fields

FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
               'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
               'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra']

LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
              'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen']

JOB_TITLES = ['Insurance Broker', 'Benefits Consultant', 'Account Executive', 'Sales Representative', 'Agency Owner',
              'Senior Consultant', 'Account Manager', 'Benefits Advisor', 'Insurance Agent', 'Managing Partner']

COMPANY_TYPES = ['Insurance Agency', 'Benefits Group', 'Consulting', 'Insurance Services', 'Benefits Solutions',
                 'Insurance Brokers', 'Financial Services', 'Risk Management', 'Employee Benefits']

MEMBER_TYPES = ['individual', 'organizational', 'student', 'lifetime']
STATUSES = ['active', 'pending', 'expired', 'suspended', 'grace_period']

CHAPTER_IDS = [
    '10000000-0000-0000-0000-000000000001',  # National
    '10000000-0000-0001-0000-000000000001',  # California
    '10000000-0000-0001-0000-000000000002',  # Texas
    '10000000-0000-0001-0000-000000000003',  # Florida
    '10000000-0000-0001-0000-000000000004',  # New York
    '10000000-0000-0001-0000-000000000005',  # Illinois
    '10000000-0000-0001-0000-000000000006',  # Pennsylvania
    '10000000-0000-0001-0000-000000000007',  # Ohio
    '10000000-0000-0001-0000-000000000008',  # Georgia
    '10000000-0000-0001-0000-000000000009',  # North Carolina
    '10000000-0000-0001-0000-000000000010',  # New Jersey
]

def generate_member(index, existing_emails):
    """Generate a single member record"""
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)

    # Generate unique email
    email = f"{first_name.lower()}.{last_name.lower()}{index}@example.com"
    while email in existing_emails:
        email = f"{first_name.lower()}.{last_name.lower()}{index}_{random.randint(1,999)}@example.com"
    existing_emails.add(email)

    # Random dates
    days_member = random.randint(30, 3650)  # 1 month to 10 years
    joined_date = datetime.now() - timedelta(days=days_member)
    expiry_date = datetime.now() + timedelta(days=random.randint(30, 365))

    # Status distribution: 85% active, 8% pending, 4% expired, 2% grace_period, 1% suspended
    status_roll = random.random()
    if status_roll < 0.85:
        status = 'active'
    elif status_roll < 0.93:
        status = 'pending'
    elif status_roll < 0.97:
        status = 'expired'
    elif status_roll < 0.99:
        status = 'grace_period'
    else:
        status = 'suspended'

    member = {
        'id': str(uuid.uuid4()),
        'email': email,
        'first_name': first_name,
        'last_name': last_name,
        'member_type': random.choice(MEMBER_TYPES),
        'status': status,
        'chapter_id': random.choice(CHAPTER_IDS),
        'joined_date': joined_date.isoformat(),
        'expiry_date': expiry_date.isoformat(),
        'renewal_reminder_sent': random.choice([True, False]),
        'phone': f"+1{random.randint(2000000000, 9999999999)}",
        'company': f"{last_name} {random.choice(COMPANY_TYPES)}",
        'job_title': random.choice(JOB_TITLES),
        'engagement_score': random.randint(0, 100),
        'address': json.dumps({
            'street': f"{random.randint(100, 9999)} Main St",
            'city': 'Springfield',
            'state': 'IL',
            'zip': f"{random.randint(10000, 99999)}"
        })
    }

    return member

def generate_members_sql(count=1000, batch_size=100):
    """Generate INSERT statements for members"""
    print(f'Generating {count} member records...')

    existing_emails = set()
    all_members = []

    for i in range(count):
        member = generate_member(i, existing_emails)
        all_members.append(member)

        if (i + 1) % 100 == 0:
            print(f'  Generated {i + 1} members...')

    print(f'[OK] Generated {count} members')
    print()

    # Generate SQL in batches
    sql_batches = []
    for batch_num in range(0, len(all_members), batch_size):
        batch = all_members[batch_num:batch_num + batch_size]

        sql = "INSERT INTO members (id, email, first_name, last_name, member_type, status, chapter_id, joined_date, expiry_date, renewal_reminder_sent, phone, company, job_title, engagement_score, address) VALUES\n"

        values = []
        for member in batch:
            value = f"('{member['id']}', '{member['email']}', '{member['first_name']}', '{member['last_name']}', '{member['member_type']}', '{member['status']}', '{member['chapter_id']}', '{member['joined_date']}', '{member['expiry_date']}', {str(member['renewal_reminder_sent']).lower()}, '{member['phone']}', '{member['company']}', '{member['job_title']}', {member['engagement_score']}, '{member['address']}')"
            values.append(value)

        sql += ',\n'.join(values) + ';\n'
        sql_batches.append(sql)

    return sql_batches, all_members

def main():
    import os

    print('=' * 60)
    print('NABIP AMS - Member Seed Data Generator')
    print('Generating for existing Supabase schema')
    print('=' * 60)
    print()

    # Generate 1000 members for testing (can increase later)
    sql_batches, members = generate_members_sql(count=1000, batch_size=100)

    # Save batches
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    batch_dir = os.path.join(base_dir, 'supabase', 'migrations', 'member_batches')
    os.makedirs(batch_dir, exist_ok=True)

    print(f'Saving {len(sql_batches)} batch files...')
    for i, batch_sql in enumerate(sql_batches):
        batch_file = os.path.join(batch_dir, f'members_batch_{i+1:03d}.sql')
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write(batch_sql)

    print(f'[OK] Saved to: {batch_dir}')
    print()
    print('[SUCCESS] Member seed data ready!')
    print(f'   Total members: {len(members)}')
    print(f'   Batch files: {len(sql_batches)}')
    print(f'   Records per batch: 100')
    print()
    print('Next: Use Supabase MCP execute_sql to import each batch')

if __name__ == '__main__':
    main()
