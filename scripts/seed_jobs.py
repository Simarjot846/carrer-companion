import sys
import os
from pathlib import Path

# Ensure root directory is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models import JobPosting
from app.services.embedding_service import get_embedding
from app.services.vector_store import prepare_job_text_for_embedding

# Raw synthetic job postings data across 8 domain verticals (20 postings each = 160 total)
RAW_JOB_POSTINGS = [
    # ----------------------------------------------------
    # 1. SOFTWARE ENGINEERING (BACKEND & FULLSTACK) - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Software Engineering Intern - Backend",
        "company": "CloudScale Systems",
        "description": "Join our distributed infrastructure team to build high-throughput microservices handling millions of API requests daily. You will design REST and gRPC endpoints, optimize PostgreSQL database queries, and write async Python/Go services. Experience with cloud environments and CI/CD pipelines is a plus.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs", "Git"],
        "experience_level": "Internship",
        "location": "San Francisco, CA (Hybrid)",
        "posting_type": "internship",
    },
    {
        "title": "Backend Engineering Intern",
        "company": "FinPulse Tech",
        "description": "FinPulse is looking for a Backend Engineer Intern to help build secure, low-latency transaction processing systems. You will work with Python, PostgreSQL, Redis caching, and Kafka messaging. Strong understanding of data structures, algorithms, and SQL query optimization is expected.",
        "required_skills": ["Python", "Django", "PostgreSQL", "Redis", "Kafka", "SQL"],
        "experience_level": "Internship",
        "location": "New York, NY",
        "posting_type": "internship",
    },
    {
        "title": "Full Stack Software Developer Intern",
        "company": "DevSphere Labs",
        "description": "We are seeking a Full Stack Intern eager to work on React frontend components and Node.js / Python backend microservices. You will build user-facing features, implement state management, and integrate third-party APIs.",
        "required_skills": ["TypeScript", "React", "Node.js", "Express", "MongoDB", "REST APIs"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Backend Developer",
        "company": "NextGen Logistics",
        "description": "NextGen Logistics is hiring an entry-level Backend Developer to maintain supply chain API gateways. Responsibilities include building scalable services using Go and PostgreSQL, writing automated integration tests, and containerizing applications with Docker.",
        "required_skills": ["Go", "PostgreSQL", "Docker", "Kubernetes", "gRPC", "Linux"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "API & Infrastructure Engineering Intern",
        "company": "Apiary Cloud",
        "description": "Work on core cloud gateway services powering modern developer tools. You will implement middleware, rate-limiting algorithms, OAuth authentication flows, and automated deployment pipelines.",
        "required_skills": ["Python", "FastAPI", "OAuth2", "Redis", "Docker", "AWS"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Full Stack Developer Intern - Python/React",
        "company": "HealthTrack AI",
        "description": "HealthTrack is building digital healthcare dashboards for medical professionals. As a Full Stack Intern, you will develop React interfaces and FastAPI endpoints for real-time patient data monitoring.",
        "required_skills": ["Python", "FastAPI", "React", "JavaScript", "SQLAlchemy", "Tailwind CSS"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Distributed Systems Intern",
        "company": "DataStream Networks",
        "description": "Build high-speed stream processing infrastructure using Rust and C++. You will work on network protocols, memory management, and distributed Consensus algorithms for realtime telemetry data.",
        "required_skills": ["C++", "Rust", "Distributed Systems", "Networking", "Multithreading", "Linux"],
        "experience_level": "Internship",
        "location": "San Jose, CA",
        "posting_type": "internship",
    },
    {
        "title": "Software Developer Intern - Microservices",
        "company": "Apex E-Commerce",
        "description": "Help modernize our e-commerce platform by decomposing legacy systems into modern cloud microservices using Java Spring Boot and PostgreSQL.",
        "required_skills": ["Java", "Spring Boot", "PostgreSQL", "JUnit", "Docker", "Git"],
        "experience_level": "Internship",
        "location": "Chicago, IL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Python Developer",
        "company": "SaaSFlow",
        "description": "SaaSFlow seeks a Junior Python Developer to build background job queues, webhook integrations, and automated workflow engines using Python, Celery, and PostgreSQL.",
        "required_skills": ["Python", "Celery", "Redis", "PostgreSQL", "Flask", "Pytest"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Backend Platform Engineering Intern",
        "company": "VaporDB",
        "description": "Build internal developer platform tools, CI/CD runners, and automated testing utilities using Go and Python.",
        "required_skills": ["Go", "Python", "Docker", "GitHub Actions", "Linux", "Bash"],
        "experience_level": "Internship",
        "location": "Denver, CO",
        "posting_type": "internship",
    },
    {
        "title": "Cloud Software Engineering Intern",
        "company": "SkyHigh Cloud",
        "description": "Collaborate with senior cloud architects to manage AWS resources using Terraform, write serverless AWS Lambda functions in Node.js/Python, and monitor server metrics.",
        "required_skills": ["AWS", "Terraform", "Python", "Lambda", "CloudWatch", "Docker"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Database Engineering Intern",
        "company": "RelationalIQ",
        "description": "Focus on database optimization, index tuning, migration scripting, and implementing vector search indexing in PostgreSQL using pgvector.",
        "required_skills": ["PostgreSQL", "SQL", "Database Design", "pgvector", "Python", "Performance Tuning"],
        "experience_level": "Internship",
        "location": "Atlanta, GA",
        "posting_type": "internship",
    },
    {
        "title": "Full Stack Developer - Entry Level",
        "company": "OmniApp Solutions",
        "description": "Develop web applications for enterprise clients using React, TypeScript, GraphQL, and Python backends.",
        "required_skills": ["React", "TypeScript", "GraphQL", "Python", "PostgreSQL", "CSS"],
        "experience_level": "Entry Level",
        "location": "Raleigh, NC",
        "posting_type": "full-time",
    },
    {
        "title": "Backend Operations & Security Intern",
        "company": "SecureNet Ops",
        "description": "Audit API endpoints, implement rate limiting, manage JWT authentication, and secure database access in microservices architecture.",
        "required_skills": ["Python", "FastAPI", "JWT", "Cybersecurity", "PostgreSQL", "Linux"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Fullstack Engineer - Next.js/Node",
        "company": "HyperLaunch",
        "description": "Build high-conversion SaaS web apps using Next.js, Node.js, Prisma ORM, and Tailwind CSS. Fast-paced startup environment.",
        "required_skills": ["Next.js", "React", "TypeScript", "Node.js", "Prisma", "Tailwind CSS"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Software Engineering Intern - Web Services",
        "company": "OmniCloud Tech",
        "description": "Develop RESTful APIs, manage DB schema migrations, and write clean unit tests using Python FastAPI and Pytest.",
        "required_skills": ["Python", "FastAPI", "SQLAlchemy", "Pytest", "PostgreSQL", "Git"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Go Backend Engineer",
        "company": "StreamFast",
        "description": "Maintain real-time video streaming control APIs using Go, gRPC, and Redis cache clusters.",
        "required_skills": ["Go", "gRPC", "Redis", "Docker", "Microservices", "Protobuf"],
        "experience_level": "Entry Level",
        "location": "Los Angeles, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Software Engineer Intern - Python/Django",
        "company": "EduLearn Tech",
        "description": "Build educational tools and API endpoints powering thousands of virtual classrooms nationwide.",
        "required_skills": ["Python", "Django", "PostgreSQL", "HTML/CSS", "JavaScript", "Git"],
        "experience_level": "Internship",
        "location": "Austin, TX",
        "posting_type": "internship",
    },
    {
        "title": "Junior Cloud Infrastructure Engineer",
        "company": "InfraStack",
        "description": "Manage Kubernetes clusters, deploy Ansible automation playbooks, and maintain infrastructure monitoring.",
        "required_skills": ["Kubernetes", "Docker", "Ansible", "Linux", "Python", "Bash"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Software Test & QA Engineering Intern",
        "company": "QualityFirst Labs",
        "description": "Write automated API tests, E2E test suites with Cypress/Playwright, and integrate tests into CI/CD pipelines.",
        "required_skills": ["Python", "Pytest", "Selenium", "Playwright", "Postman", "CI/CD"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },

    # ----------------------------------------------------
    # 2. FRONTEND & MOBILE DEVELOPMENT - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Frontend Engineering Intern - React",
        "company": "PixelCraft Studios",
        "description": "Create responsive, accessible, and fast web applications using React, TypeScript, and Tailwind CSS. You will collaborate closely with UI/UX designers to bring wireframes to life.",
        "required_skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5", "CSS3", "Git"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Frontend Developer",
        "company": "UiVision Tech",
        "description": "UiVision is hiring a Junior Frontend Developer to build user interfaces for enterprise analytics. Experience with React state management (Zustand/Redux) and REST/GraphQL APIs is required.",
        "required_skills": ["React", "TypeScript", "Redux", "REST APIs", "Tailwind CSS", "Jest"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Mobile App Development Intern - iOS/Swift",
        "company": "AppVentures",
        "description": "Join our iOS product team building native Swift apps using SwiftUI and Combine. You will design slick client features, consume JSON APIs, and implement offline storage.",
        "required_skills": ["Swift", "SwiftUI", "iOS", "Xcode", "REST APIs", "Git"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Mobile App Developer Intern - Flutter / Cross-Platform",
        "company": "CrossMobile Labs",
        "description": "Build mobile applications for iOS and Android using Flutter and Dart. Collaborate with backend engineers to integrate state management and push notifications.",
        "required_skills": ["Flutter", "Dart", "Mobile Development", "REST APIs", "Firebase", "Git"],
        "experience_level": "Internship",
        "location": "Austin, TX",
        "posting_type": "internship",
    },
    {
        "title": "Frontend UI/UX Developer Intern",
        "company": "DesignByte Media",
        "description": "Bridge the gap between design and front-end code. Implement pixel-perfect designs in Vue.js / React with Tailwind CSS and Framer Motion animations.",
        "required_skills": ["React", "Vue.js", "JavaScript", "Tailwind CSS", "Figma", "CSS Animations"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Junior React Native Developer",
        "company": "PulseApp Corp",
        "description": "Build cross-platform mobile apps using React Native, Expo, and TypeScript for health tracking users.",
        "required_skills": ["React Native", "TypeScript", "JavaScript", "Redux", "Mobile UI", "REST APIs"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Frontend Web Intern - Next.js & Web Performance",
        "company": "SpeedWeb Digital",
        "description": "Focus on web performance optimization, Core Web Vitals, server-side rendering, and SEO using Next.js and React.",
        "required_skills": ["Next.js", "React", "TypeScript", "Web Performance", "Lighthouse", "CSS"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Android Developer Intern",
        "company": "DroidWorks",
        "description": "Build modern native Android applications using Kotlin, Jetpack Compose, Coroutines, and Retrofit.",
        "required_skills": ["Kotlin", "Android SDK", "Jetpack Compose", "Coroutines", "REST APIs", "Git"],
        "experience_level": "Internship",
        "location": "Chicago, IL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Web UI Engineer",
        "company": "SaaSify UI",
        "description": "Construct reusable React component libraries and design tokens for multi-tenant SaaS dashboards.",
        "required_skills": ["React", "TypeScript", "Storybook", "Tailwind CSS", "Design Systems", "Jest"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Frontend Accessibility Engineering Intern",
        "company": "A11y Tech Solutions",
        "description": "Audit and improve web accessibility (WCAG 2.1 AA standards) across client websites using HTML5 semantics, ARIA attributes, and React.",
        "required_skills": ["HTML5", "CSS3", "JavaScript", "React", "WCAG", "Accessibility testing"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Frontend Developer - Vue.js",
        "company": "ClearView Media",
        "description": "Maintain Vue 3 single page applications with Pinia state management and Vuetify components.",
        "required_skills": ["Vue.js", "JavaScript", "TypeScript", "HTML/CSS", "Pinia", "REST APIs"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Interactive Frontend Developer Intern",
        "company": "Canvas interactive",
        "description": "Develop 3D graphics, canvas visualizer tools, and interactive charts using Three.js, D3.js, and React.",
        "required_skills": ["Three.js", "D3.js", "JavaScript", "React", "Canvas API", "WebGL"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Mobile Developer - iOS",
        "company": "MobileFirst Global",
        "description": "Support iOS app development, bug fixing, app submission pipelines, and SwiftUI UI building.",
        "required_skills": ["Swift", "SwiftUI", "CoreData", "Git", "REST APIs", "iOS Development"],
        "experience_level": "Entry Level",
        "location": "San Francisco, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Frontend Developer Intern - E-Commerce",
        "company": "ShopSmart Technologies",
        "description": "Customize storefronts, shopping cart components, and checkout flows using React, Next.js, and GraphQL.",
        "required_skills": ["React", "Next.js", "GraphQL", "Tailwind CSS", "JavaScript", "Git"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Web Developer Intern - HTML/CSS/JS",
        "company": "BrightAgency",
        "description": "Build high-converting landing pages and marketing websites using HTML5, modern CSS, JavaScript, and CMS platforms.",
        "required_skills": ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Git", "Figma"],
        "experience_level": "Internship",
        "location": "Miami, FL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Frontend Engineer - Microfrontends",
        "company": "Enterprise Cloud Systems",
        "description": "Work on micro-frontend architectures using Module Federation, React, and TypeScript.",
        "required_skills": ["React", "TypeScript", "Webpack", "JavaScript", "CSS Modules", "Git"],
        "experience_level": "Entry Level",
        "location": "San Jose, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Mobile Software Intern - Android",
        "company": "ConnectApp",
        "description": "Help develop Android social networking features in Kotlin with Room database and MVVM architecture.",
        "required_skills": ["Kotlin", "Android", "MVVM", "Room DB", "REST APIs", "Git"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Design Systems Engineer",
        "company": "Unify UI",
        "description": "Maintain React components, typography tokens, color systems, and documentation for internal design teams.",
        "required_skills": ["React", "TypeScript", "Tailwind CSS", "Figma", "Storybook", "CSS"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Frontend Web Intern - Data Visualizations",
        "company": "ChartMatrix",
        "description": "Build interactive charts, heatmaps, and financial graphs using React and Recharts/Chart.js.",
        "required_skills": ["React", "TypeScript", "Chart.js", "D3.js", "JavaScript", "Tailwind CSS"],
        "experience_level": "Internship",
        "location": "New York, NY",
        "posting_type": "internship",
    },
    {
        "title": "Junior React Developer",
        "company": "GrowthStack",
        "description": "Develop web features, perform UI bug fixes, and integrate analytics tools into modern React web apps.",
        "required_skills": ["React", "JavaScript", "HTML/CSS", "Git", "REST APIs", "Tailwind CSS"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },

    # ----------------------------------------------------
    # 3. DATA SCIENCE & DATA ENGINEERING - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Data Science Intern - Analytics & Insights",
        "company": "DataFlow Analytics",
        "description": "Analyze business metrics, perform user segmentation, build predictive models, and write SQL queries for BI dashboards. Work directly with product management to answer data-driven strategic questions.",
        "required_skills": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Matplotlib", "Data Analysis"],
        "experience_level": "Internship",
        "location": "New York, NY",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data Scientist",
        "company": "InsightIQ",
        "description": "InsightIQ is seeking a Junior Data Scientist to develop statistical regression models, automated ETL workflows, and customer churn prediction pipelines using Python and SQL.",
        "required_skills": ["Python", "SQL", "Pandas", "Scikit-Learn", "Statsmodels", "Tableau", "Git"],
        "experience_level": "Entry Level",
        "location": "San Francisco, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Data Engineering Intern",
        "company": "StreamData Labs",
        "description": "Build batch and streaming data pipelines using Apache Spark, Airflow, and Snowflake. You will transform raw event logs into structured analytical data marts.",
        "required_skills": ["Python", "SQL", "Apache Spark", "Airflow", "Snowflake", "ETL", "PostgreSQL"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Business Intelligence & Data Analyst Intern",
        "company": "MetricPulse",
        "description": "Design interactive PowerBI and Tableau dashboards, extract data from PostgreSQL/BigQuery, and write Python automated reporting scripts.",
        "required_skills": ["SQL", "Python", "Tableau", "PowerBI", "PostgreSQL", "Excel", "Data Visualization"],
        "experience_level": "Internship",
        "location": "Chicago, IL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data Engineer",
        "company": "BigData Cloud",
        "description": "Maintain data warehouses in AWS Redshift and BigQuery, orchestrate Airflow DAGs, and ensure data quality controls across enterprise datasets.",
        "required_skills": ["Python", "SQL", "Airflow", "AWS Redshift", "BigQuery", "Docker", "Git"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Product Data Science Intern",
        "company": "UserMetrics Tech",
        "description": "Perform A/B test analysis, funnel optimization studies, and statistical significance testing for consumer mobile applications.",
        "required_skills": ["Python", "SQL", "A/B Testing", "Statistics", "Pandas", "Seaborn"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data Analyst",
        "company": "FinData Analytics",
        "description": "Support financial quantitative modeling, query transactional SQL databases, and build weekly executive report summaries.",
        "required_skills": ["SQL", "Python", "Excel", "Pandas", "Financial Modeling", "PowerBI"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Data Pipeline Engineering Intern",
        "company": "DataPipe Corp",
        "description": "Construct scalable ETL pipelines using PySpark, Kafka, and dbt (data build tool) on PostgreSQL and Databricks.",
        "required_skills": ["Python", "PySpark", "SQL", "dbt", "PostgreSQL", "Docker"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Quantitative Analytics Intern",
        "company": "AlphaCapital Research",
        "description": "Develop quantitative trading strategies, backtest time-series metrics, and clean market financial data using Python and Pandas.",
        "required_skills": ["Python", "Pandas", "NumPy", "Statistics", "Time-Series Analysis", "SQL"],
        "experience_level": "Internship",
        "location": "Chicago, IL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Analytics Engineer",
        "company": "ModernData Stack",
        "description": "Transform data warehouse schemas using dbt, write SQL models, and build reliable semantic layers for reporting teams.",
        "required_skills": ["SQL", "dbt", "Snowflake", "Python", "Git", "Data Modeling"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Data Science Research Intern",
        "company": "HealthData Analytics",
        "description": "Analyze genomic and electronic health record datasets using statistical classification models and Python.",
        "required_skills": ["Python", "R", "SQL", "Pandas", "Scikit-Learn", "Statistics"],
        "experience_level": "Internship",
        "location": "Atlanta, GA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data Platform Engineer",
        "company": "CloudWarehouse",
        "description": "Maintain data streaming platforms, manage PostgreSQL database indexing, and write data ingestion microservices in Python.",
        "required_skills": ["Python", "SQL", "PostgreSQL", "Kafka", "Docker", "Linux"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Marketing Analytics Intern",
        "company": "GrowthData Media",
        "description": "Measure marketing campaign ROI, attribution models, and customer acquisition costs using Google Analytics and SQL.",
        "required_skills": ["SQL", "Python", "Google Analytics", "Excel", "Data Analysis", "Tableau"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data Quality Engineer",
        "company": "CleanData Systems",
        "description": "Implement data validation frameworks using Great Expectations, write SQL tests, and monitor data warehouse anomalies.",
        "required_skills": ["Python", "SQL", "Great Expectations", "Pytest", "Data Governance", "Git"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Data Visualization Engineering Intern",
        "company": "VizLabs",
        "description": "Combine frontend React skills with data analysis to build custom interactive chart dashboards and data stories.",
        "required_skills": ["Python", "SQL", "React", "D3.js", "Pandas", "Data Visualization"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Operations Data Analyst",
        "company": "LogiAnalytics",
        "description": "Analyze fleet routing metrics, supply chain inventory, and warehouse fulfillment data using SQL and Python.",
        "required_skills": ["SQL", "Python", "Pandas", "Excel", "Data Analysis", "PowerBI"],
        "experience_level": "Entry Level",
        "location": "Dallas, TX",
        "posting_type": "full-time",
    },
    {
        "title": "AI & Big Data Analyst Intern",
        "company": "CognitiveData",
        "description": "Extract features from unstructured data logs, process text data using NLTK/Spacy, and assist data science research.",
        "required_skills": ["Python", "SQL", "NLP", "Pandas", "Scikit-Learn", "Jupyter"],
        "experience_level": "Internship",
        "location": "San Jose, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior ETL Developer",
        "company": "EnterpriseData Inc",
        "description": "Write automated Python scripts and SQL store procedures to migrate legacy client databases into cloud storage.",
        "required_skills": ["Python", "SQL", "PostgreSQL", "ETL", "Linux", "Git"],
        "experience_level": "Entry Level",
        "location": "Raleigh, NC",
        "posting_type": "full-time",
    },
    {
        "title": "Spatial & Geospatial Data Intern",
        "company": "GeoInsight Tech",
        "description": "Process GIS mapping data, shapefiles, and satellite imagery using GeoPandas, PostGIS, and Python.",
        "required_skills": ["Python", "SQL", "PostGIS", "GeoPandas", "QGIS", "Data Analysis"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Data Scientist Intern - Recommendation Systems",
        "company": "MediaStream AI",
        "description": "Help build collaborative filtering and content-based recommendation algorithms for video streaming users.",
        "required_skills": ["Python", "SQL", "Scikit-Learn", "PyTorch", "Pandas", "Algorithms"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },

    # ----------------------------------------------------
    # 4. MACHINE LEARNING & AI - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Machine Learning Research Intern",
        "company": "MindGrid AI Labs",
        "description": "MindGrid AI is looking for an ML Research Intern to work on large language model fine-tuning, retrieval-augmented generation (RAG) architectures, and vector embeddings. Candidates should be comfortable with PyTorch, Transformers, and vector databases.",
        "required_skills": ["Python", "PyTorch", "Hugging Face", "Transformers", "RAG", "Vector Databases", "pgvector"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Machine Learning Engineer",
        "company": "NeuralScale",
        "description": "Deploy machine learning models to production REST endpoints. Responsibilities include model quantization, latency optimization, Docker containerization, and building MLOps pipelines using MLflow and FastAPI.",
        "required_skills": ["Python", "PyTorch", "FastAPI", "Docker", "MLflow", "Scikit-Learn", "ONNX"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Computer Vision Engineering Intern",
        "company": "VisionTech AI",
        "description": "Develop object detection and image segmentation algorithms using PyTorch, OpenCV, and YOLO for autonomous inspection systems.",
        "required_skills": ["Python", "PyTorch", "OpenCV", "Computer Vision", "Deep Learning", "C++"],
        "experience_level": "Internship",
        "location": "Austin, TX",
        "posting_type": "internship",
    },
    {
        "title": "NLP & Generative AI Intern",
        "company": "TextMind AI",
        "description": "Experiment with LLM prompt engineering, LangChain/LlamaIndex pipelines, fine-tuning open-source models (Llama 3/Mistral), and evaluating model benchmarks.",
        "required_skills": ["Python", "LangChain", "LLMs", "PyTorch", "Transformers", "RAG", "FastAPI"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior MLOps Engineer",
        "company": "DeployML Systems",
        "description": "Maintain model training pipelines, automated evaluation suites, Kubernetes deployments, and feature store architectures.",
        "required_skills": ["Python", "Kubernetes", "Docker", "MLflow", "Kubeflow", "AWS", "Git"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "AI Product Engineering Intern",
        "company": "Synthetix AI",
        "description": "Integrate LLM API workflows (Claude / OpenAI) into web software products, manage prompt templates, and construct vector search indexes.",
        "required_skills": ["Python", "FastAPI", "LLM APIs", "Vector Search", "PostgreSQL", "React"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Deep Learning Research Intern",
        "company": "DeepCore Labs",
        "description": "Research novel neural network architectures, attention mechanisms, and optimization techniques for speech and audio recognition.",
        "required_skills": ["Python", "PyTorch", "TensorFlow", "Deep Learning", "Mathematics", "Git"],
        "experience_level": "Internship",
        "location": "San Jose, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Applied Scientist - ML",
        "company": "SearchAI Inc",
        "description": "Improve semantic search relevance algorithms, train learning-to-rank models, and generate text embeddings.",
        "required_skills": ["Python", "Scikit-Learn", "PyTorch", "Search Algorithms", "Information Retrieval", "SQL"],
        "experience_level": "Entry Level",
        "location": "San Francisco, CA",
        "posting_type": "full-time",
    },
    {
        "title": "AI Systems & Acceleration Intern",
        "company": "SiliconAI Tech",
        "description": "Optimize Deep Learning inference models on GPUs and edge devices using TensorRT and CUDA C++.",
        "required_skills": ["C++", "CUDA", "Python", "TensorRT", "Deep Learning", "Linux"],
        "experience_level": "Internship",
        "location": "Santa Clara, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior ML Engineer - Audio & Speech",
        "company": "VoiceWave AI",
        "description": "Develop speech recognition and text-to-speech AI models using Whisper and custom PyTorch architectures.",
        "required_skills": ["Python", "PyTorch", "Librosa", "Speech Recognition", "Docker", "FastAPI"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "AI Ethics & Safety Research Intern",
        "company": "AlignAI Institute",
        "description": "Evaluate safety, bias, and red-teaming datasets for large foundation models. Conduct empirical experiments in Python.",
        "required_skills": ["Python", "Transformers", "NLP", "Statistics", "Data Analysis", "Research"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Machine Learning Engineer - Fraud Detection",
        "company": "SecurePay AI",
        "description": "Build real-time anomaly detection models and risk scoring algorithms using XGBoost, Scikit-learn, and Kafka.",
        "required_skills": ["Python", "XGBoost", "Scikit-Learn", "SQL", "Kafka", "Docker"],
        "experience_level": "Entry Level",
        "location": "Chicago, IL",
        "posting_type": "full-time",
    },
    {
        "title": "Generative AI Developer Intern",
        "company": "CreateAI Studio",
        "description": "Build generative image and synthetic text pipelines using Stable Diffusion, ComfyUI, PyTorch, and FastAPI.",
        "required_skills": ["Python", "PyTorch", "Diffusers", "FastAPI", "Docker", "REST APIs"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Vector DB & Search Engineer",
        "company": "VectorQuery",
        "description": "Maintain vector database indexing algorithms (HNSW, IVFFlat) using pgvector and Python backend APIs.",
        "required_skills": ["Python", "PostgreSQL", "pgvector", "Vector Databases", "C++", "Algorithms"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Reinforcement Learning Intern",
        "company": "RoboDynamics AI",
        "description": "Train RL agents for simulation environments using Gymnasium, Ray RLlib, and PyTorch.",
        "required_skills": ["Python", "PyTorch", "Reinforcement Learning", "Gymnasium", "Robotics", "Linux"],
        "experience_level": "Internship",
        "location": "Pittsburgh, PA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Data & Machine Learning Engineer",
        "company": "SmartInsights",
        "description": "Combine data engineering pipelines with ML model training routines using Python, SQL, and Scikit-learn.",
        "required_skills": ["Python", "SQL", "Scikit-Learn", "Pandas", "Docker", "PostgreSQL"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Autonomous Driving Perception Intern",
        "company": "AutoDrive Systems",
        "description": "Process LiDAR 3D point cloud data and camera sensor streams for object classification using PyTorch.",
        "required_skills": ["C++", "Python", "PyTorch", "OpenCV", "ROS", "Computer Vision"],
        "experience_level": "Internship",
        "location": "Detroit, MI",
        "posting_type": "internship",
    },
    {
        "title": "Junior NLP Engineer - Document AI",
        "company": "DocuParse AI",
        "description": "Build named entity recognition (NER) and OCR extraction models for legal and financial document parsing.",
        "required_skills": ["Python", "Spacy", "Transformers", "PyMuPDF", "OCR", "FastAPI"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "ML Infrastructure Intern",
        "company": "ScaleTrain AI",
        "description": "Support distributed multi-GPU training clusters with PyTorch FSDP and DeepSpeed in cloud environments.",
        "required_skills": ["Python", "PyTorch", "CUDA", "Linux", "Docker", "Distributed Systems"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Machine Learning Engineer - Personalization",
        "company": "ShopMatch AI",
        "description": "Train real-time product matching and ranking algorithms for retail e-commerce clients.",
        "required_skills": ["Python", "Scikit-Learn", "PyTorch", "SQL", "FastAPI", "Redis"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },

    # ----------------------------------------------------
    # 5. PRODUCT MANAGEMENT & PRODUCT ANALYTICS - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Associate Product Manager Intern (APM)",
        "company": "ProductCraft",
        "description": "Work alongside Senior Product Managers to define product requirements (PRDs), run user feedback interviews, prioritize engineering backlogs, and track key engagement metrics.",
        "required_skills": ["Product Management", "User Research", "Agile", "Jira", "Data Analysis", "SQL"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Technical Product Management Intern",
        "company": "CloudAPI Platforms",
        "description": "Bridge developer requirements with engineering delivery. Define API specifications, review technical architecture, and analyze developer usage telemetry.",
        "required_skills": ["Product Management", "REST APIs", "SQL", "Technical Writing", "Agile", "Git"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Manager",
        "company": "SaaSify Inc",
        "description": "Drive feature execution for our B2B SaaS platform. Coordinate cross-functional design and engineering sprints, conduct market research, and manage product roadmaps.",
        "required_skills": ["Product Management", "Product Strategy", "Roadmapping", "Mixpanel", "SQL", "Wireframing"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "AI Product Management Intern",
        "company": "FutureAI Products",
        "description": "Help shape user experiences for AI-powered productivity tools. Define acceptance criteria for LLM feature accuracy and conduct usability testing.",
        "required_skills": ["Product Management", "AI/ML Concepts", "User Research", "Prototyping", "SQL"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Growth Product Intern",
        "company": "ViralApp Media",
        "description": "Run onboarding optimization experiments, user activation funnels, and referral growth loops using analytics software.",
        "required_skills": ["Product Management", "A/B Testing", "Mixpanel", "Google Analytics", "SQL", "Growth Hacking"],
        "experience_level": "Internship",
        "location": "Austin, TX",
        "posting_type": "internship",
    },
    {
        "title": "Junior Technical Product Specialist",
        "company": "DevTools Global",
        "description": "Support technical product demonstrations, gather user feedback from developer forums, and triage bug reports for engineering teams.",
        "required_skills": ["Technical Writing", "Product Management", "SQL", "API Documentation", "Jira"],
        "experience_level": "Entry Level",
        "location": "Boston, MA",
        "posting_type": "full-time",
    },
    {
        "title": "Product Operations Intern",
        "company": "ScaleOps",
        "description": "Streamline release notes, optimize customer support feedback loops, and maintain product documentation hubs.",
        "required_skills": ["Product Operations", "Notion", "Jira", "Data Analysis", "Communication", "Excel"],
        "experience_level": "Internship",
        "location": "Denver, CO",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Manager - Mobile Apps",
        "company": "MobilityTech",
        "description": "Own feature backlogs for iOS/Android apps, monitor App Store reviews, and collaborate with UI designers on mobile interaction flows.",
        "required_skills": ["Product Management", "Mobile UX", "App Store Analytics", "Agile", "Figma"],
        "experience_level": "Entry Level",
        "location": "Chicago, IL",
        "posting_type": "full-time",
    },
    {
        "title": "Data Product Manager Intern",
        "company": "DataHub Systems",
        "description": "Define requirements for internal data warehouses, ETL pipelines, and reporting dashboards used by executive stakeholders.",
        "required_skills": ["Product Management", "SQL", "Data Warehousing", "Business Intelligence", "Agile"],
        "experience_level": "Internship",
        "location": "San Jose, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Associate Product Manager",
        "company": "FintechDirect",
        "description": "Help design consumer digital payment features, track compliance requirements, and manage customer journey mapping.",
        "required_skills": ["Product Management", "User Journey Mapping", "Fintech", "SQL", "Jira"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Product Strategy & Design Intern",
        "company": "InnoLab Studios",
        "description": "Conduct competitive teardowns, market benchmarking, and prototype new SaaS feature concepts in Figma.",
        "required_skills": ["Product Strategy", "Figma", "Competitive Analysis", "User Research", "Prototyping"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Platform Product Manager",
        "company": "InfraPlatform",
        "description": "Manage internal developer platform tool requirements, authentication services, and developer experience metrics.",
        "required_skills": ["Product Management", "Developer Experience", "APIs", "Agile", "Jira"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "Consumer Product Intern",
        "company": "SocialConnect",
        "description": "Collaborate with engineering teams on social feed algorithms, content creation tools, and notification strategies.",
        "required_skills": ["Product Management", "User Psychology", "A/B Testing", "SQL", "Wireframing"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior E-Commerce Product Manager",
        "company": "RetailNext",
        "description": "Manage checkout conversion optimization, payment gateway integrations, and product search discovery features.",
        "required_skills": ["Product Management", "E-Commerce", "Google Analytics", "A/B Testing", "SQL"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "Healthcare Product Management Intern",
        "company": "CarePulse Tech",
        "description": "Define patient-facing telemetry workflows, compliance features (HIPAA), and doctor dashboard usability.",
        "required_skills": ["Product Management", "Healthcare Tech", "User Interviews", "PRD Writing", "Agile"],
        "experience_level": "Internship",
        "location": "Atlanta, GA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Analyst",
        "company": "SaaSMetrics",
        "description": "Perform deep product usage cohort analysis, track retention metrics (DAU/MAU), and create product dashboards.",
        "required_skills": ["SQL", "Mixpanel", "Amplitude", "Data Analysis", "Product Analytics", "Python"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "B2B SaaS Product Intern",
        "company": "WorkFlow Hub",
        "description": "Gather feedback from enterprise customer success calls, refine product specifications, and draft release notes.",
        "required_skills": ["Product Management", "B2B SaaS", "Customer Research", "Jira", "User Stories"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior UX Product Specialist",
        "company": "UserFirst Labs",
        "description": "Work at the intersection of UX design and product management, conducting usability tests and creating interactive mockups.",
        "required_skills": ["Figma", "User Testing", "Product Management", "Wireframing", "UI/UX"],
        "experience_level": "Entry Level",
        "location": "Raleigh, NC",
        "posting_type": "full-time",
    },
    {
        "title": "Product Marketing & PM Intern",
        "company": "LaunchPad Tech",
        "description": "Assist with feature launch campaigns, product positioning guides, user onboarding guides, and customer webinars.",
        "required_skills": ["Product Marketing", "Product Management", "Content Strategy", "Communication", "Figma"],
        "experience_level": "Internship",
        "location": "Miami, FL",
        "posting_type": "internship",
    },
    {
        "title": "Junior Technical APM",
        "company": "CloudServices Corp",
        "description": "Assist technical lead managers in tracking milestone deliverables, writing user stories, and evaluating cloud tool integration APIs.",
        "required_skills": ["Product Management", "Technical Writing", "Agile", "Scrum", "APIs", "SQL"],
        "experience_level": "Entry Level",
        "location": "Washington, DC",
        "posting_type": "full-time",
    },

    # ----------------------------------------------------
    # 6. UI/UX DESIGN & PRODUCT DESIGN - 20 jobs
    # ----------------------------------------------------
    {
        "title": "UI/UX Design Intern",
        "company": "Studio Interface",
        "description": "Create intuitive wireframes, interactive Figma prototypes, user personas, and visual design layouts for mobile and web apps. Conduct usability sessions and iterate on user feedback.",
        "required_skills": ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "User Research", "Design Systems"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Designer",
        "company": "DesignFlow",
        "description": "Design end-to-end user experiences for enterprise SaaS dashboards. Build responsive components in Figma, maintain design system libraries, and present design concepts to product managers.",
        "required_skills": ["Figma", "Product Design", "Design Systems", "User Testing", "Prototyping", "HTML/CSS"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "UX Research Intern",
        "company": "UserInsight Labs",
        "description": "Conduct qualitative user interviews, usability testing sessions, card sorting exercises, and compile research synthesis reports for design teams.",
        "required_skills": ["User Research", "Usability Testing", "User Interviews", "Figma", "Qualitative Analysis"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Visual & Motion Design Intern",
        "company": "CreativePulse",
        "description": "Design graphic assets, UI micro-interactions, vector illustrations, and motion animations for digital brand campaigns.",
        "required_skills": ["Figma", "Adobe Illustrator", "After Effects", "Motion Design", "Visual Design"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Mobile UI Designer",
        "company": "AppCraft Studios",
        "description": "Design mobile screens for iOS and Android adhering to Apple Human Interface Guidelines and Material Design 3.",
        "required_skills": ["Figma", "Mobile Design", "iOS Design", "Material Design", "Prototyping"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Design Systems Intern",
        "company": "ComponentHub",
        "description": "Help curate component tokens, icon sets, accessibility standards, and design documentation in Figma and Storybook.",
        "required_skills": ["Figma", "Design Systems", "Accessibility", "Tokens", "HTML/CSS"],
        "experience_level": "Internship",
        "location": "Seattle, WA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Web Designer",
        "company": "PixelPerfect Agency",
        "description": "Craft landing pages, responsive layouts, and marketing assets for tech startups using Figma and Webflow.",
        "required_skills": ["Figma", "Webflow", "HTML/CSS", "Responsive Design", "Typography"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "UX Writer & Content Designer Intern",
        "company": "TextDesign Media",
        "description": "Craft clear product microcopy, onboarding flows, tooltips, error messages, and navigation labels for web software.",
        "required_skills": ["UX Writing", "Content Strategy", "Figma", "Microcopy", "User Research"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Design Engineer",
        "company": "FrontEnd Art",
        "description": "Bridge design and frontend code by crafting pixel-perfect React components and CSS animations directly from Figma files.",
        "required_skills": ["Figma", "React", "Tailwind CSS", "HTML5/CSS3", "JavaScript", "Design Systems"],
        "experience_level": "Entry Level",
        "location": "San Jose, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Accessibility & Inclusive UX Intern",
        "company": "AccessDesign",
        "description": "Test design prototypes with screen readers, ensure WCAG color contrast ratios, and design accessible keyboard navigation states.",
        "required_skills": ["Figma", "Accessibility (WCAG)", "UX Testing", "Inclusive Design", "User Research"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Designer - Fintech",
        "company": "SecureWallet UI",
        "description": "Simplify complex financial transaction interfaces into intuitive, trustworthy mobile and web UX workflows.",
        "required_skills": ["Figma", "Product Design", "Fintech UX", "Prototyping", "User Journeys"],
        "experience_level": "Entry Level",
        "location": "Chicago, IL",
        "posting_type": "full-time",
    },
    {
        "title": "Interaction Design Intern",
        "company": "MotionUI Studios",
        "description": "Prototype complex micro-interactions, gesture navigation, and interactive animations using ProtoPie and Figma.",
        "required_skills": ["Figma", "ProtoPie", "Interaction Design", "Prototyping", "User Experience"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior UI Designer - E-Commerce",
        "company": "ShopStyle Design",
        "description": "Create high-converting e-commerce product pages, checkout flows, and seasonal promotion banners in Figma.",
        "required_skills": ["Figma", "UI Design", "E-Commerce", "Visual Design", "Banner Design"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Healthcare UX Research Intern",
        "company": "HealthUI Labs",
        "description": "Conduct contextual inquiries and user interviews with clinicians and patients to improve medical software UX.",
        "required_skills": ["User Research", "Usability Testing", "Figma", "Healthcare UX", "Qualitative Research"],
        "experience_level": "Internship",
        "location": "Atlanta, GA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Brand & Product Designer",
        "company": "IdentityCraft",
        "description": "Design brand identity guidelines, logo marks, illustration systems, and UI templates for early-stage software companies.",
        "required_skills": ["Figma", "Illustrator", "Brand Identity", "Visual Design", "Typography"],
        "experience_level": "Entry Level",
        "location": "Remote",
        "posting_type": "full-time",
    },
    {
        "title": "SaaS UX Design Intern",
        "company": "CloudDashboard",
        "description": "Redesign complex data tables, modal dialogs, navigation sidebars, and analytical graphs in Figma.",
        "required_skills": ["Figma", "UI/UX Design", "Wireframing", "SaaS Design", "Prototyping"],
        "experience_level": "Internship",
        "location": "Raleigh, NC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Design Technologist",
        "company": "CreativeCode",
        "description": "Build high-fidelity code prototypes using React, HTML/CSS, and Framer Motion to validate interaction ideas before production development.",
        "required_skills": ["Figma", "React", "HTML/CSS", "Framer Motion", "JavaScript", "Prototyping"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "Mobile Gaming UI Intern",
        "company": "GamePlay UI",
        "description": "Create HUD interfaces, menu screens, inventory icons, and reward popups for mobile casual games.",
        "required_skills": ["Figma", "Photoshop", "Illustrator", "Game UI", "2D Art"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior User Experience Researcher",
        "company": "UserFirst Analytics",
        "description": "Plan and execute unmoderated remote testing, survey analysis, and persona mapping for enterprise software clients.",
        "required_skills": ["User Research", "Usability Testing", "Surveys", "Figma", "Data Synthesis"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Product Design Intern - AI Tools",
        "company": "GenAI Experience",
        "description": "Design clean conversational chat interfaces, prompt control panels, and AI tool generation controls.",
        "required_skills": ["Figma", "UI/UX Design", "AI Interface Design", "Prototyping", "Wireframing"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },

    # ----------------------------------------------------
    # 7. PRODUCT MARKETING & DEV RELATIONS - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Developer Relations (DevRel) Intern",
        "company": "DevPulse Tools",
        "description": "Write technical blog posts, code tutorial repositories, engage with developer communities on Discord/GitHub, and present at virtual tech meetups.",
        "required_skills": ["Python", "JavaScript", "Technical Writing", "Git", "Developer Relations", "Public Speaking"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Product Marketing Intern",
        "company": "GrowthSphere",
        "description": "Assist with go-to-market strategies, competitive matrix updates, sales enablement decks, and feature launch email copy.",
        "required_skills": ["Product Marketing", "Content Strategy", "Market Research", "Copywriting", "Slide Decks"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Technical Writer",
        "company": "DocuTech Systems",
        "description": "Author REST API documentation, developer SDK integration guides, and troubleshooting manuals using Markdown and OpenAPI / Swagger.",
        "required_skills": ["Technical Writing", "Markdown", "OpenAPI", "REST APIs", "Git", "Documentation"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "Developer Evangelist Intern",
        "company": "CloudAPI Global",
        "description": "Build demo applications showcasing our cloud API capabilities, create video tutorials, and answer developer technical questions online.",
        "required_skills": ["Python", "Node.js", "APIs", "Technical Content Creation", "Git", "Community Engagement"],
        "experience_level": "Internship",
        "location": "New York, NY",
        "posting_type": "internship",
    },
    {
        "title": "Junior Product Marketing Manager",
        "company": "SaaSLaunch",
        "description": "Manage positioning, customer case studies, web copy updates, and coordinate product announcements across social channels.",
        "required_skills": ["Product Marketing", "Copywriting", "Market Research", "Google Analytics", "Content Marketing"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Content & Growth Marketing Intern",
        "company": "SEO Growth Media",
        "description": "Research tech keywords, write long-form technical SEO blog articles, and track search traffic metrics using Ahrefs.",
        "required_skills": ["SEO", "Content Writing", "Keyword Research", "Google Analytics", "Copywriting"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Community Manager - Tech",
        "company": "OpenSource Hub",
        "description": "Moderate open-source Discord/Slack communities, organize virtual hackathons, and recognize top contributor pull requests.",
        "required_skills": ["Community Management", "Discord", "GitHub", "Event Planning", "Communication"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Technical Documentation Intern",
        "company": "API Docs Corp",
        "description": "Update developer portal guides, format code snippets in Python/JS, and fix broken documentation links.",
        "required_skills": ["Technical Writing", "Markdown", "Python", "JavaScript", "Git"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Developer Marketer",
        "company": "CodePromote",
        "description": "Run developer-targeted sponsorship campaigns, podcast advertising, and hackathon presence for developer tools.",
        "required_skills": ["Developer Marketing", "Campaign Management", "Content Strategy", "Analytics"],
        "experience_level": "Entry Level",
        "location": "Chicago, IL",
        "posting_type": "full-time",
    },
    {
        "title": "Open Source Advocate Intern",
        "company": "OpenDev Labs",
        "description": "Contribute to open-source developer documentation, build starter templates, and host virtual office hours.",
        "required_skills": ["Git", "GitHub", "Python", "Markdown", "Open Source", "Technical Writing"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Customer Education Specialist",
        "company": "LearnSaaS",
        "description": "Create step-by-step video academy tutorials and knowledge base articles helping users master SaaS product workflows.",
        "required_skills": ["Instructional Design", "Technical Writing", "Video Editing", "Content Creation"],
        "experience_level": "Entry Level",
        "location": "Raleigh, NC",
        "posting_type": "full-time",
    },
    {
        "title": "Product Communications Intern",
        "company": "PressTech",
        "description": "Draft press releases, executive LinkedIn thought-leadership posts, and media pitch notes for tech launch announcements.",
        "required_skills": ["Public Relations", "Copywriting", "Media Relations", "Communication", "Content Strategy"],
        "experience_level": "Internship",
        "location": "San Francisco, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior DevRel Engineer",
        "company": "API Grid",
        "description": "Maintain open-source SDK repositories in Python and TypeScript, write code samples, and help developers debug API errors.",
        "required_skills": ["Python", "TypeScript", "SDK Development", "GitHub", "Technical Support", "REST APIs"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "Social Media & Tech Brand Intern",
        "company": "TechBrand Media",
        "description": "Create short-form video clips, infograph posts, and Twitter tech threads highlighting company engineering breakthroughs.",
        "required_skills": ["Social Media Strategy", "Graphic Design", "Canva/Figma", "Copywriting", "Video Editing"],
        "experience_level": "Internship",
        "location": "Los Angeles, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior GTM Product Marketer",
        "company": "MarketScale",
        "description": "Develop buyer personas, competitive battlecards, pricing page strategy, and email campaign workflows.",
        "required_skills": ["Product Marketing", "Go-To-Market Strategy", "Competitive Intelligence", "Copywriting"],
        "experience_level": "Entry Level",
        "location": "Atlanta, GA",
        "posting_type": "full-time",
    },
    {
        "title": "Technical Content Marketing Intern",
        "company": "BlogTech",
        "description": "Write technical tutorials on cloud architecture, SQL query tuning, and Docker best practices for enterprise blogs.",
        "required_skills": ["Technical Writing", "Blogging", "SEO", "Cloud Concepts", "Markdown"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Developer Community Lead",
        "company": "HackerSpace Global",
        "description": "Organize online hackathons, manage student developer ambassador programs, and coordinate event logistics.",
        "required_skills": ["Community Engagement", "Event Management", "Communication", "Social Media", "Discord"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Product Launch Operations Intern",
        "company": "LaunchOps Media",
        "description": "Coordinate launch task checklists across Product, Marketing, Sales, and Support teams leading up to key release dates.",
        "required_skills": ["Project Management", "Notion", "Communication", "Marketing Ops", "Excel"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Technical Sales Engineer",
        "company": "EnterpriseCloud Sales",
        "description": "Support enterprise account executives by delivering technical product demos, answering RFP security questionnaires, and building proof-of-concept integrations.",
        "required_skills": ["Sales Engineering", "Product Demos", "APIs", "Technical Communication", "SQL"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Developer Content Creator Intern",
        "company": "CodeVideo Studio",
        "description": "Script, record, and edit engaging coding YouTube tutorials and GitHub repository guides.",
        "required_skills": ["Video Editing", "Screen Recording", "Coding (Python/JS)", "Technical Writing", "YouTube"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },

    # ----------------------------------------------------
    # 8. CYBERSECURITY, DEVOPS & INFRASTRUCTURE - 20 jobs
    # ----------------------------------------------------
    {
        "title": "Cybersecurity Engineering Intern",
        "company": "ShieldSec Labs",
        "description": "Conduct vulnerability assessments, perform static/dynamic code analysis, monitor SIEM security logs, and assist with penetration testing scripts.",
        "required_skills": ["Cybersecurity", "Python", "Linux", "Network Security", "Wireshark", "Metasploit"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Cloud Security Engineer",
        "company": "SecureCloud Systems",
        "description": "Implement AWS IAM security policies, audit Terraform infrastructure code, and configure automated vulnerability scanners.",
        "required_skills": ["AWS Security", "Terraform", "Python", "IAM", "Docker", "Cybersecurity"],
        "experience_level": "Entry Level",
        "location": "Northern Virginia",
        "posting_type": "full-time",
    },
    {
        "title": "DevOps Engineering Intern",
        "company": "InfraPipeline Labs",
        "description": "Automate deployment workflows using GitHub Actions, manage Docker containers, and set up Prometheus/Grafana monitoring alerts.",
        "required_skills": ["Docker", "GitHub Actions", "Linux", "Bash", "Prometheus", "Python"],
        "experience_level": "Internship",
        "location": "San Jose, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Site Reliability Engineer (SRE)",
        "company": "UptimeScale",
        "description": "Maintain service level objectives (SLOs), investigate incident alerts, build automated recovery scripts, and manage Kubernetes clusters.",
        "required_skills": ["Kubernetes", "Docker", "Python", "Go", "Linux", "Prometheus"],
        "experience_level": "Entry Level",
        "location": "San Francisco, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Security Operations (SOC) Analyst Intern",
        "company": "ThreatGuard",
        "description": "Analyze security alerts in Splunk, investigate potential phishing and malware incidents, and write incident response reports.",
        "required_skills": ["Cybersecurity", "SIEM", "Splunk", "Incident Response", "Linux", "Networking"],
        "experience_level": "Internship",
        "location": "Dallas, TX",
        "posting_type": "internship",
    },
    {
        "title": "Junior Systems Administrator",
        "company": "Enterprise IT Ops",
        "description": "Manage Linux/Windows server environments, configure user accounts, monitor system health, and script routine IT tasks in Bash/PowerShell.",
        "required_skills": ["Linux", "Bash", "PowerShell", "Networking", "Active Directory", "IT Support"],
        "experience_level": "Entry Level",
        "location": "Chicago, IL",
        "posting_type": "full-time",
    },
    {
        "title": "Application Security Intern",
        "company": "AppShield Security",
        "description": "Review web application source code for OWASP Top 10 vulnerabilities (XSS, SQLi, CSRF) and verify API authentication logic.",
        "required_skills": ["Application Security", "OWASP", "Python", "JavaScript", "Burp Suite", "Code Review"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Infrastructure Automation Engineer",
        "company": "AutoCloud Tech",
        "description": "Build Infrastructure-as-Code (IaC) playbooks using Ansible and Terraform to provision AWS resources reproducibly.",
        "required_skills": ["Terraform", "Ansible", "AWS", "Python", "Bash", "Linux"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
    {
        "title": "Network Engineering Intern",
        "company": "NetCore Communications",
        "description": "Configure routers, switches, VPN tunnels, and firewalls. Monitor packet captures and troubleshoot routing protocol issues.",
        "required_skills": ["Networking", "TCP/IP", "Wireshark", "Cisco", "Linux", "Python"],
        "experience_level": "Internship",
        "location": "Atlanta, GA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Cloud Reliability Engineer",
        "company": "SkyReliable",
        "description": "Monitor multi-region AWS services, automate database backup schedules, and write Python remediation scripts.",
        "required_skills": ["AWS", "Python", "Linux", "CloudWatch", "Terraform", "Docker"],
        "experience_level": "Entry Level",
        "location": "Denver, CO",
        "posting_type": "full-time",
    },
    {
        "title": "Digital Forensics Intern",
        "company": "CyberForensics Lab",
        "description": "Assist with digital evidence extraction, disk image analysis, and memory dump analysis for cyber incident investigations.",
        "required_skills": ["Digital Forensics", "Cybersecurity", "Python", "Linux", "EnCase/FTK", "Memory Analysis"],
        "experience_level": "Internship",
        "location": "Washington, DC",
        "posting_type": "internship",
    },
    {
        "title": "Junior Build & Release Engineer",
        "company": "BuildMaster Systems",
        "description": "Maintain Jenkins and GitLab CI pipelines, resolve build dependencies, and manage artifact repositories.",
        "required_skills": ["Jenkins", "GitLab CI", "Docker", "Bash", "Python", "Git"],
        "experience_level": "Entry Level",
        "location": "Seattle, WA",
        "posting_type": "full-time",
    },
    {
        "title": "Cloud Platform Engineering Intern",
        "company": "Serverless Cloud",
        "description": "Build internal serverless microservice templates using AWS CDK, Python, and API Gateway.",
        "required_skills": ["AWS", "Python", "Serverless", "Lambda", "Docker", "Git"],
        "experience_level": "Internship",
        "location": "Boston, MA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Identity & Access Engineer (IAM)",
        "company": "IdentitySecure",
        "description": "Manage Single Sign-On (SSO) integrations, Okta/OAuth2 security rules, and user role provisioning scripts.",
        "required_skills": ["IAM", "OAuth2", "SAML", "Python", "Cybersecurity", "REST APIs"],
        "experience_level": "Entry Level",
        "location": "New York, NY",
        "posting_type": "full-time",
    },
    {
        "title": "Kubernetes & Container Intern",
        "company": "KubeOps",
        "description": "Deploy Helm charts, configure ingress controllers, and test container security isolation in Kubernetes clusters.",
        "required_skills": ["Kubernetes", "Docker", "Helm", "Linux", "Bash", "YAML"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Penetration Tester",
        "company": "RedTeam Security",
        "description": "Perform ethical hacking assessments against client web apps and external network perimeters. Write detailed executive remediation reports.",
        "required_skills": ["Penetration Testing", "Burp Suite", "Nmap", "Metasploit", "Python", "Web Security"],
        "experience_level": "Entry Level",
        "location": "San Francisco, CA",
        "posting_type": "full-time",
    },
    {
        "title": "Datacenter & Hardware Ops Intern",
        "company": "CoreDatacenter",
        "description": "Assist datacenter engineers with rack server installations, network cable patching, hardware diagnostics, and temperature monitoring.",
        "required_skills": ["Hardware", "Linux", "Networking", "Datacenter Operations", "Troubleshooting"],
        "experience_level": "Internship",
        "location": "Santa Clara, CA",
        "posting_type": "internship",
    },
    {
        "title": "Junior Cloud Compliance Analyst",
        "company": "CloudAudit Ops",
        "description": "Review SOC2, ISO27001, and FedRAMP security controls for cloud hosting environments using automated compliance scripts.",
        "required_skills": ["Cybersecurity Compliance", "SOC2", "AWS", "Python", "Risk Assessment"],
        "experience_level": "Entry Level",
        "location": "Raleigh, NC",
        "posting_type": "full-time",
    },
    {
        "title": "DevSecOps Engineering Intern",
        "company": "SecPipeline",
        "description": "Integrate static security analysis tools (Snyk/SonarQube) into developer CI/CD pipelines to catch vulnerabilities early.",
        "required_skills": ["DevSecOps", "Docker", "GitHub Actions", "Snyk", "Python", "Cybersecurity"],
        "experience_level": "Internship",
        "location": "Remote",
        "posting_type": "internship",
    },
    {
        "title": "Junior Security Engineer",
        "company": "DefensiveCyber",
        "description": "Implement firewall rules, encrypt sensitive database fields, and write Python scripts to automate threat hunting.",
        "required_skills": ["Cybersecurity", "Python", "Linux", "Firewalls", "PostgreSQL Encryption", "Git"],
        "experience_level": "Entry Level",
        "location": "Austin, TX",
        "posting_type": "full-time",
    },
]


def seed_job_postings(db: Session = None, force_reseed: bool = True) -> int:
    """
    Populates database with 160 synthetic job postings and generates dense/Voyage AI embeddings.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

def enrich_and_validate_postings(raw_postings: list) -> tuple:
    """
    Deduplicates raw postings (by title + company), checks field completeness,
    and enriches missing M2.1 schema fields with domain-aware synthetic defaults.
    Returns (valid_postings, removed_count).
    """
    seen_keys = set()
    valid_postings = []
    removed_count = 0

    required_keys = ["title", "company", "description", "required_skills", "experience_level", "location", "posting_type"]

    for item in raw_postings:
        # Check required fields completeness
        is_incomplete = any(not item.get(k) for k in required_keys)
        if is_incomplete:
            removed_count += 1
            continue

        # Check title + company duplicate
        key = (item["title"].strip().lower(), item["company"].strip().lower())
        if key in seen_keys:
            removed_count += 1
            continue

        seen_keys.add(key)

        # Enrich missing M2.1 fields with realistic domain-aware synthetic defaults
        enriched = dict(item)

        if not enriched.get("responsibilities"):
            title_lower = item["title"].lower()
            if "backend" in title_lower or "software" in title_lower or "developer" in title_lower:
                enriched["responsibilities"] = "Design and maintain REST microservices, optimize database queries, write automated tests, and participate in code reviews."
            elif "frontend" in title_lower or "web" in title_lower or "mobile" in title_lower or "ios" in title_lower or "android" in title_lower:
                enriched["responsibilities"] = "Develop responsive user interface components, integrate REST/GraphQL APIs, write unit tests, and collaborate with product designers."
            elif "data" in title_lower or "analytics" in title_lower or "bi" in title_lower:
                enriched["responsibilities"] = "Build data transformation pipelines, query analytical SQL databases, design executive dashboards, and conduct statistical analysis."
            elif "machine learning" in title_lower or "ml" in title_lower or "ai" in title_lower or "nlp" in title_lower or "vision" in title_lower:
                enriched["responsibilities"] = "Experiment with model architectures, process training datasets, build evaluation benchmarks, and containerize inference endpoints."
            elif "product" in title_lower or "apm" in title_lower:
                enriched["responsibilities"] = "Draft product requirement documents (PRDs), run user research interviews, prioritize engineering sprint backlogs, and monitor KPIs."
            elif "design" in title_lower or "ux" in title_lower or "ui" in title_lower:
                enriched["responsibilities"] = "Create high-fidelity interactive wireframes in Figma, conduct usability tests, maintain design tokens, and refine user flows."
            elif "marketing" in title_lower or "devrel" in title_lower:
                enriched["responsibilities"] = "Author technical tutorials, build sample code projects, engage developer communities, and analyze campaign conversion metrics."
            else:
                enriched["responsibilities"] = "Collaborate with cross-functional engineering teams to build, test, and deploy software features and system documentation."

        if not enriched.get("preferred_skills"):
            req_skills = item.get("required_skills", [])
            if "Python" in req_skills:
                enriched["preferred_skills"] = ["Docker", "Kubernetes", "AWS"]
            elif "React" in req_skills or "TypeScript" in req_skills:
                enriched["preferred_skills"] = ["Next.js", "Tailwind CSS", "GraphQL"]
            elif "SQL" in req_skills:
                enriched["preferred_skills"] = ["Snowflake", "Airflow", "dbt"]
            elif "PyTorch" in req_skills:
                enriched["preferred_skills"] = ["Hugging Face", "MLflow", "ONNX"]
            elif "Figma" in req_skills:
                enriched["preferred_skills"] = ["Design Systems", "Prototyping", "User Research"]
            else:
                enriched["preferred_skills"] = ["Git", "Linux", "CI/CD"]

        if not enriched.get("qualifications"):
            enriched["qualifications"] = "Strong analytical and problem-solving skills, solid understanding of software engineering fundamentals, and effective team communication."

        if not enriched.get("experience_requirements"):
            exp_lvl = item.get("experience_level", "Internship")
            if "intern" in exp_lvl.lower() or "internship" in item.get("posting_type", "").lower():
                enriched["experience_requirements"] = "0-1 years of relevant project or academic coursework experience."
            else:
                enriched["experience_requirements"] = "1-2 years of relevant professional or internship experience."

        if not enriched.get("education_requirements"):
            title_lower = item["title"].lower()
            if "design" in title_lower or "ux" in title_lower:
                enriched["education_requirements"] = "Pursuing or completed B.S. or B.F.A. in HCI, Product Design, Graphic Design, or related field."
            elif "product" in title_lower or "marketing" in title_lower:
                enriched["education_requirements"] = "Pursuing or completed B.S. or B.A. in Computer Science, Business, Marketing, or related field."
            else:
                enriched["education_requirements"] = "Pursuing or completed B.S. in Computer Science, Data Science, Software Engineering, or related technical field."

        valid_postings.append(enriched)

    return valid_postings, removed_count


def seed_job_postings(db: Session = None, force_reseed: bool = True):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        if force_reseed:
            # Drop old table to recreate with new M2.1 columns cleanly in SQLite/PostgreSQL
            try:
                JobPosting.__table__.drop(bind=engine, checkfirst=True)
            except Exception as e:
                print(f"Notice during table drop: {e}")
            Base.metadata.create_all(bind=engine)
            print("Cleared existing job postings and updated table schema.")

        existing_count = db.query(JobPosting).count()
        if existing_count > 0 and not force_reseed:
            print(f"Database already contains {existing_count} job postings. Skipping seed.")
            return existing_count

        # Run deduplication and validation step
        valid_postings, removed_count = enrich_and_validate_postings(RAW_JOB_POSTINGS)
        print(f"Deduplication & Validation: Removed {removed_count} duplicate/incomplete postings.")
        print(f"Generating vector embeddings and inserting {len(valid_postings)} verified job postings...")

        postings_to_add = []
        for i, item in enumerate(valid_postings, 1):
            job = JobPosting(
                title=item["title"],
                company=item["company"],
                description=item["description"],
                responsibilities=item["responsibilities"],
                required_skills=item["required_skills"],
                preferred_skills=item["preferred_skills"],
                qualifications=item["qualifications"],
                experience_level=item["experience_level"],
                experience_requirements=item["experience_requirements"],
                education_requirements=item["education_requirements"],
                location=item["location"],
                posting_type=item["posting_type"],
            )
            # Concatenate single text block for embedding per requirements
            embedding_text = prepare_job_text_for_embedding(job)
            job.embedding = get_embedding(embedding_text, input_type="document")
            postings_to_add.append(job)

            if i % 20 == 0 or i == len(valid_postings):
                print(f"Processed embeddings for {i}/{len(valid_postings)} postings...")

        db.bulk_save_objects(postings_to_add)
        db.commit()

        total_seeded = db.query(JobPosting).count()
        print(f"Successfully seeded {total_seeded} job postings into database with complete M2.1 schema!")
        return total_seeded

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_job_postings()
