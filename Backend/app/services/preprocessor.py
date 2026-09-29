import re
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

def normalize_markdown_artifacts(text: str) -> str:
    """Normalize markdown links and mailto wrappers into standard plain text."""
    # Convert [display](mailto:email@domain.com) -> display <email@domain.com>
    cleaned = re.sub(r'\[([^\]]*)\]\(mailto:([^)]+)\)', r'\1 <\2>', text)
    # Convert [label](http...) -> http...
    cleaned = re.sub(r'\[([^\]]*)\]\((https?://[^)]+)\)', r'\2', cleaned)
    # Standalone [text](url)
    cleaned = re.sub(r'\[([^\]]*)\]\(([^)]+)\)', r'\2', cleaned)
    return cleaned

URL_REGEX = re.compile(
    r'(?:https?://|www\.)[^\s<>"\'{}|\\^`\[\]()]+|(?<![@\w.-])(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|xyz|info|biz|top|me|live|cc|online|site|app|link|click|vip|co|in|us|uk|example)[^\s<>"\'{}|\\^`\[\]()]*',
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
    """Find all valid HTTP/HTTPS and bare domain URLs in text, safely filtering email domains and markdown brackets."""
    norm_text = normalize_markdown_artifacts(text)
    
    # Extract email domains so we don't treat bare email domains as standalone web links
    email_domains = set(re.findall(r'[a-zA-Z0-9_.+-]+@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', norm_text, re.IGNORECASE))
    
    found = URL_REGEX.findall(norm_text)
    cleaned_urls = []
    for u in found:
        # Strip trailing and leading punctuation, brackets, parentheses, quotes
        u_clean = u.rstrip(".,;:!?)'\"\\]\\[<>{} ")
        u_clean = u_clean.lstrip("([{\"'<")
        if not u_clean or u_clean.lower().startswith("mailto:"):
            continue
        # Skip bare domain if it is actually just an email address domain
        if not u_clean.startswith("http://") and not u_clean.startswith("https://") and not u_clean.startswith("www."):
            if u_clean.lower() in email_domains:
                continue
        if not u_clean.startswith("http://") and not u_clean.startswith("https://"):
            u_clean = "http://" + u_clean
        if u_clean not in cleaned_urls:
            cleaned_urls.append(u_clean)
    return cleaned_urls

def extract_sender_info(raw_text: str) -> Optional[str]:
    """Look for standard email headers (From:, Reply-To:) or first email address."""
    norm_text = normalize_markdown_artifacts(raw_text)

    def clean_sender(val: str) -> str:
        s = re.sub(r'mailto:', '', val, flags=re.IGNORECASE)
        s = re.sub(r'[\[\]]', '', s).strip()
        m = re.search(r"^(.*?)(?:<([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)>)?$", s)
        if m:
            disp = (m.group(1) or "").strip()
            addr = m.group(2) or ""
            if disp == addr and addr:
                return addr
        return s

    from_match = re.search(r'From:\s*(.+?)(?:\r?\n|$)', norm_text, re.IGNORECASE)
    if from_match:
        return clean_sender(from_match.group(1))
    
    # Check for Sender:
    sender_match = re.search(r'Sender:\s*(.+?)(?:\r?\n|$)', norm_text, re.IGNORECASE)
    if sender_match:
        return clean_sender(sender_match.group(1))

    # Check for Reply-To:
    reply_match = re.search(r'Reply-To:\s*(.+?)(?:\r?\n|$)', norm_text, re.IGNORECASE)
    if reply_match:
        return clean_sender(reply_match.group(1))

    # Fallback to any detected email address in first 3 lines
    lines = norm_text.strip().splitlines()[:3]
    top_block = " ".join(lines)
    emails = EMAIL_REGEX.findall(top_block)
    if emails:
        return emails[0]
    
    return None

def extract_subject(raw_text: str) -> Optional[str]:
    """Extract Subject: header if present."""
    norm_text = normalize_markdown_artifacts(raw_text)
    subj_match = re.search(r'Subject:\s*(.+?)(?:\r?\n|$)', norm_text, re.IGNORECASE)
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
    norm_text = normalize_markdown_artifacts(raw_text)
    lines = norm_text.strip().splitlines()
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
    return cleaned if cleaned else norm_text.strip()

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
