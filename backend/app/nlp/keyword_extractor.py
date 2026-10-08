import re
from typing import Dict, List, Set, Any
from collections import Counter

TECH_TAXONOMY: Dict[str, List[str]] = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "golang", "go",
        "rust", "ruby", "php", "swift", "kotlin", "sql", "bash", "shell", "r", "scala"
    ],
    "Frameworks & Libraries": [
        "react", "next.js", "nextjs", "node.js", "nodejs", "express", "angular", "vue",
        "vue.js", "django", "fastapi", "flask", "spring", "spring boot", "asp.net",
        ".net core", "nestjs", "tailwind css", "tailwind", "bootstrap", "redux", "graphql",
        "grpc", "rest api", "restful api", "rest apis"
    ],
    "Databases & Storage": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "cassandra", "elasticsearch",
        "dynamodb", "oracle", "sqlite", "snowflake", "bigquery", "mariadb", "neo4j",
        "prisma", "sqlalchemy", "hibernate"
    ],
    "Cloud & Infrastructure": [
        "aws", "amazon web services", "azure", "microsoft azure", "google cloud", "gcp",
        "s3", "ec2", "lambda", "ecs", "eks", "fargate", "cloudformation", "terraform",
        "cloudfront", "route 53", "iam", "sqs", "sns", "serverless", "cloudflare", "supabase"
    ],
    "DevOps & CI/CD": [
        "docker", "kubernetes", "k8s", "ci/cd", "continuous integration", "github actions",
        "gitlab ci", "jenkins", "ansible", "helm", "prometheus", "grafana", "opentelemetry",
        "argocd", "datadog", "new relic", "linux", "nginx", "apache", "traefik"
    ],
    "Architecture & Concepts": [
        "microservices", "distributed systems", "event-driven", "system design",
        "object-oriented programming", "oop", "functional programming", "clean architecture",
        "domain-driven design", "ddd", "caching", "message broker", "kafka", "rabbitmq"
    ],
    "Security & Compliance": [
        "oauth", "oauth2", "jwt", "saml", "sso", "encryption", "tls", "ssl",
        "owasp", "soc2", "gdpr", "hipaa", "rbac", "zero trust", "penetration testing",
        "vulnerability management", "cybersecurity"
    ],
    "Certifications": [
        "aws certified", "aws certified solutions architect", "cka", "ckad",
        "certified kubernetes administrator", "pmp", "cissp", "ceh", "comptia security+",
        "azure certified", "gcp professional cloud architect"
    ],
    "Methodologies & Tools": [
        "git", "github", "gitlab", "jira", "confluence", "agile", "scrum", "kanban",
        "test driven development", "tdd", "unit testing", "integration testing",
        "playwright", "cypress", "jest", "pytest", "postman"
    ],
    "Soft Skills": [
        "leadership", "communication", "problem solving", "cross-functional",
        "mentorship", "team collaboration", "critical thinking", "stakeholder management",
        "agile development", "ownership"
    ]
}

SYNONYMS: Dict[str, str] = {
    "k8s": "kubernetes",
    "postgres": "postgresql",
    "nextjs": "next.js",
    "nodejs": "node.js",
    "amazon web services": "aws",
    "gcp": "google cloud",
    "microsoft azure": "azure",
    "reactjs": "react",
    "vuejs": "vue",
    "restful": "rest apis",
    "restful apis": "rest apis",
    "rest api": "rest apis",
    "spring": "spring boot",
    "golang": "go",
    "py": "python",
    "js": "javascript",
    "ts": "typescript"
}

def normalize_term(term: str) -> str:
    cleaned = term.lower().strip()
    return SYNONYMS.get(cleaned, cleaned)

def extract_keywords_from_text(text: str) -> Dict[str, Any]:
    """
    Extracts identified technical and domain keywords along with category and frequency.
    """
    lower_text = text.lower()
    found_keywords = {}
    category_counts = Counter()
    
    for category, terms in TECH_TAXONOMY.items():
        for term in terms:
            # Word boundary regex to avoid false substrings (e.g. "go" in "good")
            escaped_term = re.escape(term)
            pattern = rf'(?<!\w){escaped_term}(?!\w)'
            matches = list(re.finditer(pattern, lower_text))
            if matches:
                canonical = SYNONYMS.get(term, term)
                freq = len(matches)
                if canonical not in found_keywords:
                    found_keywords[canonical] = {
                        "term": canonical,
                        "display_name": term.title() if len(term) > 3 else term.upper(),
                        "category": category,
                        "frequency": freq,
                        "positions": [m.start() for m in matches]
                    }
                    category_counts[category] += 1
                else:
                    found_keywords[canonical]["frequency"] += freq

    return {
        "keywords": list(found_keywords.values()),
        "keyword_map": found_keywords,
        "category_counts": dict(category_counts),
        "total_unique_keywords": len(found_keywords)
    }
