import re
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

URL_REGEX = re.compile(
    r'(?:https?://|www\.)[^\s<>"\'{}|\\^`]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|xyz|info|biz|top|me|live|cc|online|site|app|link|click|vip|co|in|us|uk)[^\s<>"\'{}|\\^`]*',
    re.IGNORECASE
)

EMAIL_REGEX = re.compile(
    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    re.IGNORECASE
)

PHONE_REGEX = re.compile(
    r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
)

def extract_urls(text: str) -> List[str]:
    """Find all valid HTTP/HTTPS and bare domain URLs in text."""
    found = URL_REGEX.findall(text)
    cleaned_urls = []
    for u in found:
        # Strip trailing punctuation often caught in sentences
        u_clean = u.rstrip(".,;:!?)'\"")
        if not u_clean.startswith("http://") and not u_clean.startswith("https://"):
            u_clean = "http://" + u_clean
        if u_clean not in cleaned_urls:
            cleaned_urls.append(u_clean)
    return cleaned_urls

def extract_sender_info(raw_text: str) -> Optional[str]:
    """Look for standard email headers (From:, Reply-To:) or first email address."""
    # Pattern: From: Name <email@example.com> or From: email@example.com
    from_match = re.search(r'From:\s*(.+?)(?:\r?\n|$)', raw_text, re.IGNORECASE)
    if from_match:
        from_str = from_match.group(1).strip()
        return from_str
    
    # Check for Sender:
    sender_match = re.search(r'Sender:\s*(.+?)(?:\r?\n|$)', raw_text, re.IGNORECASE)
    if sender_match:
        return sender_match.group(1).strip()

    # Check for Reply-To:
    reply_match = re.search(r'Reply-To:\s*(.+?)(?:\r?\n|$)', raw_text, re.IGNORECASE)
    if reply_match:
        return reply_match.group(1).strip()

    # Fallback to any detected email address in first 3 lines
    lines = raw_text.strip().splitlines()[:3]
    top_block = " ".join(lines)
    emails = EMAIL_REGEX.findall(top_block)
    if emails:
        return emails[0]
    
    return None

def extract_subject(raw_text: str) -> Optional[str]:
    """Extract Subject: header if present."""
    subj_match = re.search(r'Subject:\s*(.+?)(?:\r?\n|$)', raw_text, re.IGNORECASE)
    if subj_match:
        return subj_match.group(1).strip()
    return None

def detect_channel(raw_text: str, urls: List[str], sender: Optional[str]) -> str:
    """Infer channel as email, sms, or url."""
    text_stripped = raw_text.strip()
    
    # Solitary URL
    if len(urls) == 1 and (text_stripped == urls[0] or text_stripped.replace("http://", "").replace("https://", "") == urls[0].replace("http://", "").replace("https://", "")):
        return "url"
    
    # Email indicators
    if re.search(r'\b(From:|Subject:|To:|Date:|MIME-Version:|Return-Path:)\b', raw_text, re.IGNORECASE) or (sender and "@" in sender and len(text_stripped) > 200):
        return "email"
    
    # SMS indicators: short length, phone numbers, STOP, urgent verification code
    if len(text_stripped) <= 280 and (PHONE_REGEX.search(text_stripped) or re.search(r'\b(txt|text|sms|stop|opt out|otp|msg|code)\b', text_stripped, re.IGNORECASE)):
        return "sms"
    
    if "@" in text_stripped or "dear " in text_stripped.lower() or "regards" in text_stripped.lower():
        return "email"
    
    if len(text_stripped) < 180:
        return "sms"
    
    return "email"

def clean_body_text(raw_text: str) -> str:
    """Strip standard email headers to isolate the message body."""
    lines = raw_text.strip().splitlines()
    body_lines = []
    in_headers = True
    
    for line in lines:
        if in_headers:
            if re.match(r'^(From|To|Subject|Date|Cc|Bcc|Reply-To|Return-Path|MIME-Version|Content-Type):', line, re.IGNORECASE):
                continue
            if line.strip() == "":
                in_headers = False
                continue
        body_lines.append(line)
        
    cleaned = "\n".join(body_lines).strip()
    return cleaned if cleaned else raw_text.strip()

def preprocess_single_input(raw_input: str, channel_override: Optional[str] = None, sender_override: Optional[str] = None, subject_override: Optional[str] = None) -> Dict[str, Any]:
    """Single unified input parsing engine."""
    extracted_urls = extract_urls(raw_input)
    extracted_sender = sender_override or extract_sender_info(raw_input)
    extracted_subject = subject_override or extract_subject(raw_input)
    
    detected_chan = channel_override or detect_channel(raw_input, extracted_urls, extracted_sender)
    cleaned_text = clean_body_text(raw_input)
    
    # Detect heuristic keywords
    keywords = []
    lowered = raw_input.lower()
    if any(k in lowered for k in ["fee", "payment", "pay", "₹", "$", "transfer", "deposit", "advance", "bank", "crypto"]):
        keywords.append("Financial / Payment Request")
    if any(k in lowered for k in ["within 2 hours", "immediate", "urgent", "deadline", "suspended", "failure to process", "action required"]):
        keywords.append("High Urgency / Coercive Deadline")
    if any(k in lowered for k in ["login", "password", "credential", "verify account", "candidate pass", "portal link"]):
        keywords.append("Credential / Portal Bait")
    if any(k in lowered for k in ["internship", "summer analyst", "hiring", "offer letter", "recruitment", "interview"]):
        keywords.append("Recruitment / Internship Scam Vector")
    if any("bit.ly" in u or "tinyurl" in u or "t.co" in u or "is.gd" in u for u in extracted_urls):
        keywords.append("Shortened / Obfuscated Link")
        
    return {
        "channel": detected_chan,
        "cleaned_text": cleaned_text,
        "raw_text": raw_input,
        "sender": extracted_sender,
        "subject": extracted_subject,
        "extracted_urls": extracted_urls,
        "keywords": keywords,
    }
