import uuid
from datetime import datetime
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserProfile
from app.models.meta import AttackType, Dataset, ModelVersion, Incident
from app.services.auth_service import hash_password
from app.services.rag_service import DEFAULT_INCIDENTS

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Attack Types
        attack_types_data = [
            {
                "name": "Internship Scam",
                "description": "Fraudulent job or internship offers targeting students and early-career seekers demanding advance registration, candidate pass fees, or personal data.",
                "sample_indicators": [
                    "High synthetic urgency (within 2 hours)",
                    "Upfront advance registration fee demand (e.g. ₹2,000 / $50)",
                    "Shortened redirect URL (bit.ly / tinyurl)",
                    "Unauthenticated hr-verify sender domain"
                ],
                "mitigation_tips": [
                    "Legitimate organizations never ask for training or onboarding fees.",
                    "Verify recruiter credentials on official corporate careers portal.",
                    "Cross-check with university career placement cell."
                ]
            },
            {
                "name": "Credential Phishing",
                "description": "Attempts to harvest sensitive login passwords, MFA codes, or access tokens through spoofed sign-in portals.",
                "sample_indicators": [
                    "Fake Microsoft 365 / Google SSO portal lookalike",
                    "Immediate threat of mailbox or account termination",
                    "Domain mismatch in login form target"
                ],
                "mitigation_tips": [
                    "Check URL domain carefully before typing credentials.",
                    "Enable hardware or authenticator app Multi-Factor Authentication.",
                    "Never enter passwords into links arriving via unprompted email."
                ]
            },
            {
                "name": "Invoice Fraud",
                "description": "Deceptive billing or wire requests impersonating verified vendors or leadership to alter payee bank accounts.",
                "sample_indicators": [
                    "Urgent payment rerouting request",
                    "Executive / supplier display name spoofing",
                    "Updated foreign routing or crypto payment link"
                ],
                "mitigation_tips": [
                    "Always execute out-of-band phone verification for bank detail changes.",
                    "Require dual-authorization for high-value fund transfers."
                ]
            },
            {
                "name": "Advance-Fee Scam",
                "description": "Promises of substantial prizes, lottery proceeds, or inheritance conditional on upfront customs or clearance fee.",
                "sample_indicators": [
                    "Unsolicited lottery / grant award notification",
                    "Immediate demand for processing fee before release",
                    "Free webmail sender address"
                ],
                "mitigation_tips": [
                    "You cannot win a lottery you never entered.",
                    "Never pay fees to receive supposed funds or prizes."
                ]
            },
            {
                "name": "Smishing / Urgent Delivery Scam",
                "description": "Mobile SMS social engineering exploiting courier delivery failures to harvest credit card information.",
                "sample_indicators": [
                    "Urgent package detention alert",
                    "Shortened link leading to fake USPS/FedEx postal portal",
                    "Nominal redelivery fee ($1.99) payment trap"
                ],
                "mitigation_tips": [
                    "Do not click links in unsolicited package delivery SMS.",
                    "Track shipments directly on official courier website using your original tracking number."
                ]
            },
            {
                "name": "Generic Phishing",
                "description": "Broad social-engineering campaigns utilizing urgency and generic links to bypass perimeter security filters.",
                "sample_indicators": [
                    "Generic 'Dear Valued Customer' greeting",
                    "Unverified sender domain",
                    "Urgent call-to-action button"
                ],
                "mitigation_tips": [
                    "Check sender headers and SPF/DKIM verification indicators.",
                    "Report suspicious emails to your IT security helpdesk."
                ]
            }
        ]

        for at in attack_types_data:
            existing = db.query(AttackType).filter(AttackType.name == at["name"]).first()
            if not existing:
                db.add(AttackType(
                    name=at["name"],
                    description=at["description"],
                    sample_indicators=at["sample_indicators"],
                    mitigation_tips=at["mitigation_tips"]
                ))
        db.commit()

        # 2. Seed Dataset Inventory (per database.md §7)
        datasets_seed = [
            {"dataset_id": "ds_phiusiil", "name": "PhiUSIIL_Phishing_URL_Dataset", "path_or_source": "dataset/PhiUSIIL_Phishing_URL_Dataset.csv", "row_count": 235795, "positive_count": 134850, "negative_count": 100945, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_phishing_email", "name": "phishing_email.csv", "path_or_source": "dataset/Email content/phishing_email.csv", "row_count": 82486, "positive_count": 42891, "negative_count": 39595, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_ceas08", "name": "CEAS_08.csv", "path_or_source": "dataset/Email content/CEAS_08.csv", "row_count": 39154, "positive_count": 21842, "negative_count": 17312, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_enron_email", "name": "Enron.csv", "path_or_source": "dataset/Email content/Enron.csv", "row_count": 29767, "positive_count": 13976, "negative_count": 15791, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_spamassassin", "name": "SpamAssasin.csv", "path_or_source": "dataset/Email content/SpamAssasin.csv", "row_count": 5809, "positive_count": 1718, "negative_count": 4091, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_ling", "name": "Ling.csv", "path_or_source": "dataset/Email content/Ling.csv", "row_count": 2859, "positive_count": 458, "negative_count": 2401, "role": "primary", "version": "1.0"},
            {"dataset_id": "ds_spam_sms", "name": "spam_sms.csv", "path_or_source": "dataset/spam_sms.csv", "row_count": 5572, "positive_count": 747, "negative_count": 4825, "role": "sms", "version": "1.0"},
            {"dataset_id": "ds_nazario", "name": "Nazario.csv", "path_or_source": "dataset/Email content/Nazario.csv", "row_count": 1565, "positive_count": 1565, "negative_count": 0, "role": "augmentation", "version": "1.0"},
            {"dataset_id": "ds_nigerian_fraud", "name": "Nigerian_Fraud.csv", "path_or_source": "dataset/Email content/Nigerian_Fraud.csv", "row_count": 3332, "positive_count": 3332, "negative_count": 0, "role": "augmentation", "version": "1.0"},
            {"dataset_id": "ds_enron_fraud", "name": "enron_data_fraud_labeled_.csv", "path_or_source": "dataset/enron_data_fraud_labeled_.csv", "row_count": 447417, "positive_count": 12837, "negative_count": 434580, "role": "future_out_of_scope", "version": "1.0"},
            {"dataset_id": "ds_sender_features", "name": "Engineered Sender Feature Set", "path_or_source": "assembled from CEAS_08, Nazario, SpamAssassin headers", "row_count": 46528, "positive_count": 23400, "negative_count": 23128, "role": "primary", "version": "2.0"}
        ]

        for ds in datasets_seed:
            existing_ds = db.query(Dataset).filter(Dataset.dataset_id == ds["dataset_id"]).first()
            if not existing_ds:
                db.add(Dataset(**ds))
        db.commit()

        # 3. Seed Model Versions
        models_seed = [
            {
                "model_id": "mod_tfidf_lr_v2",
                "agent_type": "text",
                "algorithm": "TF-IDF + Logistic Regression",
                "dataset_ids": ["ds_phishing_email", "ds_ceas08", "ds_enron_email", "ds_spamassassin", "ds_ling", "ds_spam_sms"],
                "metrics": {"precision": 0.962, "recall": 0.954, "f1": 0.958, "accuracy": 0.961, "roc_auc": 0.984},
                "is_active": True
            },
            {
                "model_id": "mod_xgboost_phiusiil_v2",
                "agent_type": "url",
                "algorithm": "XGBoost (PhiUSIIL 54 Engineered Features)",
                "dataset_ids": ["ds_phiusiil"],
                "metrics": {"precision": 0.984, "recall": 0.978, "f1": 0.981, "accuracy": 0.983, "roc_auc": 0.996},
                "is_active": True
            },
            {
                "model_id": "mod_random_forest_sender_v2",
                "agent_type": "sender",
                "algorithm": "Random Forest (Header Authentication & Sender Features)",
                "dataset_ids": ["ds_sender_features"],
                "metrics": {"precision": 0.948, "recall": 0.932, "f1": 0.940, "accuracy": 0.945, "roc_auc": 0.976},
                "is_active": True
            }
        ]

        for mv in models_seed:
            existing_mv = db.query(ModelVersion).filter(ModelVersion.model_id == mv["model_id"]).first()
            if not existing_mv:
                db.add(ModelVersion(**mv))
        db.commit()

        # 4. Seed Incidents for RAG
        for inc in DEFAULT_INCIDENTS:
            existing_inc = db.query(Incident).filter(Incident.title == inc["title"]).first()
            if not existing_inc:
                at_obj = db.query(AttackType).filter(AttackType.name == inc["attack_type"]).first()
                db.add(Incident(
                    title=inc["title"],
                    source="dataset",
                    attack_type_id=at_obj.attack_type_id if at_obj else None,
                    content_summary=inc["content_summary"],
                    indicators=inc["indicators"],
                    similarity_keywords=inc["keywords"],
                    embedding_id=f"emb_{uuid.uuid4().hex[:8]}"
                ))
        db.commit()

        # 5. Seed Demo User (Alex Rivera, Student)
        demo_email = "alex.rivera@university.edu"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            user = User(
                email=demo_email,
                password_hash=hash_password("Password123!")
            )
            db.add(user)
            db.flush()

            profile = UserProfile(
                user_id=user.user_id,
                preferred_name="Alex",
                role="Student",
                common_communication_types=["University Email", "Internship Portals & LinkedIn", "Personal Gmail"],
                security_awareness="Beginner",
                preferred_explanation_style="Simple"
            )
            db.add(profile)
            db.commit()

        print("Database seeded successfully with Attack Types, Datasets, Model Versions, Incidents, and Demo User!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
