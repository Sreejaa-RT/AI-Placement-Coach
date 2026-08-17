# ML Assessment Center Integration & Adaptive Engine

This sub-module manages the automated acquisition, preprocessing, and routing of multiple-choice questions (MCQs) for the **AI Placement Coach - Assessment Center**, feeding the frontend with adaptive question sets and analyzing student performance.

---

## 1. Dataset & Preprocessing

### A. Approved Data Sources
1.  **MMLU (Primary):** Sourced from [`cais/mmlu`](https://huggingface.co/datasets/cais/mmlu). Extracted 8 configurations covering basic and college computer science, mathematics, formal logic, and logical fallacies.
2.  **CS-Bench (Secondary):** Sourced from [`CS-Bench/CS-Bench`](https://huggingface.co/datasets/CS-Bench/CS-Bench). Extracted the default test split, filtering strictly for `Language == 'English'` questions.

### B. Cleaning & Deduplication
*   **Rejections:** Removed 853 malformed questions (lacking exactly 4 options, containing invalid keys, or presenting empty prompts).
*   **Deduplication:** Dropped 126 exact question text matches.
*   **Final Output Database:** **2,825 clean questions** stored in JSON format at [`backend/ml/assessment/data/processed/questions.json`](file:///c:/Users/sreejaa/OneDrive/Desktop/AI%20Placement%20Coach/backend/ml/assessment/data/processed/questions.json).

### C. Derived Difficulty Levels
Since ground-truth difficulty labels are unavailable:
*   **MMLU:** Mapped based on academic configuration splits (e.g. `elementary_mathematics` $\rightarrow$ `Easy`, `high_school_mathematics` $\rightarrow$ `Medium`, `college_mathematics` $\rightarrow$ `Hard`).
*   **CS-Bench:** Mapped based on question format metadata (e.g. `Format == 'Higher-order Reasoning'` $\rightarrow$ `Hard`, else `Medium`).

---

## 2. API Endpoints

### GET `/api/v1/assessment/questions`
Fetches a list of 10 randomized questions filtered by category, topic, or difficulty.
*   **Secure Delivery:** The backend strips all correct answer keys (`correct_answer`) and explanation blocks (`explanation`) before sending questions to the client, preventing browser inspection cheats.

### POST `/api/v1/assessment/attempt`
Verifies user option choice and returns correctness assessment details.
*   **Request Schema:**
    ```json
    {
      "question_id": "csbench_test_104",
      "selected_option": 1,
      "time_taken_seconds": 12.5,
      "attempt_number": 1
    }
    ```
*   **Response Schema:**
    ```json
    {
      "is_correct": true,
      "correct_answer": "B",
      "explanation": "A full outer join combines both tables...",
      "category": "DBMS / SQL",
      "topic": "SQL Joins",
      "difficulty": "Medium"
    }
    ```

### GET `/api/v1/assessment/performance`
Calculates overall and category-wise statistics for the authenticated user and returns practice recommendations.
*   **Response Schema:**
    ```json
    {
      "overall_accuracy": 74.5,
      "category_accuracy": { "Data Structures": 80.0, "Operating Systems": 69.0 },
      "topic_accuracy": { "Arrays": 80.0, "Processes": 69.0 },
      "difficulty_wise_accuracy": { "Easy": 90.0, "Medium": 70.0, "Hard": 50.0 },
      "questions_attempted": 24,
      "questions_correct": 18,
      "questions_incorrect": 6,
      "average_response_time": 18.4,
      "strongest_topics": ["Arrays"],
      "weakest_topics": ["Processes"],
      "recommendation": {
        "recommended_category": "Operating Systems",
        "recommended_topic": "Processes",
        "recommended_difficulty": "Medium",
        "reason": "Your recent accuracy in Processes is 69.0%, which is below your overall assessment accuracy of 74.5%."
      }
    }
    ```

---

## 3. Firestore Attempt Schema
Attempt logs are captured client-side in the React application using the Firebase SDK and saved under:
`users/{userId}/assessmentAttempts`

```json
{
  "userId": "auth_uid_123",
  "questionId": "csbench_test_104",
  "category": "DBMS / SQL",
  "topic": "SQL Joins",
  "difficulty": "Medium",
  "selectedOption": 1,
  "correctOption": "B",
  "isCorrect": true,
  "timeTakenSeconds": 12.5,
  "attemptNumber": 1,
  "timestamp": "2026-08-15T15:00:00Z"
}
```

---

## 4. Adaptive & Fallback Logic

### A. Baseline Adaptive Recommendation Engine
1.  **Exclusion:** The query engine filters out questions that the user has already answered correctly to avoid repeating identical questions.
2.  **Difficulty Scaling:** The engine checks the correctness rate of the last 3 attempts. If accuracy is $\ge 80\%$, the difficulty level scales up to `Hard` / `Medium`. If accuracy falls below $50\%$, the difficulty scales down to `Easy` / `Medium`.
3.  **Weak-Topic Prioritization:** The recommendation card prioritizes topics with $<50\%$ accuracy, guiding the student to practice their weakest areas next.

### B. Fallback Integrity
*   **Network/Service Failure:** If the FastAPI server is offline, the React app catches the exception and falls back to loading randomized sets of 10 questions from the client-side `questionsPool`. Answers are validated locally using local explanation assets, ensuring zero disruption.
*   **Verbal Ability:** Sourced MMLU and CS-Bench datasets contain 0 English grammar questions. Verbal Ability is isolated and routes directly to the local 10 verbal fallback questions.

---

## 5. Rule-Based Recommendation Hierarchy
The recommendation system relies on structured logical rules (not machine learning inference) prioritizing student focus areas in the following order:
1.  **Critical Mastery Gaps:** Any sub-topic where current accuracy is below $50\%$.
2.  **Lowest Performing Topic:** The sub-topic with the minimum positive correctness rate.
3.  **Lowest Performing Category:** The primary category (out of 10) with the minimum accuracy percentage.
4.  **Targeted Difficulty:** Shifts the next assessment questions to match the student's recent performance bands.
5.  **Unsolved Retention:** Selects questions that the user has not yet correctly answered.

---

## 6. Machine Learning Boundary
> [!IMPORTANT]
> The current recommendation engine is strictly rule-based and deterministic.
> *   We **DO NOT** train any predictive models (Deep Knowledge Tracing, Item Response Theory, or neural embeddings) on the static assessment questions database.
> *   We **DO NOT** use MMLU/CS-Bench benchmarks as synthetic student histories to generate fake predictions.
> *   We **DO NOT** label diagnostics or adaptive selections as "AI-powered" or display fabricated AI prediction stats.

### Future ML Architecture (Post-Collection Phase)
Once Firestore accumulates sufficient user attempts:
1.  **Learning Sequences:** Correctness sequences, reaction times, and attempt intervals will be extracted per student.
2.  **Cognitive Modeling:** A Deep Knowledge Tracing (DKT) or Bayesian Knowledge Tracing (BKT) network will be trained on these sequences.
3.  **Dynamic Adaptation:** The trained cognitive model will run real-time inference on student mastery bounds to adjust quiz pathways dynamically.

---

## 7. AI Interview Coach Integration
The **AI Interview Coach** runs dynamically via LLM-powered context mapping. It integrates student performance telemetry across different modules to create tailored mock trials.

### Pipeline Architecture:
1.  **Context Aggregation:** On starting a session, the frontend reads the user's latest parsed resume analyses (skills, projects, keywords) and their weakest assessment metrics (from `/api/v1/assessment/performance`).
2.  **AI Question Generation:** Sends context to `POST /api/generate-interview-questions`. The backend assembles a prompt and calls Google Gemini (`gemini-2.5-flash`) to generate exactly 3 custom questions:
    *   *Question 1:* Project-based query targeting their resume experience.
    *   *Question 2:* Technical question targeting their weakest assessment topic.
    *   *Question 3:* Domain-specific behavioral/technical question aligned with their selected difficulty level.
3.  **AI Answer Evaluation:** Candidate response transcripts are logged via Web Speech speech-to-text. Upon completion, answers are sent to `POST /api/evaluate-interview-responses`. Gemini evaluates accuracy, calculates scores (0-100), summarizes strengths/missing points, and writes a model answer blueprint.

### Module Boundaries:
*   **Assessment Center:** Deterministic, rule-based adaptive selection querying the static preprocessed dataset of 2,825 questions.
*   **Interview Coach:** LLM-powered dynamic generation and qualitative scoring leveraging real-time prompt context.
*   **Future Knowledge Tracing:** Unimplemented predictive networks that will construct deep cognitive models once attempt histories are compiled.
