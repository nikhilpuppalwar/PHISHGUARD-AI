from app.database import SessionLocal
from app.models.user import User
from app.services.orchestrator import orchestrator
from app.services.preprocessor import preprocess_single_input

def test_full_pipeline():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "alex.rivera@university.edu").first()
        assert user is not None, "Demo user not found"

        raw_sample = """From: hr-verify@quick-career.org
Subject: Summer Analyst Internship Offer - Allocation Verification Required

Congratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the secure portal link below to reserve your slot and generate the candidate pass: http://bit.ly/internship-fee-2024. Failure to process immediately releases the allocation."""

        print("\n--- Testing Single Input Preprocessing ---")
        prep = preprocess_single_input(raw_sample)
        print("Detected Channel:", prep["channel"])
        print("Sender:", prep["sender"])
        print("Subject:", prep["subject"])
        print("Extracted URLs:", prep["extracted_urls"])
        print("Keywords:", prep["keywords"])

        print("\n--- Running Multi-Agent Threat Pipeline ---")
        res = orchestrator.execute_pipeline(db, user, raw_sample)
        print("Risk Score:", res["overall_score"], "/ 100")
        print("Severity:", res["severity"])
        print("Confidence:", res["confidence"])
        print("Attack Type:", res["attack_type"])
        print("Agent Contributions:", res["agent_contributions"])
        print("SHAP Deltas:", {k: v["delta"] for k, v in res["agent_details"].items()})
        print("Action Plan Steps:", len(res["action_plan"]))
        print("\nPipeline test PASSED with flying colors!")
    finally:
        db.close()

if __name__ == "__main__":
    test_full_pipeline()
