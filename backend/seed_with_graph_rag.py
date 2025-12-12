#!/usr/bin/env python3
"""
Seed Neo4j database using Graph RAG - Dynamic skill generation with LLMs
No more hardcoded data!
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).parent.parent
load_dotenv(project_root / '.env.local')
load_dotenv(project_root / '.env')

# Import after loading env
from app.graph_rag import GraphRAG
from app.database import Neo4jConnection


def seed_database_with_graph_rag(domain: str = "Full-Stack Web Development", num_skills: int = 50):
    """
    Seed Neo4j database using Graph RAG
    
    Args:
        domain: Learning domain to generate skills for
        num_skills: Number of skills to generate
    """
    print("=" * 70)
    print("🤖 GRAPH RAG - DYNAMIC KNOWLEDGE GRAPH SEEDING")
    print("=" * 70)
    print()
    
    # Check configuration
    print("1. Checking Configuration...")
    
    if not os.getenv("OPENAI_API_KEY"):
        print("   ❌ ERROR: OPENAI_API_KEY not found in environment variables")
        print("   Please add OPENAI_API_KEY to your .env.local file")
        sys.exit(1)
    print("   ✅ OpenAI API key found")
    
    if not Neo4jConnection.is_configured():
        print("   ❌ ERROR: Neo4j not configured")
        print("   Please check NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in .env.local")
        sys.exit(1)
    print("   ✅ Neo4j configured")
    print()
    
    # Initialize Graph RAG
    print("2. Initializing Graph RAG...")
    try:
        graph_rag = GraphRAG()
        print("   ✅ Graph RAG initialized")
    except Exception as e:
        print(f"   ❌ Failed to initialize Graph RAG: {e}")
        sys.exit(1)
    print()
    
    # Generate skills
    print(f"3. Generating {num_skills} skills for domain: '{domain}'...")
    print("   (This may take 10-30 seconds...)")
    try:
        skills = graph_rag.generate_skills_from_domain(domain, num_skills)
        print(f"   ✅ Generated {len(skills)} skills")
        
        # Show sample skills
        print("\n   Sample skills generated:")
        for skill in skills[:5]:
            print(f"      • {skill.name} ({skill.category}) - Level {skill.difficulty_level}/5")
    except Exception as e:
        print(f"   ❌ Failed to generate skills: {e}")
        sys.exit(1)
    print()
    
    # Generate relationships
    print("4. Generating skill relationships...")
    print("   (Analyzing prerequisites and connections...)")
    try:
        relationships = graph_rag.generate_skill_relationships(skills)
        print(f"   ✅ Generated {len(relationships)} relationships")
        
        # Show sample relationships
        print("\n   Sample relationships:")
        for rel in relationships[:5]:
            print(f"      • {rel.source_skill_id} → {rel.target_skill_id} ({rel.relationship_type})")
    except Exception as e:
        print(f"   ❌ Failed to generate relationships: {e}")
        sys.exit(1)
    print()
    
    # Populate Neo4j
    print("5. Populating Neo4j database...")
    try:
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            # Clear existing data
            print("   • Clearing existing skills...")
            session.run("MATCH (s:Skill) DETACH DELETE s")
            
            # Create user if doesn't exist
            print("   • Creating/updating user...")
            session.run("""
                MERGE (u:User {id: 'user-1'})
                SET u.name = 'Demo Developer',
                    u.email = 'demo@vibecoderz.com'
            """)
            
            # Create skills
            print(f"   • Creating {len(skills)} skills...")
            for i, skill in enumerate(skills, 1):
                session.run("""
                    CREATE (s:Skill {
                        id: $id,
                        name: $name,
                        category: $category,
                        description: $description,
                        difficulty_level: $difficulty_level,
                        learning_time_hours: $learning_time_hours
                    })
                """, **skill.model_dump())
                
                if i % 10 == 0:
                    print(f"      Progress: {i}/{len(skills)} skills created")
            
            print(f"   ✅ Created {len(skills)} skills")
            
            # Create relationships
            print(f"   • Creating {len(relationships)} relationships...")
            created_count = 0
            for rel in relationships:
                try:
                    session.run(f"""
                        MATCH (s1:Skill {{id: $source}})
                        MATCH (s2:Skill {{id: $target}})
                        CREATE (s1)-[:{rel.relationship_type} {{strength: $strength}}]->(s2)
                    """, 
                    source=rel.source_skill_id,
                    target=rel.target_skill_id,
                    strength=rel.strength)
                    created_count += 1
                except:
                    # Skip if skills don't exist
                    pass
            
            print(f"   ✅ Created {created_count} relationships")
            
            # Assign random skills to user as "learned"
            print("   • Assigning learned skills to user...")
            result = session.run("""
                MATCH (u:User {id: 'user-1'})
                MATCH (s:Skill)
                WHERE s.difficulty_level <= 3
                WITH u, s, rand() as r
                WHERE r < 0.4
                CREATE (u)-[:LEARNED {confidence: toInteger(60 + rand() * 35)}]->(s)
                RETURN count(*) as learned_count
            """)
            
            learned_count = result.single()["learned_count"]
            print(f"   ✅ User learned {learned_count} skills")
            
        finally:
            session.close()
            driver.close()
        
        print("   ✅ Neo4j database populated successfully")
        
    except Exception as e:
        print(f"   ❌ Failed to populate Neo4j: {e}")
        sys.exit(1)
    print()
    
    # Summary
    print("=" * 70)
    print("✅ GRAPH RAG SEEDING COMPLETE!")
    print("=" * 70)
    print()
    print(f"📊 Summary:")
    print(f"   • Domain: {domain}")
    print(f"   • Skills generated: {len(skills)}")
    print(f"   • Relationships created: {created_count}")
    print(f"   • User learned skills: {learned_count}")
    print()
    print("🚀 Your knowledge graph is now powered by AI!")
    print("   No hardcoded data - everything is dynamically generated.")
    print()
    print("💡 Try different domains:")
    print("   python seed_with_graph_rag.py 'Data Science & Machine Learning'")
    print("   python seed_with_graph_rag.py 'Mobile App Development'")
    print("   python seed_with_graph_rag.py 'Cloud & DevOps Engineering'")
    print()


if __name__ == "__main__":
    # Get domain from command line or use default
    domain = sys.argv[1] if len(sys.argv) > 1 else "Full-Stack Web Development"
    num_skills = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    
    seed_database_with_graph_rag(domain, num_skills)

