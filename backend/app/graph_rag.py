# GraphRAG - uses OpenAI to generate skills and relationships dynamically

import os
from typing import List, Dict, Any, Optional
import json
from openai import OpenAI
from pydantic import BaseModel


class Skill(BaseModel):
    id: str
    name: str
    category: str
    description: str
    difficulty_level: int  # 1-5
    learning_time_hours: int


class SkillRelationship(BaseModel):
    source_skill_id: str
    target_skill_id: str
    relationship_type: str  # PREREQUISITE_OF, RELATES_TO, BUILDS_ON
    strength: float


class LearningPath(BaseModel):
    path_id: str
    name: str
    skills: List[str]
    estimated_duration_hours: int
    difficulty_progression: List[int]


class GraphRAG:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o-mini"
    
    def enrich_single_skill(self, skill_name):
        # Use AI to get skill metadata
        prompt = f"""Analyze this technical skill: "{skill_name}"

Provide the following information in JSON format:
1. description: Brief 1-sentence description of what this skill is
2. difficulty_level: Integer 1-5 (1=beginner, 5=expert)
3. learning_time_hours: Estimated hours to learn (realistic estimate)

Focus on the ESSENTIAL information. The skill's relationships (prerequisites, related skills) 
will define its position in the knowledge graph - no categories needed.

Respond with ONLY valid JSON, no markdown, no explanation:
{{
  "description": "...",
  "difficulty_level": X,
  "learning_time_hours": Y
}}"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a technical skill analysis expert. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            content = res.choices[0].message.content.strip()
            
            # Remove markdown if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            enriched = json.loads(content)
            
            enriched.setdefault('description', f'User-added skill: {skill_name}')
            enriched.setdefault('difficulty_level', 2)
            enriched.setdefault('learning_time_hours', 20)
            
            return enriched
            
        except Exception as e:
            print(f"Error enriching skill '{skill_name}': {e}")
            return {
                'description': f'User-added skill: {skill_name}',
                'difficulty_level': 2,
                'learning_time_hours': 20
            }
    
    def find_related_skills(self, skill_name, existing_skills):
        # Find semantically related skills using AI
        if not existing_skills:
            return []
        
        prompt = f"""Given the skill: "{skill_name}"

And these existing skills:
{', '.join(existing_skills)}

Which 1-2 skills from the list are DIRECTLY RELATED to "{skill_name}"?

A skill is DIRECTLY RELATED if:
✅ It's in the SAME ECOSYSTEM (e.g., React ↔ Next.js, Django ↔ Flask)
✅ It's a DIRECT EXTENSION (e.g., Python ↔ FastAPI, JavaScript ↔ React)
✅ They're ALWAYS USED TOGETHER (e.g., HTML ↔ CSS)

A skill is NOT RELATED if:
❌ It's an ALTERNATIVE technology (Python vs Node.js, React vs Vue)
❌ It's a DEPLOYMENT platform (AWS, Azure, Docker - these are infrastructure, not related)
❌ They're in DIFFERENT DOMAINS (Backend vs Frontend, unless truly integrated)
❌ They just happen to be used in the same project

Examples of CORRECT relationships:
- Python ↔ Django ✅ (same ecosystem)
- JavaScript ↔ React ✅ (direct extension)
- React ↔ Next.js ✅ (same ecosystem)

Examples of WRONG relationships:
- Python ↔ Node.js ❌ (alternatives)
- FastAPI ↔ AWS ❌ (deployment layer)
- Django ↔ React ❌ (different domains)

Be STRICT. Only return skills that are TRULY in the same ecosystem.
If no real relationships exist, return empty array.

