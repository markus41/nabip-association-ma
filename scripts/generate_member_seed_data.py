#!/usr/bin/env python3
"""
NABIP AMS - Member Seed Data Generator
Generates 20,000 realistic member records with proper distribution
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict

# Sample data pools
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa",
    "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
    "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra",
    "Alexander", "Rachel", "Patrick", "Carolyn", "Frank", "Janet", "Jack", "Catherine",
    "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane", "Aaron", "Ruth",
    "Jose", "Julie", "Adam", "Olivia", "Nathan", "Joyce", "Henry", "Virginia",
    "Douglas", "Victoria", "Zachary", "Kelly", "Peter", "Lauren", "Kyle", "Christina",
    "Noah", "Joan", "Ethan", "Evelyn", "Jeremy", "Judith", "Walter", "Megan",
    "Christian", "Andrea", "Keith", "Cheryl", "Roger", "Hannah", "Terry", "Jacqueline",
    "Austin", "Martha", "Sean", "Gloria", "Gerald", "Teresa", "Carl", "Ann",
    "Harold", "Sara", "Dylan", "Madison", "Arthur", "Frances", "Lawrence", "Kathryn",
    "Jordan", "Janice", "Jesse", "Jean", "Bryan", "Abigail", "Billy", "Alice"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
    "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
    "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
    "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham",
    "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant",
    "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray",
    "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "McDonald", "Woods",
    "Washington", "Kennedy", "Wells", "Vargas", "Henry", "Chen", "Freeman", "Webb",
    "Tucker", "Guzman", "Burns", "Crawford", "Olson", "Simpson", "Porter", "Hunter"
]

CITIES_BY_STATE = {
    "CA": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Fresno", "Oakland", "Riverside"],
    "TX": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi"],
    "FL": ["Miami", "Tampa", "Orlando", "Jacksonville", "St. Petersburg", "Fort Lauderdale", "Tallahassee", "Naples"],
    "NY": ["New York", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers", "New Rochelle", "White Plains"],
    "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster"],
    "IL": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Elgin", "Peoria"],
    "OH": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton"],
    "GA": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Macon", "Roswell", "Albany"],
    "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington"],
    "MI": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn"],
}

SPECIALTIES = [
    "Individual Health Insurance",
    "Group Health Insurance",
    "Medicare Advantage",
    "Medicare Supplements",
    "Small Group Benefits",
    "Large Group Benefits",
    "Employee Benefits Consulting",
    "COBRA Administration",
    "HSA/FSA Plans",
    "Dental Insurance",
    "Vision Insurance",
    "Life Insurance",
    "Disability Insurance",
    "Voluntary Benefits",
    "ACA Compliance",
    "HIPAA Compliance",
    "Benefits Technology",
    "Wellness Programs",
    "Retirement Planning",
    "Executive Benefits"
]

JOB_TITLES = [
    "Benefits Consultant",
    "Insurance Broker",
    "Employee Benefits Advisor",
    "Account Executive",
    "Senior Consultant",
    "Benefits Manager",
    "Agency Owner",
    "Principal",
    "Vice President",
    "Director of Benefits",
    "Benefits Specialist",
    "Account Manager",
    "Sales Executive",
    "Independent Broker",
    "Benefits Counselor"
]

COMPANY_TYPES = [
    "Insurance Agency",
    "Benefits Consulting Firm",
    "Independent Practice",
    "Brokerage House",
    "Employee Benefits Group",
    "Insurance Services",
    "Benefits Solutions",
    "Insurance Partners",
    "Consulting Group",
    "Advisory Services"
]


class MemberGenerator:
    def __init__(self, chapter_data: List[Dict]):
        self.chapters = chapter_data
        self.generated_emails = set()

    def generate_email(self, first_name: str, last_name: str, domain_num: int) -> str:
        """Generate unique email address"""
        domains = ["gmail.com", "yahoo.com", "outlook.com", "insurance.com", "benefits.com", "broker.com"]
        base = f"{first_name.lower()}.{last_name.lower()}"
        domain = domains[domain_num % len(domains)]

        email = f"{base}@{domain}"
        counter = 1
        while email in self.generated_emails:
            email = f"{base}{counter}@{domain}"
            counter += 1

        self.generated_emails.add(email)
        return email

    def generate_phone(self) -> str:
        """Generate realistic US phone number"""
        area_codes = [202, 212, 213, 214, 215, 216, 281, 303, 305, 312, 404, 415, 469, 470, 512, 602, 612, 702, 713, 718, 770, 972]
        area = random.choice(area_codes)
        exchange = random.randint(200, 999)
        number = random.randint(1000, 9999)
        return f"({area}) {exchange}-{number}"

    def generate_zip_code(self, state: str) -> str:
        """Generate realistic zip code for state"""
        zip_prefixes = {
            "CA": ["900", "901", "902", "903", "904", "905", "906", "907", "908"],
            "TX": ["750", "751", "752", "753", "754", "755", "756", "757", "758"],
            "FL": ["320", "321", "322", "323", "324", "325", "326", "327", "328"],
            "NY": ["100", "101", "102", "103", "104", "105", "106", "107", "108"],
            "PA": ["150", "151", "152", "153", "154", "155", "156", "157", "158"],
        }
        prefix = random.choice(zip_prefixes.get(state, ["900"]))
        suffix = f"{random.randint(0, 99):02d}"
        return f"{prefix}{suffix}"

    def generate_member_since_date(self) -> str:
        """Generate realistic member_since date"""
        years_ago = random.randint(0, 30)
        months_ago = random.randint(0, 11)
        date = datetime.now() - timedelta(days=years_ago*365 + months_ago*30)
        return date.strftime("%Y-%m-%d")

    def generate_renewal_date(self, member_since: str) -> str:
        """Generate renewal date (typically yearly)"""
        member_date = datetime.strptime(member_since, "%Y-%m-%d")
        renewal = member_date + timedelta(days=365)
        while renewal < datetime.now():
            renewal += timedelta(days=365)
        return renewal.strftime("%Y-%m-%d")

    def calculate_engagement_score(self) -> int:
        """Generate engagement score (0-100) with realistic distribution"""
        # 20% highly engaged (80-100)
        # 50% moderately engaged (50-79)
        # 30% low engagement (0-49)
        rand = random.random()
        if rand < 0.2:
            return random.randint(80, 100)
        elif rand < 0.7:
            return random.randint(50, 79)
        else:
            return random.randint(0, 49)

    def calculate_ce_credits(self, member_since: str) -> float:
        """Calculate CE credits based on tenure"""
        member_date = datetime.strptime(member_since, "%Y-%m-%d")
        years_member = (datetime.now() - member_date).days / 365
        # Average 12 CE credits per year, with variance
        avg_per_year = random.uniform(8, 18)
        total = round(years_member * avg_per_year, 2)
        return min(total, 150.0)  # Cap at 150

    def generate_members(self, total_count: int = 20000) -> List[Dict]:
        """Generate all member records"""
        members = []

        # Distribute members across chapters based on their actual_member_count
        total_chapter_capacity = sum(ch.get('actual_member_count', 0) for ch in self.chapters)

        print(f"Generating {total_count} members across {len(self.chapters)} chapters...")

        for i in range(total_count):
            # Select chapter based on weighted distribution
            chapter = random.choice(self.chapters)

            # Generate name
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            name = f"{first_name} {last_name}"

            # Generate location data
            state = chapter.get('state', 'CA')
            cities = CITIES_BY_STATE.get(state, ["City"])
            city = random.choice(cities)

            # Generate dates
            member_since = self.generate_member_since_date()
            renewal_date = self.generate_renewal_date(member_since)

            # Generate status (90% active, 5% lapsed, 3% inactive, 2% pending)
            status_rand = random.random()
            if status_rand < 0.90:
                status = "active"
            elif status_rand < 0.95:
                status = "lapsed"
            elif status_rand < 0.98:
                status = "inactive"
            else:
                status = "pending"

            # Generate company name
            company_type = random.choice(COMPANY_TYPES)
            company_name = f"{last_name} {company_type}"

            member = {
                "id": str(uuid.uuid4()),
                "email": self.generate_email(first_name, last_name, i),
                "name": name,
                "first_name": first_name,
                "last_name": last_name,
                "phone": self.generate_phone(),
                "address_line1": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Park', 'Washington', 'Lake'])} St",
                "address_line2": None if random.random() > 0.2 else f"Suite {random.randint(100, 999)}",
                "city": city,
                "state": state,
                "zip_code": self.generate_zip_code(state),
                "country": "USA",
                "chapter_id": chapter.get('id'),
                "status": status,
                "member_since": member_since,
                "renewal_date": renewal_date,
                "engagement_score": self.calculate_engagement_score(),
                "total_ce_credits": self.calculate_ce_credits(member_since),
                "specialties": random.sample(SPECIALTIES, k=random.randint(2, 5)),
                "company_name": company_name,
                "job_title": random.choice(JOB_TITLES),
                "bio": f"Experienced {random.choice(JOB_TITLES).lower()} specializing in {', '.join(random.sample(SPECIALTIES, k=2))}.",
                "created_at": member_since,
                "updated_at": datetime.now().isoformat()
            }

            members.append(member)

            if (i + 1) % 1000 == 0:
                print(f"  Generated {i + 1:,} members...")

        print(f"[OK] Successfully generated {len(members):,} members")
        return members

    def export_to_sql(self, members: List[Dict], output_file: str):
        """Export members to SQL INSERT statements"""
        print(f"\nExporting to SQL file: {output_file}")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- =====================================================\n")
            f.write("-- NABIP AMS - Member Seed Data (20,000 records)\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("-- =====================================================\n\n")
            f.write("BEGIN;\n\n")

            # Write in batches of 100 for better performance
            batch_size = 100
            for i in range(0, len(members), batch_size):
                batch = members[i:i+batch_size]

                f.write(f"-- Batch {i//batch_size + 1} ({i+1} to {min(i+batch_size, len(members))})\n")
                f.write("INSERT INTO members (\n")
                f.write("    id, email, name, first_name, last_name, phone, address_line1, address_line2,\n")
                f.write("    city, state, zip_code, country, chapter_id, status, member_since, renewal_date,\n")
                f.write("    engagement_score, total_ce_credits, specialties, company_name, job_title, bio, created_at\n")
                f.write(") VALUES\n")

                for j, member in enumerate(batch):
                    specialties_array = "{" + ",".join(f'"{s}"' for s in member['specialties']) + "}"
                    address_line2 = f"'{member['address_line2']}'" if member['address_line2'] else "NULL"

                    f.write(f"    (")
                    f.write(f"'{member['id']}', ")
                    f.write(f"'{member['email']}', ")
                    f.write(f"'{member['name']}', ")
                    f.write(f"'{member['first_name']}', ")
                    f.write(f"'{member['last_name']}', ")
                    f.write(f"'{member['phone']}', ")
                    f.write(f"'{member['address_line1']}', ")
                    f.write(f"{address_line2}, ")
                    f.write(f"'{member['city']}', ")
                    f.write(f"'{member['state']}', ")
                    f.write(f"'{member['zip_code']}', ")
                    f.write(f"'{member['country']}', ")
                    f.write(f"'{member['chapter_id']}', ")
                    f.write(f"'{member['status']}', ")
                    f.write(f"'{member['member_since']}', ")
                    f.write(f"'{member['renewal_date']}', ")
                    f.write(f"{member['engagement_score']}, ")
                    f.write(f"{member['total_ce_credits']}, ")
                    f.write(f"'{specialties_array}', ")
                    f.write(f"'{member['company_name']}', ")
                    f.write(f"'{member['job_title']}', ")
                    f.write(f"'{member['bio']}', ")
                    f.write(f"'{member['created_at']}'")
                    f.write(")")

                    if j < len(batch) - 1:
                        f.write(",\n")
                    else:
                        f.write(";\n\n")

            f.write("COMMIT;\n")

        print(f"[OK] SQL export complete: {output_file}")

    def export_to_json(self, members: List[Dict], output_file: str):
        """Export members to JSON for review"""
        print(f"\nExporting to JSON file: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(members, f, indent=2)
        print(f"[OK] JSON export complete: {output_file}")


def main():
    import os
    # Get the base directory (parent of scripts folder)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Sample chapter data (in production, load from chapters CSV/SQL)
    chapters = [
        {"id": "10000000-0000-0008-0000-000000000001", "name": "NABIP California", "state": "CA", "actual_member_count": 678},
        {"id": "10000000-0000-0005-0000-000000000001", "name": "NABIP Texas", "state": "TX", "actual_member_count": 412},
        {"id": "10000000-0000-0003-0000-000000000001", "name": "NABIP Florida", "state": "FL", "actual_member_count": 542},
        {"id": "10000000-0000-0002-0000-000000000001", "name": "NABIP New York", "state": "NY", "actual_member_count": 487},
        {"id": "10000000-0000-0002-0000-000000000003", "name": "NABIP Pennsylvania", "state": "PA", "actual_member_count": 312},
        {"id": "10000000-0000-0004-0000-000000000001", "name": "NABIP Illinois", "state": "IL", "actual_member_count": 334},
        {"id": "10000000-0000-0004-0000-000000000002", "name": "NABIP Ohio", "state": "OH", "actual_member_count": 267},
        {"id": "10000000-0000-0003-0000-000000000002", "name": "NABIP Georgia", "state": "GA", "actual_member_count": 267},
        {"id": "10000000-0000-0003-0000-000000000003", "name": "NABIP North Carolina", "state": "NC", "actual_member_count": 189},
        {"id": "10000000-0000-0004-0000-000000000003", "name": "NABIP Michigan", "state": "MI", "actual_member_count": 156},
        # Add more chapters as needed
    ]

    generator = MemberGenerator(chapters)

    # Generate members
    members = generator.generate_members(total_count=20000)

    # Export to SQL
    sql_path = os.path.join(base_dir, "supabase", "migrations", "20250115_seed_members.sql")
    generator.export_to_sql(members, sql_path)

    # Export to JSON for review
    json_path = os.path.join(base_dir, "data", "sample_members.json")
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    generator.export_to_json(members[:100], json_path)  # First 100 for review

    print("\n[SUCCESS] Member seed data generation complete!")
    print(f"   Total members: {len(members):,}")
    print(f"   Unique emails: {len(generator.generated_emails):,}")
    print(f"   Active: {sum(1 for m in members if m['status'] == 'active'):,}")
    print(f"   Lapsed: {sum(1 for m in members if m['status'] == 'lapsed'):,}")
    print(f"   Inactive: {sum(1 for m in members if m['status'] == 'inactive'):,}")
    print(f"   Pending: {sum(1 for m in members if m['status'] == 'pending'):,}")


if __name__ == "__main__":
    main()
