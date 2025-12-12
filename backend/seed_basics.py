#!/usr/bin/env python3
"""
Seed database with basic foundational skills
These serve as prerequisites for user-added skills
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv('../.env.local')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Neo4jConnection

BASIC_SKILLS = [
    # Programming fundamentals
    {"id": "html", "name": "HTML", "category": "frontend", "difficulty": 1},
    {"id": "css", "name": "CSS", "category": "frontend", "difficulty": 1},
    {"id": "javascript", "name": "JavaScript", "category": "frontend", "difficulty": 2},
    {"id": "python", "name": "Python", "category": "backend", "difficulty": 1},
    {"id": "sql", "name": "SQL", "category": "database", "difficulty": 1},
    {"id": "git", "name": "Git", "category": "devops", "difficulty": 1},
    {"id": "linux", "name": "Linux", "category": "devops", "difficulty": 2},
    {"id": "http", "name": "HTTP", "category": "backend", "difficulty": 1},
    {"id": "rest-api", "name": "REST API", "category": "backend", "difficulty": 2},
    {"id": "nodejs", "name": "Node.js", "category": "backend", "difficulty": 2},
]

def seed_basics():
    """Add basic foundational skills"""
    print("\n🌱 Seeding Basic Skills...")
    print("━" * 60)
    
    driver = None
    try:
        driver = Neo4jConnection.create_driver()
        with driver.session() as session:
            # Create User if doesn't exist
            session.run("""
                MERGE (u:User {id: 'user-1'})
                ON CREATE SET u.name = 'Demo User'
            """)
            
            created_count = 0
            for skill in BASIC_SKILLS:
                # Check if exists
                result = session.run("""
                    MATCH (s:Skill {id: $id})
                    RETURN s.id as id
                """, id=skill['id'])
                
                if result.single():
                    print(f"  ⏭️  {skill['name']} already exists")
                    continue
                
                # Create skill
                session.run("""
                    CREATE (s:Skill {
                        id: $id,
                        name: $name,
                        category: $category,
                        description: $description,
                        difficulty_level: $difficulty,
                        learning_time_hours: 10
                    })
                """,
                id=skill['id'],
                name=skill['name'],
                category=skill['category'],
                description=f"Foundational skill: {skill['name']}",
                difficulty=skill['difficulty'])
                
                created_count += 1
                print(f"  ✅ Created {skill['name']}")
            
            # Create some basic relationships
            print("\n🔗 Creating relationships...")
            
            relationships = [
                ("html", "PREREQUISITE_OF", "javascript"),
                ("css", "PREREQUISITE_OF", "javascript"),
                ("javascript", "PREREQUISITE_OF", "nodejs"),
                ("python", "PREREQUISITE_OF", "rest-api"),
                ("http", "PREREQUISITE_OF", "rest-api"),
            ]
            
            for source, rel_type, target in relationships:
                session.run(f"""
                    MATCH (a:Skill {{id: $source}})
                    MATCH (b:Skill {{id: $target}})
                    MERGE (a)-[:{rel_type}]->(b)
                """, source=source, target=target)
            
            print(f"  ✅ Created {len(relationships)} relationships")
            
            # Count total
            result = session.run("MATCH (s:Skill) RETURN count(s) as count")
            total = result.single()['count']
            
            print("\n" + "━" * 60)
            print(f"✅ Database ready with {total} skills")
            print("\n💡 Now you can add skills from the frontend!")
            print("   They will automatically link to these foundational skills")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    finally:
        if driver:
            driver.close()

if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║         Seed Basic Foundational Skills                   ║")
    print("╚══════════════════════════════════════════════════════════╝")
    seed_basics()

