"""
Seed script: creates a demo creator user + 5 conversation topics.
Run: python seed.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from passlib.context import CryptContext

MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "lotus_hack"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Workaround for passlib + bcrypt 4.0+ issue
import bcrypt
# Monkeypatch bcrypt to avoid the 72-byte limit check during passlib's internal bug detection
original_hashpw = bcrypt.hashpw
def patched_hashpw(password, salt):
    if isinstance(password, str):
        password = password.encode("utf-8")
    if len(password) > 72:
        password = password[:72]
    return original_hashpw(password, salt)
bcrypt.hashpw = patched_hashpw

if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

TOPICS = [
    {
        "title": "Negotiating a Salary Raise",
        "description": "Practice advocating for yourself in a real salary negotiation with your HR manager and team lead.",
        "domain_knowledge": (
            "TechCorp has a flat pay structure. Merit-based raises are capped at 10% per cycle. "
            "The current fiscal year has been profitable but the company is cautious about headcount costs. "
            "The learner has been with the company for 2 years and received a 'Exceeds Expectations' review. "
            "Industry benchmarks show the learner is paid 15% below market rate for their role."
        ),
        "cefr_levels": ["B2", "C1"],
        "tags": ["business", "negotiation", "HR"],
        "characters": [
            {
                "name": "Sarah",
                "role": "HR Manager",
                "persona": "Professional, empathetic, data-driven, values process and fairness. Speaks formally.",
                "bias_perception": "Believes the budget is stretched thin. Skeptical of individual raise requests but open to data-backed arguments.",
                "voice_id": "default",
                "avatar_preset": "professional_f",
            },
            {
                "name": "Mike",
                "role": "Team Lead",
                "persona": "Casual, supportive, mentoring tone. Wants the best for the team but is cautious about rocking the boat.",
                "bias_perception": "Genuinely wants to advocate for the learner but fears pushback from leadership. Will support if pushed.",
                "voice_id": "default",
                "avatar_preset": "casual_m",
            },
        ],
    },
    {
        "title": "Climate Change Town Hall",
        "description": "Debate climate policy with a skeptical journalist and an environmental scientist.",
        "domain_knowledge": (
            "The town is considering a new carbon tax proposal that would raise energy costs by 12% but fund renewable infrastructure. "
            "Recent IPCC reports show the region has already warmed 1.4°C above pre-industrial levels. "
            "Local industry employs 8,000 people and accounts for 30% of regional emissions. "
            "Renewable energy jobs in the region have grown 40% in the past 3 years."
        ),
        "cefr_levels": ["B2", "C1", "C2"],
        "tags": ["environment", "debate", "policy"],
        "characters": [
            {
                "name": "Dr. Rivera",
                "role": "Environmental Scientist",
                "persona": "Passionate, evidence-driven, occasionally impatient with denial. Uses technical language but can simplify.",
                "bias_perception": "Believes urgent action is non-negotiable. Frustrated by political delays but remains constructive.",
                "voice_id": "default",
                "avatar_preset": "scientist_f",
            },
            {
                "name": "Tom",
                "role": "Local Journalist",
                "persona": "Skeptical, probing, balanced. Asks tough questions. Represents the 'common person' perspective.",
                "bias_perception": "Worried about economic impact on working families. Wants to hear practical solutions, not just data.",
                "voice_id": "default",
                "avatar_preset": "journalist_m",
            },
        ],
    },
    {
        "title": "Medical Consultation: Diagnosis Discussion",
        "description": "Practice explaining symptoms and understanding medical advice with a doctor and specialist.",
        "domain_knowledge": (
            "The patient has been experiencing fatigue, mild chest tightness, and occasional dizziness for 3 weeks. "
            "Initial blood tests show slightly elevated cholesterol (LDL 140 mg/dL) and borderline blood pressure (135/85). "
            "The patient is 42 years old, moderately active, and has a family history of heart disease. "
            "The clinic recommends lifestyle changes before medication."
        ),
        "cefr_levels": ["B1", "B2"],
        "tags": ["healthcare", "medical", "communication"],
        "characters": [
            {
                "name": "Dr. Chen",
                "role": "General Practitioner",
                "persona": "Calm, reassuring, clear communicator. Avoids jargon, checks for understanding often.",
                "bias_perception": "Prefers conservative treatment first. Emphasizes lifestyle over medication. Cautious but thorough.",
                "voice_id": "default",
                "avatar_preset": "doctor_m",
            },
        ],
    },
    {
        "title": "Job Interview at a Tech Startup",
        "description": "Practice interviewing for a software engineer role at a fast-growing startup.",
        "domain_knowledge": (
            "ByteRocket is a Series B startup building AI-powered logistics software. 120 employees, fully remote. "
            "The role is Senior Software Engineer (backend focus). Stack: Python, FastAPI, PostgreSQL, AWS. "
            "The team values autonomy, moves fast, and expects engineers to own their projects end-to-end. "
            "The interview includes both technical and culture-fit components."
        ),
        "cefr_levels": ["B2", "C1"],
        "tags": ["career", "interview", "technology"],
        "characters": [
            {
                "name": "Alex",
                "role": "Engineering Manager",
                "persona": "Direct, pragmatic, values clear communicators. Cuts through BS quickly. Friendly but no-nonsense.",
                "bias_perception": "Has been burned by over-confident hires before. Probes for humility and real problem-solving ability.",
                "voice_id": "default",
                "avatar_preset": "manager_m",
            },
            {
                "name": "Priya",
                "role": "Senior Engineer (Panel)",
                "persona": "Collaborative, curious, asks about process and trade-offs. Cares about team culture.",
                "bias_perception": "Protective of team dynamics. Looking for someone who communicates well and admits gaps honestly.",
                "voice_id": "default",
                "avatar_preset": "engineer_f",
            },
        ],
    },
    {
        "title": "Hotel Complaint Resolution",
        "description": "Practice assertively resolving a service problem with a hotel manager.",
        "domain_knowledge": (
            "The guest booked a superior sea-view room for 3 nights at $280/night. On arrival, they were given an interior room. "
            "The hotel is at 95% capacity due to a conference. The guest has a loyalty card (Gold status). "
            "Hotel policy allows upgrades for Gold members when available, and compensation vouchers for booking errors. "
            "The guest has an important business dinner tonight and needs the situation resolved quickly."
        ),
        "cefr_levels": ["B1", "B2"],
        "tags": ["travel", "customer service", "assertiveness"],
        "characters": [
            {
                "name": "James",
                "role": "Hotel Front Desk Manager",
                "persona": "Polite, apologetic, conflict-averse. Tries to de-escalate. Speaks diplomatically.",
                "bias_perception": "Wants to avoid confrontation and protect the hotel's reputation. Will offer compensation to keep guest happy.",
                "voice_id": "default",
                "avatar_preset": "manager_m2",
            },
        ],
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Create demo creator
    existing = await db.users.find_one({"email": "creator@demo.com"})
    if existing:
        creator_id = existing["_id"]
        print("Creator user already exists, skipping...")
    else:
        creator = {
            "email": "creator@demo.com",
            "password_hash": pwd_context.hash("password123"),
            "role": "creator",
            "profile": {
                "display_name": "Demo Creator",
                "avatar_config": {
                    "skin_tone": "medium",
                    "face_preset": "default",
                    "clothing": "casual",
                },
            },
            "cefr": {"self_assessed": None, "calibrated": None},
            "institution_id": None,
            "cohort_ids": [],
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(creator)
        creator_id = result.inserted_id
        print(f"Created creator: creator@demo.com / password123")

    # Create demo learner
    existing_learner = await db.users.find_one({"email": "learner@demo.com"})
    if not existing_learner:
        learner = {
            "email": "learner@demo.com",
            "password_hash": pwd_context.hash("password123"),
            "role": "learner",
            "profile": {
                "display_name": "Demo Learner",
                "avatar_config": {
                    "skin_tone": "medium",
                    "face_preset": "default",
                    "clothing": "casual",
                },
            },
            "cefr": {"self_assessed": "B2", "calibrated": None},
            "institution_id": None,
            "cohort_ids": [],
            "created_at": datetime.utcnow(),
        }
        await db.users.insert_one(learner)
        print(f"Created learner: learner@demo.com / password123")

    # Seed topics
    now = datetime.utcnow()
    seeded = 0
    for topic_data in TOPICS:
        existing_topic = await db.conversation_topics.find_one(
            {"title": topic_data["title"], "creator_id": creator_id}
        )
        if existing_topic:
            print(f"Topic '{topic_data['title']}' already exists, skipping...")
            continue

        characters = []
        for c in topic_data["characters"]:
            char = dict(c)
            char["_id"] = ObjectId()
            characters.append(char)

        topic = {
            "creator_id": creator_id,
            "title": topic_data["title"],
            "description": topic_data["description"],
            "domain_knowledge": topic_data["domain_knowledge"],
            "status": "published",
            "cefr_levels": topic_data["cefr_levels"],
            "tags": topic_data["tags"],
            "characters": characters,
            "play_count": 0,
            "avg_score": 0.0,
            "created_at": now,
            "updated_at": now,
        }
        await db.conversation_topics.insert_one(topic)
        seeded += 1
        print(f"Seeded: {topic_data['title']}")

    print(f"\nDone. {seeded} topics seeded.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
