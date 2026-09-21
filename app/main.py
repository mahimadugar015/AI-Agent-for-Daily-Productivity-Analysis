import json
from datetime import date
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, SessionLocal
from .models import User, Task, Activity, AgentRun, Feedback
from .agents import ProductivityOrchestrator

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Agent for Daily Productivity Analysis")
STATIC = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")
agent = ProductivityOrchestrator()

class TaskIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    category: str = "Study"
    priority: str = "Medium"
    duration_minutes: int = Field(30, ge=5, le=720)
    deadline: str = ""

class ActivityIn(BaseModel):
    focus_minutes: int = Field(0, ge=0, le=1440)
    break_minutes: int = Field(0, ge=0, le=1440)
    distraction_minutes: int = Field(0, ge=0, le=1440)
    sleep_hours: float = Field(7, ge=0, le=24)
    energy_level: int = Field(3, ge=1, le=5)

class FeedbackIn(BaseModel):
    agent_run_id: int
    useful: bool
    comment: str = ""

def demo_user(db):
    u = db.query(User).filter(User.email=="demo@productivity.ai").first()
    if not u:
        u = User(name="Mahima", email="demo@productivity.ai")
        db.add(u); db.commit(); db.refresh(u)
    return u

@app.on_event("startup")
def seed():
    db = SessionLocal()
    try: demo_user(db)
    finally: db.close()

@app.get("/")
def home(): return FileResponse(STATIC/"index.html")

@app.get("/api/dashboard")
def dashboard(db: Session=Depends(get_db)):
    u=demo_user(db)
    tasks=db.query(Task).filter(Task.user_id==u.id).order_by(Task.id.desc()).all()
    a=db.query(Activity).filter(Activity.user_id==u.id, Activity.activity_date==date.today()).first()
    r=db.query(AgentRun).filter(AgentRun.user_id==u.id).order_by(AgentRun.id.desc()).first()
    return {"user":u.name,
      "tasks":[{"id":t.id,"title":t.title,"category":t.category,"priority":t.priority,
                "duration_minutes":t.duration_minutes,"deadline":t.deadline,"completed":t.completed} for t in tasks],
      "activity":None if not a else {"focus_minutes":a.focus_minutes,"break_minutes":a.break_minutes,
        "distraction_minutes":a.distraction_minutes,"sleep_hours":a.sleep_hours,"energy_level":a.energy_level},
      "latest":None if not r else {"id":r.id,"score":r.score,"analysis":json.loads(r.insights),
        "schedule":json.loads(r.schedule),"recommendations":json.loads(r.recommendations)}}

@app.post("/api/tasks")
def add_task(x:TaskIn, db:Session=Depends(get_db)):
    u=demo_user(db); t=Task(user_id=u.id,**x.model_dump()); db.add(t); db.commit(); db.refresh(t)
    return {"id":t.id}

@app.patch("/api/tasks/{tid}/complete")
def toggle(tid:int, db:Session=Depends(get_db)):
    t=db.get(Task,tid)
    if not t: raise HTTPException(404,"Task not found")
    t.completed=not t.completed; db.commit()
    return {"completed":t.completed}

@app.delete("/api/tasks/{tid}")
def delete(tid:int, db:Session=Depends(get_db)):
    t=db.get(Task,tid)
    if not t: raise HTTPException(404,"Task not found")
    db.delete(t); db.commit(); return {"ok":True}

@app.post("/api/activity")
def save_activity(x:ActivityIn, db:Session=Depends(get_db)):
    u=demo_user(db)
    a=db.query(Activity).filter(Activity.user_id==u.id,Activity.activity_date==date.today()).first()
    if not a: a=Activity(user_id=u.id,activity_date=date.today()); db.add(a)
    for k,v in x.model_dump().items(): setattr(a,k,v)
    db.commit(); return {"ok":True}

@app.post("/api/agent/run")
def run_agent(db:Session=Depends(get_db)):
    u=demo_user(db)
    tasks=db.query(Task).filter(Task.user_id==u.id).all()
    a=db.query(Activity).filter(Activity.user_id==u.id,Activity.activity_date==date.today()).first()
    result=agent.run(tasks,a)
    r=AgentRun(user_id=u.id,score=result["score"],insights=json.dumps(result["analysis"]),
               schedule=json.dumps(result["schedule"]),recommendations=json.dumps(result["recommendations"]))
    db.add(r); db.commit(); db.refresh(r)
    result["run_id"]=r.id
    return result

@app.post("/api/feedback")
def feedback(x:FeedbackIn, db:Session=Depends(get_db)):
    u=demo_user(db); db.add(Feedback(user_id=u.id,**x.model_dump())); db.commit()
    return {"ok":True}