Respond with ONLY a JSON array of skill names, no explanation:
["skill1"]"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a technical skill relationship expert. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )
            
            content = res.choices[0].message.content.strip()
            
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            related = json.loads(content)
            
            if isinstance(related, list):
                return [s for s in related if s in existing_skills][:3]
            
            return []
            
        except Exception as e:
            print(f"Error finding related skills: {e}")
            return []
    
    def find_prerequisites(self, skill_name, existing_skills):
        # Find prerequisite skills using AI
        if not existing_skills:
            return []
        
        prompt = f"""Given the skill: "{skill_name}"

And these existing skills:
{', '.join(existing_skills)}

Which 1-2 skills from the list are ACTUAL PREREQUISITES for learning "{skill_name}"?

A prerequisite means: "You should learn this BEFORE learning {skill_name}"

Examples of CORRECT prerequisites:
- HTML is a prerequisite of React ✅
- JavaScript is a prerequisite of React ✅
- Python is a prerequisite of Django ✅
- SQL is a prerequisite of PostgreSQL ✅

Examples of WRONG prerequisites:
- Python is NOT a prerequisite of Node.js ❌ (different languages)
- React is NOT a prerequisite of Django ❌ (different stacks)

Only include skills that are truly foundational to "{skill_name}".
If no real prerequisites exist in the list, return empty array.

Respond with ONLY a JSON array of skill names, no explanation:
["skill1", "skill2"]"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a technical skill prerequisite expert. Only return TRUE prerequisites. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=100
            )
            
            content = res.choices[0].message.content.strip()
            
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            prereqs = json.loads(content)
            
            if isinstance(prereqs, list):
                return [s for s in prereqs if s in existing_skills][:2]
            
            return []
            
        except Exception as e:
            print(f"Error finding prerequisites: {e}")
            return []
    
    def generate_skills_from_domain(self, domain, num_skills=20):
        # Generate skills for a domain using AI
        prompt = f"""You are an expert curriculum designer. Generate {num_skills} technical skills for the domain: "{domain}".

For each skill, provide:
- id: lowercase, hyphenated identifier (e.g., "react-hooks")
- name: Proper display name (e.g., "React Hooks")
- category: One of [frontend, backend, database, devops, ai-ml, mobile, security]
- description: Brief 1-sentence description
- difficulty_level: 1 (beginner) to 5 (expert)
- learning_time_hours: Estimated hours to learn (5-100)

Generate a comprehensive skill tree covering fundamentals to advanced topics.
Include variety across all categories.

Return ONLY valid JSON array of skills with no additional text:
[{{"id": "...", "name": "...", "category": "...", "description": "...", "difficulty_level": 1, "learning_time_hours": 10}}, ...]"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert technical curriculum designer. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = res.choices[0].message.content
            data = json.loads(content)
            
            skills_data = data if isinstance(data, list) else data.get("skills", [])
            
            skills = [Skill(**skill) for skill in skills_data]
            return skills
            
        except Exception as e:
            print(f"Error generating skills: {e}")
            return self._get_fallback_skills(domain)
    
    def generate_skill_relationships(self, skills):
        # Generate relationships between skills using AI
        skills_summary = [
            {
                "id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "difficulty": skill.difficulty_level
            }
            for skill in skills
        ]
        
        prompt = f"""Given these technical skills, identify logical relationships between them:

{json.dumps(skills_summary, indent=2)}

Generate relationships with these types:
- PREREQUISITE_OF: source skill is required before target skill
- RELATES_TO: skills are related/complementary
- BUILDS_ON: target skill extends/builds upon source skill

For each relationship, provide:
- source_skill_id: ID of source skill
- target_skill_id: ID of target skill
- relationship_type: One of the types above
- strength: 0.0-1.0 (how strong the relationship is)

Create 30-50 relationships that form a logical learning graph.
Ensure beginners have prerequisites and advanced skills build on fundamentals.

Return ONLY valid JSON array:
[{{"source_skill_id": "...", "target_skill_id": "...", "relationship_type": "PREREQUISITE_OF", "strength": 0.9}}, ...]"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at knowledge graph design. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            content = res.choices[0].message.content
            data = json.loads(content)
            
            rels_data = data if isinstance(data, list) else data.get("relationships", [])
            
            relationships = [SkillRelationship(**rel) for rel in rels_data]
            return relationships
            
        except Exception as e:
            print(f"Error generating relationships: {e}")
            return self._generate_basic_relationships(skills)
    
    def generate_learning_path(self, user_skills, target_skill, all_skills, relationships):
        # Generate personalized learning path
        skills_map = {skill.id: skill for skill in all_skills}
        target = skills_map.get(target_skill)
        
        if not target:
            return None
        
        context = {
            "user_skills": user_skills,
            "target_skill": {
                "id": target.id,
                "name": target.name,
                "difficulty": target.difficulty_level
            },
            "available_skills": [
                {"id": s.id, "name": s.name, "difficulty": s.difficulty_level, "hours": s.learning_time_hours}
                for s in all_skills if s.id not in user_skills
            ],
            "prerequisites": [
                {"from": r.source_skill_id, "to": r.target_skill_id}
                for r in relationships if r.relationship_type == "PREREQUISITE_OF"
            ]
        }
        
        prompt = f"""Create an optimal learning path for a student.

