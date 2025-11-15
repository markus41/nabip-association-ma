"""
Direct import script for Supabase seed data
Imports chapters and members to Supabase database
"""

import os
import sys
import re

def read_sql_file(filepath):
    """Read SQL file and extract INSERT statements"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove comments and clean up
    content = re.sub(r'--.*$', '', content, flags=re.MULTILINE)
    content = content.replace('BEGIN;', '').replace('COMMIT;', '').strip()

    return content

def split_into_batches(sql_content, batch_size=50):
    """Split large INSERT statements into smaller batches"""
    # Find all INSERT INTO statements
    inserts = re.findall(r'(INSERT INTO \w+.*?VALUES.*?);', sql_content, re.DOTALL)

    batches = []
    for insert in inserts:
        # Split the VALUES part
        match = re.match(r'(INSERT INTO \w+\s*\([^)]+\)\s*VALUES)\s*(.*)', insert, re.DOTALL)
        if match:
            header = match.group(1)
            values_part = match.group(2)

            # Split individual value sets
            value_sets = re.findall(r'\([^)]+\)', values_part)

            # Create batches
            for i in range(0, len(value_sets), batch_size):
                batch = value_sets[i:i+batch_size]
                batch_sql = header + '\n' + ',\n'.join(batch) + ';'
                batches.append(batch_sql)
        else:
            # Single insert, add as is
            batches.append(insert + ';')

    return batches

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # File paths
    chapters_file = os.path.join(base_dir, 'supabase', 'migrations', '20250115_seed_data_insert.sql')
    members_file = os.path.join(base_dir, 'supabase', 'migrations', '20250115_seed_members.sql')

    print('=' * 60)
    print('NABIP AMS - Supabase Data Import Script')
    print('=' * 60)
    print()

    # Read files
    print('[1/4] Reading chapter seed data...')
    chapters_sql = read_sql_file(chapters_file)
    print(f'      Loaded {len(chapters_sql)} characters of chapter SQL')

    print('[2/4] Reading member seed data...')
    members_sql = read_sql_file(members_file)
    print(f'      Loaded {len(members_sql)} characters of member SQL')

    # Split into batches
    print()
    print('[3/4] Splitting into import batches...')
    chapter_batches = split_into_batches(chapters_sql, batch_size=10)
    member_batches = split_into_batches(members_sql, batch_size=100)

    print(f'      Chapter batches: {len(chapter_batches)}')
    print(f'      Member batches: {len(member_batches)}')

    # Save batches to files
    print()
    print('[4/4] Saving batch files...')

    batch_dir = os.path.join(base_dir, 'supabase', 'migrations', 'batches')
    os.makedirs(batch_dir, exist_ok=True)

    # Save chapter batches
    for i, batch in enumerate(chapter_batches):
        batch_file = os.path.join(batch_dir, f'chapters_batch_{i+1:03d}.sql')
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write(batch)

    # Save member batches
    for i, batch in enumerate(member_batches):
        batch_file = os.path.join(batch_dir, f'members_batch_{i+1:03d}.sql')
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write(batch)

    print(f'      Saved to: {batch_dir}')
    print()
    print('[SUCCESS] Batch files created successfully!')
    print()
    print('Next steps:')
    print('1. Use Supabase MCP tools to import batches')
    print('2. Or use Supabase SQL Editor to run batch files')
    print('3. Start with chapters, then members')

if __name__ == '__main__':
    main()
