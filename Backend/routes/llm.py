from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
import re
import logging

from core.groq_utils import get_groq_clients, execute_with_groq_fallback
from services.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

groq_clients = get_groq_clients(1, 2, 3, 4, 5, 6)
if not groq_clients:
    logger.warning("No Groq API keys (1-6) found in environment variables.")

class ResearchRequest(BaseModel):
    department: str
    domain: str

class SummaryRequest(BaseModel):
    abstract: str
    mode: str

class InsightsRequest(BaseModel):
    text: str

class LiteratureReviewRequest(BaseModel):
    abstracts_text: str

@router.post("/generate-titles")
def generate_titles(data: ResearchRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    # Input validation — prevent prompt injection via department / domain fields
    if not re.match(r'^[a-zA-Z0-9 \-\.&]{1,100}$', data.department.strip()):
        raise HTTPException(status_code=400, detail="Invalid department format. Use letters, numbers, spaces, hyphens, or dots (max 100 chars).")
    if not re.match(r'^[a-zA-Z0-9 \-\.&]{1,100}$', data.domain.strip()):
        raise HTTPException(status_code=400, detail="Invalid domain format. Use letters, numbers, spaces, hyphens, or dots (max 100 chars).")

    def get_fallback_projects(dept: str, dom: str):
        fallbacks = {
            "Artificial Intelligence": [
                {
                    "title": "Multimodal Explainable AI for Real-World Decision Support Systems",
                    "difficulty": "Hard",
                    "algorithms": ["Transformers", "SHAP", "LIME"],
                    "summary": "This project builds a multi-modal AI decision-support system that processes textual descriptions, raw visual scans, and tabular features, yielding fully explainable, audit-ready clinical decisions.",
                    "dataset": "MIMIC-IV Multi-modal Intensive Care Dataset (clinical notes, tables, X-rays).",
                    "best_algorithms_explanation": "Multimodal Transformers are best because self-attention integrates diverse modalities natively. SHAP and LIME are best because they generate mathematical feature attribution scores to guarantee transparency."
                },
                {
                    "title": "Deep Learning-Based Spatial-Temporal Framework for Real-Time Urban Traffic Flow Prediction",
                    "difficulty": "Medium",
                    "algorithms": ["LSTM", "CNN", "Random Forest"],
                    "summary": "A city-scale predictive grid that leverages neural structures to anticipate traffic congestions and compute dynamic navigation maps.",
                    "dataset": "PeMS-SF traffic sensor flow database from Caltrans (California Performance Measurement System).",
                    "best_algorithms_explanation": "LSTMs are best because they capture long-range chronological traffic correlations, and CNNs are best if spatial network relationships are represented as 2D spatial matrices."
                },
                {
                    "title": "Autonomous Robotics Pathfinding in Obstacle-Heavy Environments Using Deep Q-Networks",
                    "difficulty": "Hard",
                    "algorithms": ["DQN", "A*", "DDPG"],
                    "summary": "Implement a self-learning navigation loop where a robot agent optimizes continuous routing through obstacle-heavy environments.",
                    "dataset": "CARLA Autonomous Driving Simulator lidar and camera telemetry feeds.",
                    "best_algorithms_explanation": "Deep Q-Networks (DQN) are best because they project raw pixel inputs directly into optimal movement policies without requiring manual spatial modeling."
                },
                {
                    "title": "An AI-Driven Patient Monitoring Framework for Real-Time Cardiovascular Diagnostic Assistance",
                    "difficulty": "Medium",
                    "algorithms": ["ResNet", "Random Forest", "XGBoost"],
                    "summary": "Continuously evaluate clinical patient parameters to proactively detect and report cardiovascular anomalies.",
                    "dataset": "PhysioNet MIMIC clinical database and historical ECG telemetry records.",
                    "best_algorithms_explanation": "ResNet is best for robust clinical image classification, and XGBoost operates optimally on structured tabular clinical vitals to identify anomalies."
                },
                {
                    "title": "Smart Home Energy Conservation Controller Using IoT Sensor Data and Clustering",
                    "difficulty": "Easy",
                    "algorithms": ["Decision Trees", "K-Means", "Linear Regression"],
                    "summary": "An intelligent controller that learns household behavior patterns to maximize energy conservation in cooling systems.",
                    "dataset": "Smart Home Environmental Sensors Dataset (temperatures, motion sensors, occupancy indicators).",
                    "best_algorithms_explanation": "Decision Trees are ideal because they construct easy-to-read logical control rules, and K-Means clusters hourly activities to formulate custom appliance schedules."
                }
            ],
            "Machine Learning": [
                {
                    "title": "Evaluating the Efficacy of Reinforcement Learning for Autonomous Navigation",
                    "difficulty": "Hard",
                    "algorithms": ["PPO", "DDPG", "SAC"],
                    "summary": "Evaluate state-of-the-art policy optimization schemes under complex navigation constraints.",
                    "dataset": "ROS Gazebo Physical Robot Simulator telemetry traces.",
                    "best_algorithms_explanation": "Proximal Policy Optimization (PPO) is best because it features clipped objective targets, preventing destructive model divergence during robot control training."
                },
                {
                    "title": "Deep Learning-Based Predictive Maintenance System for Industrial Turbofan Degradation Detection",
                    "difficulty": "Medium",
                    "algorithms": ["SVM", "Gradient Boosting", "Neural Networks"],
                    "summary": "Analyze high-frequency vibrational readings to anticipate thermal anomalies and structural degradation in turbines.",
                    "dataset": "NASA Turbofan Engine Degradation Simulation Dataset (C-MAPSS).",
                    "best_algorithms_explanation": "Gradient Boosting (XGBoost/LightGBM) is best because it handles highly skewed industrial sensor data and creates precise predictive anomaly targets."
                },
                {
                    "title": "Bidirectional Transformer Architecture for Real-Time Sentiment Analysis in Social Telemetry Streams",
                    "difficulty": "Hard",
                    "algorithms": ["BERT", "Transformer", "RNN"],
                    "summary": "Capture complex emotional transitions and semantic nuances in stream-based social conversations.",
                    "dataset": "Sentiment140 Twitter Sentiment dataset (1.6 million annotated tweets).",
                    "best_algorithms_explanation": "BERT is best because its bidirectional attention models complex sentence semantics, capturing implicit context, slang, and user sarcasm perfectly."
                },
                {
                    "title": "Ensemble-Based Classifier Framework for Real-Time Customer Churn Prediction in Telecommunication Industries",
                    "difficulty": "Easy",
                    "algorithms": ["Random Forest", "Logistic Regression", "XGBoost"],
                    "summary": "Predict user churn probabilities based on transaction frequencies and historical user profiles.",
                    "dataset": "Kaggle Telco Customer Churn database.",
                    "best_algorithms_explanation": "Random Forest is excellent because it averages multiple weak decision trees, avoiding overfitting and naturally handling categorical properties."
                }
            ]
        }
        
        default_projects = [
            {
                "title": f"A Deep Learning-Based {dom} Integration Framework for Secure {dept} Architectures",
                "difficulty": "Medium",
                "algorithms": ["Random Forest", "XGBoost", "K-Means"],
                "summary": f"Develop an advanced data-driven framework leveraging state-of-the-art algorithms within the {dom} domain.",
                "dataset": f"Public research datasets related to {dom} and engineering systems.",
                "best_algorithms_explanation": "Random Forest and XGBoost are best because they offer high accuracy and robust feature importances for structured metrics."
            },
            {
                "title": f"Real-Time Anomaly Detection in Heterogeneous {dom} Industrial Edge Networks",
                "difficulty": "Hard",
                "algorithms": ["Isolation Forest", "Autoencoders", "SVM"],
                "summary": "A real-time monitoring tool designed to capture micro-anomalies and out-of-distribution patterns.",
                "dataset": "Synthetic and physical network telemetry logs.",
                "best_algorithms_explanation": "Autoencoders are best because they learn standard patterns unsupervised and isolate outliers based on high reconstruction error."
            },
            {
                "title": f"Predictive Modeling and Performance Optimization of High-Throughput {dept} Architectures",
                "difficulty": "Medium",
                "algorithms": ["Linear Regression", "Gradient Boosting", "KNN"],
                "summary": f"Optimize the performance and throughput of system architectures using statistical modeling.",
                "dataset": f"Historical performance indicators and sensor readings of {dept} hardware.",
                "best_algorithms_explanation": "Gradient Boosting is best for capturing complex, non-linear relationships between hardware parameters."
            },
            {
                "title": f"Deep Learning Model Quantization for Resource-Constrained {dom} Edge IoT Nodes",
                "difficulty": "Hard",
                "algorithms": ["Quantized CNN", "SVM", "Decision Trees"],
                "summary": "Deploy deep learning models on low-power edge microcontrollers through post-training weight quantization.",
                "dataset": "UCI Smart Buildings and sensor monitoring data.",
                "best_algorithms_explanation": "Quantized CNNs are best because they compress the weight parameters, fitting model parameters on edge hardware storage."
            },
            {
                "title": f"Dimensionality Reduction and Unsupervised Clustering of High-Dimensional {dom} Parameter Sets",
                "difficulty": "Easy",
                "algorithms": ["K-Means", "PCA", "Hierarchical Clustering"],
                "summary": f"Explore and categorize dynamic metrics across multiple {dept} domains to discover hidden archetypes.",
                "dataset": "Public tabular metrics datasets.",
                "best_algorithms_explanation": "K-Means combined with Principal Component Analysis (PCA) is best because it reduces feature dimensionality for simple, intuitive clustering."
            }
        ]
        return fallbacks.get(dom, default_projects)

    if not groq_clients:
        print("[Backend] Groq not configured, returning mock projects.")
        return {"projects": get_fallback_projects(data.department, data.domain)}
    
    try:
        prompt = f"""
        Generate exactly 5 highly professional, innovative, and realistic academic research project plans for:

        Department: {data.department}
        Domain: {data.domain}

        Your target is to generate exactly 5 alternatives ranked from strongest (most mathematically/technically robust and original) to weakest.

        For each project, generate:
        1. "title": A highly formal, academic, and IEEE-standard publication title (do not use quotes). 
           Strictly adhere to the following IEEE Guidelines:
           - Use Title Case (capitalize all nouns, verbs, pronouns, adjectives, adverbs, and major words).
           - Must be suitable for IEEE conferences and journals (publication-ready, precise, and highly technical).
           - Word count must be strictly between 8 and 18 words.
           - Focus entirely on the core technological contribution, methodology, and application.
           - Avoid vague, casual, or clickbait wording.
           - Avoid introductory fillers such as "A Study on", "Research on", "Analysis of", "Investigation into" unless academically necessary.
        2. "difficulty": A difficulty level ('Easy', 'Medium', or 'Hard').
        3. "algorithms": A list of 2-3 suggested machine learning or data science algorithms (e.g., ['LSTM', 'CNN', 'Random Forest']).
        4. "summary": A clear, academically robust, and compelling summary of what the project accomplishes.
        5. "dataset": What dataset to use for this project (specify professional public datasets like Kaggle, UCI, PhysioNet, ImageNet, etc.).
        6. "best_algorithms_explanation": Tell me what algorithms are best and why they are best for this specific project.

        Return ONLY a valid JSON object matching this schema (do not include any additional text or markdown formatting):
        {{
            "projects": [
                {{
                    "title": "Formal Title in Title Case (8 to 18 Words)",
                    "difficulty": "Easy" | "Medium" | "Hard",
                    "algorithms": ["algorithm1", "algorithm2"],
                    "summary": "detailed summary here...",
                    "dataset": "recommended dataset here...",
                    "best_algorithms_explanation": "why these algorithms are ideal..."
                }},
                ...
            ]
        }}
        """

        try:
            response = execute_with_groq_fallback(
                clients=groq_clients,
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
        except Exception as e:
            logger.error(f"[Backend] Groq API failed for title generation: {e}")
            raise HTTPException(status_code=503, detail="Failed to generate titles via AI.")

        import json
        result = response.choices[0].message.content
        data_json = json.loads(result)
        projects = data_json.get("projects", [])
        
        if not projects and isinstance(data_json, list):
            projects = data_json

        clean_projects = []
        for proj in projects[:5]:
            title = proj.get("title", "").strip().replace('"', '')
            difficulty = proj.get("difficulty", "Medium")
            if difficulty not in ["Easy", "Medium", "Hard"]:
                difficulty = "Medium"
            algorithms = proj.get("algorithms", [])
            if not isinstance(algorithms, list):
                algorithms = [str(algorithms)]
            summary = proj.get("summary", "")
            dataset = proj.get("dataset", "")
            best_explanation = proj.get("best_algorithms_explanation", "")
            
            if title:
                clean_projects.append({
                    "title": title,
                    "difficulty": difficulty,
                    "algorithms": [alg.strip() for alg in algorithms if alg],
                    "summary": summary.strip(),
                    "dataset": dataset.strip(),
                    "best_algorithms_explanation": best_explanation.strip()
                })

        if not clean_projects:
            raise ValueError("No valid projects generated")

        return {
            "projects": clean_projects
        }
    except Exception as e:
        print(f"[Backend] Error generating titles: {e}, falling back to mock projects.")
        return {"projects": get_fallback_projects(data.department, data.domain)}

@router.post("/generate-summary")
def generate_summary(data: SummaryRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not groq_clients:
        raise HTTPException(status_code=503, detail="Groq API is not configured on the backend.")
    prompt = f"You are an expert academic researcher. Summarize the following research abstract in a {data.mode} format. \n\nAbstract: {data.abstract}"
    try:
        response = execute_with_groq_fallback(
            clients=groq_clients,
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "text"}
        )
        return {"text": response.choices[0].message.content or "No response generated."}
    except Exception as e:
        logger.error(f"[Backend] Groq summary error: {e}")
        raise HTTPException(status_code=503, detail="Failed to generate summary.")

@router.post("/generate-insights")
def generate_insights(data: InsightsRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not groq_clients:
        raise HTTPException(status_code=503, detail="Groq API is not configured on the backend.")
    prompt = f"""Analyze the following research text and extract key insights. Return ONLY a valid JSON object matching exactly this structure (no markdown, no quotes):
  {{
    "findings": ["finding 1", "finding 2"],
    "contributions": ["contribution 1", "contribution 2"],
    "novelIdeas": ["idea 1", "idea 2"]
  }}
  
  Text: {data.text}"""
    try:
        response = execute_with_groq_fallback(
            clients=groq_clients,
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        import json
        text = response.choices[0].message.content
        try:
            return json.loads(text)
        except:
            import re
            clean_text = re.sub(r'```json\n|\n```', '', text)
            return json.loads(clean_text)
    except Exception as e:
        logger.error(f"[Backend] Groq insights error: {e}")
        raise HTTPException(status_code=503, detail="Failed to generate insights.")

@router.post("/generate-literature-review")
def generate_literature_review(data: LiteratureReviewRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not groq_clients:
        raise HTTPException(status_code=503, detail="Groq API is not configured on the backend.")
    prompt = f"Act as an expert academic researcher. Write a concise literature review based on the following papers:\n\n{data.abstracts_text}\n\nInclude a synthesis of their common themes, methodologies, and identify any potential research gaps."
    try:
        response = execute_with_groq_fallback(
            clients=groq_clients,
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "text"}
        )
        return {"text": response.choices[0].message.content or "No response generated."}
    except Exception as e:
        logger.error(f"[Backend] Groq lit review error: {e}")
        raise HTTPException(status_code=503, detail="Failed to generate literature review.")
