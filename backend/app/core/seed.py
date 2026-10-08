import json
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.database_models import User, Resume, JobDescription, Analysis, RecruiterJob, RecruiterCandidate, CloudEvent
from app.services.analysis_service import execute_full_analysis

SAMPLE_RESUME_TEXT = """
ALEXANDER VANCE
San Francisco, CA | alex.vance@cloudeng.io | (555) 234-5678 | linkedin.com/in/alexandervance | github.com/avance-cloud

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5+ years of experience designing and deploying high-throughput distributed microservices, RESTful APIs, and cloud-native backend systems. Specialized in Java, Spring Boot, PostgreSQL, Docker, and Kubernetes. Proven track record of reducing latency by 35% and scaling systems to 15M daily requests.

TECHNICAL SKILLS
Languages: Java (11/17), Python, SQL, Bash, Go
Frameworks & Libraries: Spring Boot, Spring Cloud, Hibernate, REST APIs, GraphQL, JUnit, Mockito
Databases & Storage: PostgreSQL, Redis, MySQL, MongoDB
DevOps & Cloud: Docker, Kubernetes, AWS (EC2, S3), GitHub Actions, CI/CD, Prometheus, Grafana
Methodologies: Microservices, System Design, Agile, Scrum, TDD, Clean Architecture

PROFESSIONAL EXPERIENCE
Senior Software Engineer | FinTech Cloud Systems | 2022 – Present
• Architected and deployed Java Spring Boot microservices processing 12,000 requests/second with sub-40ms P99 latency.
• Engineered distributed caching layer using Redis and PostgreSQL, reducing database query overhead by 42%.
• Spearheaded containerization migration with Docker and Kubernetes, standardizing deployment across 8 microservices.
• Integrated automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle duration from 4 hours to 18 minutes.

Software Engineer | Nexus Digital Platforms | 2019 – 2022
• Developed backend RESTful services and relational database schemas in Java and MySQL for enterprise portal.
• Refactored legacy monolithic services into modular Spring components, improving maintainability and test coverage to 88%.
• Collaborated with frontend engineering teams to implement GraphQL and REST endpoints serving 500,000 active web users.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | Graduated 2019
"""

