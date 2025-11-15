"""
Import all member batch files to Supabase using MCP
"""

import os
import glob

def main():
    print('=' * 60)
    print('NABIP AMS - Import Member Batches to Supabase')
    print('=' * 60)
    print()

    # Get batch directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    batch_dir = os.path.join(base_dir, 'supabase', 'migrations', 'member_batches')

    # Find all batch files
    batch_files = sorted(glob.glob(os.path.join(batch_dir, 'members_batch_*.sql')))

    print(f'Found {len(batch_files)} batch files to import')
    print()

    imported_count = 0
    failed_count = 0

    for i, batch_file in enumerate(batch_files, 1):
        filename = os.path.basename(batch_file)
        print(f'[{i}/{len(batch_files)}] Processing {filename}...')

        # Read SQL from file
        with open(batch_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        print(f'    SQL size: {len(sql)} characters, {len(sql.splitlines())} lines')
        print(f'    Ready for manual import via Supabase MCP')
        print()
        imported_count += 1

    print('=' * 60)
    print(f'Summary:')
    print(f'  Total batches: {len(batch_files)}')
    print(f'  Ready for import: {imported_count}')
    print()
    print('Next: Use Supabase MCP execute_sql to import each batch')
    print('      Or use Supabase Dashboard SQL Editor')

if __name__ == '__main__':
    main()
