import sqlite3
from datetime import datetime

def run_migration():
    conn = sqlite3.connect('d:/WebSites/PhishGuard AI/Backend/phishguard.db')
    c = conn.cursor()

    c.execute('PRAGMA table_info(user_profiles)')
    existing_cols = [r[1] for r in c.fetchall()]

    new_cols = [
        ('industry', 'VARCHAR(150)'),
        ('organization_type', 'VARCHAR(150)'),
        ('common_services', 'JSON DEFAULT "[]"'),
        ('online_activities', 'JSON DEFAULT "[]"'),
        ('technical_experience', 'VARCHAR(50) DEFAULT "Intermediate"'),
        ('banking_usage', 'BOOLEAN DEFAULT 0'),
        ('online_shopping', 'BOOLEAN DEFAULT 0'),
        ('work_email_usage', 'BOOLEAN DEFAULT 0'),
        ('profile_preferences', 'JSON DEFAULT "{}"'),
        ('custom_information', 'JSON DEFAULT "{}"'),
        ('risk_preferences', 'JSON DEFAULT "{}"'),
        ('profile_completion', 'INTEGER DEFAULT 20'),
        ('created_at', 'DATETIME')
    ]

    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            c.execute(f'ALTER TABLE user_profiles ADD COLUMN {col_name} {col_type}')
            print(f'Added column {col_name} to user_profiles')

    c.execute('''
    CREATE TABLE IF NOT EXISTS profile_conversations (
        conversation_id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        conversation_type VARCHAR(50) DEFAULT 'onboarding',
        messages JSON DEFAULT '[]',
        profile_updates JSON DEFAULT '[]',
        pending_changes JSON DEFAULT '[]',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
    ''')
    conn.commit()
    conn.close()
    print('Profile database migration completed successfully!')

if __name__ == '__main__':
    run_migration()
