"""Creates test PDF resumes using PyMuPDF (fitz) for E2E testing."""
import fitz
import os

RESUMES = {
    "alpha": """Alex Johnson
alex.johnson@university.edu | github.com/alexjohnson

EDUCATION
B.S. Computer Science, Stanford University, 2022-2026, GPA: 3.8

SKILLS
Technical: Python, FastAPI, PostgreSQL, Docker, REST APIs, Git, SQL, JavaScript, React
Tools: VS Code, Postman, GitHub Actions, Linux
Soft Skills: Problem solving, Teamwork, Communication

EXPERIENCE
Backend Engineering Intern, TechCorp Inc., Jun 2024 - Aug 2024
- Developed RESTful APIs using FastAPI and PostgreSQL serving 50k+ daily users
- Reduced API latency by 35% through query optimization and Redis caching
- Wrote comprehensive unit and integration tests achieving 92% code coverage

Software Developer Intern, StartupXYZ, Jan 2024 - May 2024
- Built microservices architecture using Python and Docker
- Collaborated with frontend team on 3 major feature releases

PROJECTS
AI Resume Matcher: Python, sentence-transformers, FastAPI, PostgreSQL, AWS
Task Management API: FastAPI, PostgreSQL, Redis, Docker, JWT
""",
    "beta": """Maya Sharma
maya.sharma@mit.edu | github.com/mayasharma

EDUCATION
M.S. Data Science, MIT, 2023-2025, GPA: 3.9
B.S. Statistics, UC Berkeley, 2019-2023

SKILLS
Technical: Python, R, SQL, TensorFlow, PyTorch, scikit-learn, Pandas, NumPy, Matplotlib
Tools: Jupyter, Tableau, Power BI, Apache Spark, AWS SageMaker, dbt, Airflow
Databases: PostgreSQL, MySQL, MongoDB

EXPERIENCE
Data Science Intern, DataAnalytics Corp, May 2024 - Aug 2024
- Developed predictive models using XGBoost achieving 87% accuracy on churn prediction
- Built automated data pipelines processing 5TB daily using Apache Spark
- Created executive dashboards in Tableau reducing reporting time by 60%

Research Assistant, MIT AI Lab, Sep 2023 - Present
- Conducting research on transformer architectures for time-series forecasting

PROJECTS
Customer Churn Prediction: Python, scikit-learn, FastAPI, Docker, XGBoost
NLP Sentiment Analysis: BERT, PyTorch, Hugging Face, fine-tuning
""",
    "gamma": """Jordan Kim
jordan.kim@caltech.edu | github.com/jordankim

EDUCATION
B.S. Computer Science and Mathematics, Caltech, 2021-2025, GPA: 3.7

SKILLS
Technical: Python, PyTorch, TensorFlow, JAX, CUDA, C++, MATLAB
ML/AI: Deep Learning, Reinforcement Learning, Computer Vision, NLP, LLMs
Tools: Git, Docker, Weights and Biases, Hugging Face Transformers, Ray

EXPERIENCE
ML Research Intern, DeepMind, Jun 2024 - Sep 2024
- Implemented novel attention mechanisms for protein structure prediction
- Achieved 12% improvement on benchmark datasets

Teaching Assistant, Caltech CS156 ML Course, Sep 2023 - Jun 2024
- Led weekly lab sessions for 60 students on practical ML implementations

PROJECTS
Vision Transformer for Medical Imaging: PyTorch, Hugging Face, CUDA, fine-tuning ViT
Reinforcement Learning Trading Agent: PyTorch, OpenAI Gym, Ray RLlib, Deep Q-Network
""",
}

out_dir = os.path.join(os.path.dirname(__file__), "test_pdfs")
os.makedirs(out_dir, exist_ok=True)

for key, text in RESUMES.items():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.insert_text((50, 50), text, fontsize=10, fontname="helv")
    out_path = os.path.join(out_dir, f"resume_{key}.pdf")
    doc.save(out_path)
    doc.close()

    # Verify parseable
    doc2 = fitz.open(out_path)
    extracted = doc2[0].get_text()
    doc2.close()
    size = os.path.getsize(out_path)
    print(f"  {key}: {size} bytes, extracted {len(extracted)} chars — OK" if len(extracted) > 50 else f"  {key}: EXTRACTION FAILED")

print("Test PDFs written to scripts/test_pdfs/")
