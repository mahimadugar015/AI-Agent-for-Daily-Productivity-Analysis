# AI Agent for Daily Productivity Analysis

## Run
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Open: http://127.0.0.1:8000

## Architecture
User -> Web UI -> FastAPI -> Agent Orchestrator
-> Task Agent -> Analysis Agent -> Planning Agent -> Recommendation Agent
-> Database -> Feedback Agent -> Continuous Improvement

The project is intentionally runnable without a paid LLM API. The agent layer is implemented as deterministic specialized agents. An LLM can later be connected inside the orchestrator for natural-language reasoning.
