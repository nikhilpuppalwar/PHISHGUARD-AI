import sys
from app.database import SessionLocal
from app.models.user import User
from app.services.orchestrator import orchestrator

def run_tests():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("[FAIL] No user found in database.")
            sys.exit(1)

        print(f"[TEST SETUP] Testing with authenticated user: {user.email} (ID: {user.user_id})")

        # -------------------------------------------------------------
        # TEST 1: Legitimate Email (Low Risk, No Forced Phishing Category)
        # -------------------------------------------------------------
        print("\n" + "="*60)
        print("TEST 1: Legitimate Campus Communication (Expected: Low Risk)")
        print("="*60)
        legit_text = (
            "Hi Alex,\n\n"
            "Please find attached the slides and syllabus for CS301 Algorithms from yesterday's lecture.\n"
            "The campus library study group will meet next Tuesday at 3:00 PM in Room 204.\n\n"
            "Best regards,\nProf. Miller"
        )
        res_legit = orchestrator.execute_pipeline(db, user, legit_text)

        print(f"Risk Score: {res_legit['overall_score']:.1f}/100")
        print(f"Severity: {res_legit['severity']}")
        print(f"Attack Classification: '{res_legit['attack_type']}'")
        print(f"Original Content Preserved: {res_legit.get('original_content') == legit_text}")

        assert res_legit['overall_score'] < 40.0, f"Expected low risk score (<40), got {res_legit['overall_score']}"
        assert "no significant" in res_legit['attack_type'].lower() or "benign" in res_legit.get('attack_classification', {}).get('category', '').lower(), \
            f"Attack classification was inappropriately forced: {res_legit['attack_type']}"
        print("[PASS] Test 1: Legitimate communication correctly classified with low risk and no forced phishing attack type.")

        # -------------------------------------------------------------
        # TEST 2: High-Risk Phishing (Internship Scam with Payment Demand)
        # -------------------------------------------------------------
        print("\n" + "="*60)
        print("TEST 2: High-Risk Internship Phishing (Expected: High Risk, Internship Scam)")
        print("="*60)
        phish_text = (
            "From: hr-verify@quick-career.org\n"
            "Subject: Summer Analyst Internship Offer - Allocation Verification Required\n\n"
            "Congratulations! You have been selected for the Summer Analyst internship program.\n"
            "Pay ₹2,000 within 2 hours using the secure portal link below to reserve your slot and generate the candidate pass:\n"
            "http://bit.ly/internship-fee-2024\n\n"
            "Failure to process immediately releases the allocation."
        )
        res_phish = orchestrator.execute_pipeline(db, user, phish_text)

        print(f"Risk Score: {res_phish['overall_score']:.1f}/100")
        print(f"Severity: {res_phish['severity']}")
        print(f"Attack Classification: '{res_phish['attack_type']}'")
        print(f"Agent Trace Steps: {len(res_phish.get('agent_trace', []))}")
        print(f"Evidence Coverage Dimensions: {len(res_phish.get('evidence_coverage', {}))}")
        print(f"Action Plan Steps: {len(res_phish.get('action_plan', []))}")
        print(f"Before You Act Checks: {len(res_phish.get('before_you_act', []))}")

        assert res_phish['overall_score'] >= 75.0, f"Expected high risk (>=75), got {res_phish['overall_score']}"
        assert "internship" in res_phish['attack_type'].lower(), f"Expected internship scam category, got: {res_phish['attack_type']}"
        assert res_phish.get('original_content') == phish_text, "Original content was altered!"
        assert len(res_phish.get('agent_trace', [])) == 11, f"Expected 11 trace steps, got {len(res_phish.get('agent_trace', []))}"
        assert len(res_phish.get('evidence_coverage', {})) == 6, f"Expected 6 evidence dimensions, got {len(res_phish.get('evidence_coverage', {}))}"

        # Check for NO hardcoded static persona references ("nuclear scientist", etc)
        action_text = " ".join(res_phish.get('action_plan', []))
        expl_text = res_phish.get('explanation', '')
        assert "nuclear" not in action_text.lower() and "nuclear" not in expl_text.lower(), "Found hardcoded 'nuclear' persona text!"
        assert "clearance" not in action_text.lower() and "clearance" not in expl_text.lower(), "Found hardcoded 'clearance' persona text!"

        print("[PASS] Test 2: High-risk internship scam correctly detected with full trace, evidence coverage, and dynamic action plan.")

        print("\n" + "="*60)
        print("ALL TESTS PASSED SUCCESSFULLY!")
        print("="*60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