Current situation:
- User knows: {', '.join(user_skills) if user_skills else 'None (beginner)'}
- Target skill: {target.name}

Available skills and prerequisites:
{json.dumps(context, indent=2)}

Generate a logical learning path:
1. Start from user's current level
2. Include necessary prerequisites
3. Progress from easier to harder skills
4. End at the target skill

Return ONLY valid JSON:
{{
  "path_id": "path-to-{target_skill}",
  "name": "Learning Path to {target.name}",
  "skills": ["skill-id-1", "skill-id-2", ...],
  "estimated_duration_hours": <total hours>,
  "difficulty_progression": [1, 2, 2, 3, ...]
}}"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert learning path designer. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            content = res.choices[0].message.content
            data = json.loads(content)
            
            return LearningPath(**data)
            
        except Exception as e:
            print(f"Error generating learning path: {e}")
            return None
    
    def enrich_skill_with_resources(self, skill):
        # Get learning resources for a skill
        prompt = f"""Provide learning resources and guidance for: {skill.name}

Skill details:
- Category: {skill.category}
- Difficulty: {skill.difficulty_level}/5
- Description: {skill.description}

Generate:
1. Top 3 recommended learning resources (courses, docs, tutorials)
2. 2 practice project ideas
3. 3 key concepts to focus on
4. 2 common pitfalls to avoid

Return ONLY valid JSON:
{{
  "resources": [{{"title": "...", "url": "...", "type": "..."}}],
  "projects": [{{"title": "...", "description": "..."}}],
  "key_concepts": ["..."],
  "pitfalls": ["..."]
}}"""

        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a technical education expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                response_format={"type": "json_object"}
            )
            
            content = res.choices[0].message.content
            enrichment = json.loads(content)
            
            return {
                **skill.model_dump(),
                **enrichment
            }
            
        except Exception as e:
            print(f"Error enriching skill: {e}")
            return skill.model_dump()
    
    def _get_fallback_skills(self, domain):
        # Fallback if AI fails
        return [
            Skill(
                id="html-css",
                name="HTML & CSS",
                category="frontend",
                description="Fundamentals of web structure and styling",
                difficulty_level=1,
                learning_time_hours=20
            ),
            Skill(
                id="javascript",
                name="JavaScript",
                category="frontend",
                description="Core programming language for web development",
                difficulty_level=2,
                learning_time_hours=40
            ),
        ]
    
    def _generate_basic_relationships(self, skills):
        # Basic relationships if AI fails
        relationships = []
        sorted_skills = sorted(skills, key=lambda s: s.difficulty_level)
        
        for i in range(len(sorted_skills) - 1):
            if sorted_skills[i].category == sorted_skills[i + 1].category:
                relationships.append(
                    SkillRelationship(
                        source_skill_id=sorted_skills[i].id,
                        target_skill_id=sorted_skills[i + 1].id,
                        relationship_type="PREREQUISITE_OF",
                        strength=0.8
                    )
                )
        
        return relationships


if __name__ == "__main__":
    rag = GraphRAG()
    
    # Test: Generate skills
    skills = rag.generate_skills_from_domain("Full-Stack Web Development", num_skills=15)
    print(f"Generated {len(skills)} skills")
    
    # Test: Generate relationships
    relationships = rag.generate_skill_relationships(skills)
    print(f"Generated {len(relationships)} relationships")
    
    # Test: Generate learning path
    path = rag.generate_learning_path(
        user_skills=["html-css", "javascript"],
        target_skill="react",
        all_skills=skills,
        relationships=relationships
    )
    if path:
        print(f"Learning path: {path.name}")
        print(f"Steps: {' → '.join(path.skills)}")
