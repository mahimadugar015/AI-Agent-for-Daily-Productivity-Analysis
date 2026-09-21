from datetime import datetime, timedelta

WEIGHT = {"High": 3, "Medium": 2, "Low": 1}

class TaskAgent:
    def prioritize(self, tasks):
        return sorted(tasks, key=lambda t: (-WEIGHT.get(t.priority, 2), 0 if t.deadline else 1, t.duration_minutes))

class AnalysisAgent:
    def analyze(self, tasks, activity):
        total = len(tasks)
        completed = sum(t.completed for t in tasks)
        completion = completed / total * 100 if total else 0
        focus = activity.focus_minutes if activity else 0
        distraction = activity.distraction_minutes if activity else 0
        sleep = activity.sleep_hours if activity else 7
        energy = activity.energy_level if activity else 3

        focus_score = min(focus / 360 * 100, 100)
        distraction_score = max(0, 100 - min(distraction / 180 * 100, 100))
        sleep_score = min(sleep / 8 * 100, 100)
        energy_score = energy / 5 * 100

        score = round(.35*completion + .30*focus_score + .15*distraction_score +
                      .10*sleep_score + .10*energy_score)

        insights = []
        if completion >= 75: insights.append("Strong task completion rate today.")
        elif total: insights.append("Several planned tasks remain incomplete.")
        if focus >= 180: insights.append("You achieved a healthy amount of focused work.")
        else: insights.append("Focused work time is below the target range.")
        if distraction >= 60: insights.append("Distraction time is high; use notification-free focus blocks.")
        if sleep < 6.5: insights.append("Low sleep duration may reduce sustained concentration.")
        if energy >= 4: insights.append("High energy detected; use it for high-priority work.")

        return {
            "score": score, "completion_rate": round(completion,1),
            "focus_minutes": focus, "distraction_minutes": distraction,
            "sleep_hours": sleep, "energy_level": energy, "insights": insights
        }

class PlanningAgent:
    def create_plan(self, tasks, available=480):
        current = datetime.now().replace(second=0, microsecond=0)
        plan, remaining = [], available
        for t in tasks:
            if t.completed or remaining <= 0: continue
            duration = min(t.duration_minutes, remaining)
            end = current + timedelta(minutes=duration)
            plan.append({
                "time": f"{current.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')}",
                "task": t.title, "priority": t.priority, "duration": duration
            })
            current = end + timedelta(minutes=15)
            remaining -= duration + 15
        return plan

class RecommendationAgent:
    def recommend(self, a):
        r = []
        if a["completion_rate"] < 70:
            r.append("Limit the next work block to one or two high-priority tasks.")
        if a["focus_minutes"] < 180:
            r.append("Use two 45–60 minute distraction-free focus sessions.")
        if a["distraction_minutes"] >= 60:
            r.append("Enable notification-free mode during focus sessions.")
        if a["sleep_hours"] < 7:
            r.append("Protect a consistent sleep window for tomorrow.")
        if not r:
            r.append("Maintain the current routine and gradually improve focus quality.")
        return r

class FeedbackAgent:
    def summarize(self, feedback):
        if not feedback: return {"total": 0, "useful_rate": 0}
        return {"total": len(feedback),
                "useful_rate": round(sum(f.useful for f in feedback)/len(feedback)*100,1)}

class ProductivityOrchestrator:
    def run(self, tasks, activity):
        ordered = TaskAgent().prioritize(tasks)
        analysis = AnalysisAgent().analyze(tasks, activity)
        schedule = PlanningAgent().create_plan(ordered)
        recommendations = RecommendationAgent().recommend(analysis)
        return {
            "score": analysis["score"],
            "analysis": analysis,
            "schedule": schedule,
            "recommendations": recommendations,
            "agents": ["Task Agent","Analysis Agent","Planning Agent","Recommendation Agent","Feedback Agent"]
        }