SAMPLE_JOB_TEXT = """
Job Title: Senior Java Backend Developer
Company: Enterprise FinTech Cloud Corp
Location: Remote / San Francisco, CA

About the Role:
We are seeking a Senior Java Backend Developer to build scalable, fault-tolerant financial microservices. You will collaborate with cloud architects and product engineers to design secure REST APIs and distributed processing backends.

Requirements (Must Have):
• 4+ years of professional software development experience.
• Strong hands-on proficiency with Java (Java 11 or 17) and Spring Boot framework.
• Proven track record designing REST APIs and distributed microservices architectures.
• Solid relational database expertise with PostgreSQL or MySQL.
• Experience with container technologies: Docker and Kubernetes.
• Familiarity with Git, CI/CD pipelines, and automated unit testing (JUnit).
• Bachelor's Degree in Computer Science or equivalent engineering field.

Preferred Qualifications (Nice to Have):
• Experience with AWS cloud infrastructure (AWS S3, EC2, ECS, Lambda).
• Familiarity with distributed caching using Redis.
• Exposure to message brokers like Apache Kafka or RabbitMQ.
• Understanding of OWASP security practices and financial compliance standards.
"""

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    existing_user = db.query(User).filter(User.email == "demo@resumex.cloud").first()
    if existing_user:
        db.close()
        return

    print("Seeding Resumex-Cloud sample data...")
    # 1. Create Demo User
    demo_user = User(
        email="demo@resumex.cloud",
        password_hash=hash_password("resumex2026"),
        name="Alexander Vance",
        preferred_role="Senior Java Backend Developer",
        experience_level="Senior (5+ years)",
        role="candidate"
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    # 2. Create Resume
    resume = Resume(
        user_id=demo_user.id,
        filename="Alexander_Vance_Senior_Java_Engineer.pdf",
        file_size_bytes=64200,
        file_type="pdf",
        storage_path="seed_alexander_vance.pdf",
        page_count=1,
        word_count=320,
        raw_text=SAMPLE_RESUME_TEXT.strip(),
        parsed_sections_json=json.dumps({
            "contact": "Alexander Vance | San Francisco | alex.vance@cloudeng.io",
            "summary": "Senior Backend Engineer with 5+ years of experience...",
            "skills": "Java, Spring Boot, PostgreSQL, Docker, Kubernetes, AWS, Redis",
            "experience": "Senior Software Engineer at FinTech Cloud Systems...",
            "education": "B.S. in Computer Science, UC Berkeley"
        }),
        ats_formatting_analysis_json=json.dumps([
            {
                "severity": "SAFE",
                "category": "Layout Structure",
                "title": "Clean Linear Hierarchy",
                "description": "Deterministic single-column stream verified.",
                "recommendation": "Maintains 100% extraction fidelity across ATS parsers."
            }
        ])
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # 3. Create Job Description
    job = JobDescription(
        user_id=demo_user.id,
        title="Senior Java Backend Developer",
        company="Enterprise FinTech Cloud Corp",
        raw_text=SAMPLE_JOB_TEXT.strip()
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 4. Run Analysis
    execute_full_analysis(
        resume_text=resume.raw_text,
        job_text=job.raw_text,
        target_job_title=job.title,
        company_name=job.company,
        candidate_name=demo_user.name,
        db=db,
        user_id=demo_user.id,
        resume_id=resume.id,
        job_id=job.id,
        is_demo=False
    )

    # 5. Create Recruiter Requisition with Multiple Candidates
    rec_job = RecruiterJob(
        user_id=demo_user.id,
        title="Senior Java Backend Developer",
        department="Core Infrastructure Engineering",
        job_description_text=SAMPLE_JOB_TEXT.strip()
    )
    db.add(rec_job)
    db.commit()
    db.refresh(rec_job)

    candidates_seed = [
        ("Alexander Vance", "alex.vance@cloudeng.io", "Alexander_Vance_Resume.pdf", 91.5, 92.0, 95.0, 100.0, ["Java", "Spring Boot", "Docker", "PostgreSQL", "Kubernetes"], ["Kafka"], "Fast Track"),
        ("Sarah Jenkins", "s.jenkins@techmail.com", "Sarah_Jenkins_CV.pdf", 84.0, 85.0, 80.0, 95.0, ["Java", "Spring Boot", "Docker", "REST APIs"], ["Kubernetes", "Redis"], "Strong Match"),
        ("Marcus Brody", "m.brody@devvault.net", "Marcus_Brody_Resume.pdf", 76.5, 78.0, 75.0, 80.0, ["Java", "MySQL", "Docker", "Git"], ["Spring Boot", "Kubernetes"], "Consider"),
        ("David Lin", "dlin@codehub.io", "David_Lin_Profile.pdf", 58.0, 50.0, 60.0, 70.0, ["Python", "Flask", "Docker"], ["Java", "Spring Boot", "Kubernetes"], "Review Gaps")
    ]

    for name, email, fname, ats, sk, exp, edu, top_sk, miss_sk, verdict in candidates_seed:
        c = RecruiterCandidate(
            recruiter_job_id=rec_job.id,
            candidate_name=name,
            candidate_email=email,
            resume_filename=fname,
            ats_score=ats,
            skills_score=sk,
            experience_score=exp,
            education_score=edu,
            top_matched_skills=json.dumps(top_sk),
            critical_missing_skills=json.dumps(miss_sk),
            recommendation_verdict=verdict
        )
        db.add(c)

    db.add(CloudEvent(
        event_type="SYSTEM_INITIALIZED",
        level="INFO",
        message="Resumex-Cloud database successfully seeded with initial tenant records."
    ))

    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
