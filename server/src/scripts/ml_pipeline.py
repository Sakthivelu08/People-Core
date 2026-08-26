import sys
import os
import subprocess
import datetime

# Auto-install dependencies if not present
dependencies = {
    "mysql-connector-python": "mysql.connector",
    "pandas": "pandas",
    "scikit-learn": "sklearn"
}
for lib, import_name in dependencies.items():
    try:
        __import__(import_name)
    except ImportError:
        print(f"[ML Pipeline] Dependency {lib} not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", lib])

import mysql.connector
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import numpy as np

def load_env(env_path):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def main():
    print("[ML Pipeline] Starting ML Pipeline execution...")
    
    # 1. Load environment configurations
    server_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(server_dir, ".env")
    env = load_env(env_path)
    
    db_host = env.get("DB_HOST", "127.0.0.1")
    db_port = int(env.get("DB_PORT", "3306"))
    db_user = env.get("DB_USER", "root")
    db_password = env.get("DB_PASSWORD", "")
    db_name = env.get("DB_NAME", "peoplecore")
    
    # 2. Connect to MySQL
    print(f"[ML Pipeline] Connecting to database {db_name} at {db_host}:{db_port}...")
    conn = mysql.connector.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database=db_name
    )
    cursor = conn.cursor(dictionary=True)
    
    # 3. Step A: Train the model on synthetic historical training data
    # In a real enterprise system, this is historical data of resigned vs active employees.
    # Features: tenure_months, leave_days_last_6_months, onboarding_tasks_percent, engagement_score
    print("[ML Pipeline] Generating synthetic training dataset for scikit-learn...")
    
    np.random.seed(42)
    n_samples = 150
    
    # Generate synthetic features
    tenure_months = np.random.randint(1, 48, n_samples)
    leave_days = np.random.randint(0, 30, n_samples)
    onboarding_percent = np.random.uniform(0.2, 1.0, n_samples)
    engagement = np.random.randint(40, 100, n_samples)
    
    # Attrition ground truth logic (rule-based with noise to simulate real-world ML patterns)
    # High risk: low tenure + high leaves, or very low engagement, or incomplete onboarding
    attrition = []
    for i in range(n_samples):
        score = 0.0
        if tenure_months[i] < 12: score += 0.2
        if leave_days[i] > 15: score += 0.3
        if onboarding_percent[i] < 0.6: score += 0.3
        if engagement[i] < 60: score += 0.4
        
        # Add random noise
        score += np.random.normal(0, 0.1)
        attrition.append(1 if score > 0.5 else 0)
        
    X_train = pd.DataFrame({
        "tenure_months": tenure_months,
        "leave_days": leave_days,
        "onboarding_percent": onboarding_percent,
        "engagement": engagement
    })
    y_train = pd.Series(attrition)
    
    print(f"[ML Pipeline] Training DecisionTreeClassifier with {n_samples} synthetic profiles...")
    clf = DecisionTreeClassifier(max_depth=4, random_state=42)
    clf.fit(X_train, y_train)
    print("[ML Pipeline] Model training completed successfully.")
    
    # 4. Step B: Fetch active employees database data to predict on
    print("[ML Pipeline] Fetching active employee database tables...")
    
    # Fetch Employees
    cursor.execute("SELECT id, name, join_date, department FROM employees WHERE status IN ('active', 'onboarding')")
    employees = cursor.fetchall()
    
    if not employees:
        print("[ML Pipeline] No active employees found. Exiting.")
        return
        
    # Fetch Leaves
    cursor.execute("SELECT employee_id, SUM(days) as total_days FROM leave_requests WHERE status = 'approved' GROUP BY employee_id")
    leaves_map = {row["employee_id"]: row["total_days"] for row in cursor.fetchall()}
    
    # Fetch Onboarding
    cursor.execute("""
        SELECT employee_id, 
               COUNT(*) as total, 
               SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed 
        FROM onboarding_tasks 
        GROUP BY employee_id
    """)
    onboarding_map = {row["employee_id"]: (row["completed"], row["total"]) for row in cursor.fetchall()}
    
    # Fetch Engagement Scores per department
    cursor.execute("SELECT department, score FROM engagement_scores")
    engagement_map = {row["department"]: float(row["score"]) for row in cursor.fetchall()}
    
    today = datetime.date.today()
    predictions = []
    
    # 5. Predict risk for each active employee
    for emp in employees:
        emp_id = emp["id"]
        join_date = emp["join_date"]
        dept = emp["department"]
        
        # Compute features
        if join_date:
            tenure_days = (today - join_date).days
            tenure_m = max(1, int(tenure_days / 30))
        else:
            tenure_m = 12 # Default
            
        leave_d = leaves_map.get(emp_id, 0)
        
        ob_completed, ob_total = onboarding_map.get(emp_id, (0, 0))
        ob_pct = (ob_completed / ob_total) if ob_total > 0 else 1.0
        
        eng_score = engagement_map.get(dept, 75.0) # default engagement if dept not found
        
        # Prepare feature vector for ML scoring
        features = pd.DataFrame([{
            "tenure_months": tenure_m,
            "leave_days": leave_d,
            "onboarding_percent": ob_pct,
            "engagement": eng_score
        }])
        
        # Predict probability
        prob = clf.predict_proba(features)[0][1] # Probability of resigning (class 1)
        risk_score = round(prob * 100, 2)
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
            
        # Determine key factors contributing to risk
        factors = []
        if tenure_m < 12:
            factors.append("Short tenure")
        if leave_d > 10:
            factors.append("High leave rates")
        if ob_pct < 0.8:
            factors.append("Incomplete onboarding tasks")
        if eng_score < 70:
            factors.append(f"Low department engagement ({dept})")
            
        if not factors:
            factors.append("Standard baseline metrics")
            
        predictions.append({
            "employee_id": emp_id,
            "name": emp["name"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "key_factors": ", ".join(factors)
        })
        
    print(f"[ML Pipeline] Predicted attrition scores for {len(predictions)} active profiles:")
    for pred in predictions:
        print(f" - {pred['name']}: {pred['risk_score']}% ({pred['risk_level']}) - Factors: [{pred['key_factors']}]")
        
    # 6. Save predictions to attrition_scores database table
    print("[ML Pipeline] Writing predicted scores to MySQL database...")
    for pred in predictions:
        # Check if record already exists for this employee
        cursor.execute("SELECT id FROM attrition_scores WHERE employee_id = %s", (pred["employee_id"],))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                """UPDATE attrition_scores 
                   SET risk_score = %s, risk_level = %s, key_factors = %s, generated_at = NOW() 
                   WHERE employee_id = %s""",
                (pred["risk_score"], pred["risk_level"], pred["key_factors"], pred["employee_id"])
            )
        else:
            cursor.execute(
                """INSERT INTO attrition_scores (id, employee_id, risk_score, risk_level, key_factors, generated_at)
                   VALUES (UUID(), %s, %s, %s, %s, NOW())""",
                (pred["employee_id"], pred["risk_score"], pred["risk_level"], pred["key_factors"])
            )
            
    conn.commit()
    cursor.close()
    conn.close()
    print("[ML Pipeline] Pipeline finished successfully.")

if __name__ == "__main__":
    main()
