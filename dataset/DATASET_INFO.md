# Personalized Phishing Detection — Dataset Documentation

This document provides comprehensive information regarding the datasets located in `d:\WebSites\Personialize phishing detection\dataset`. It details file structures, row counts, column descriptions, data types, missing value distributions, target class balances, and feature categories for all **10 CSV datasets** (~1.02 GB total size, **853,756 total records**).

---

## 📊 Executive Summary & Dataset Overview

| File Path / Name | Category / Domain | File Size | Row Count | Col Count | Target Attribute | Target Class Distribution | Primary Key / Feature Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`PhiUSIIL_Phishing_URL_Dataset.csv`** | URL Phishing Features | 51.65 MB | **235,795** | 55 | `label` | `1` (Phishing): 134,850 (57.2%)<br>`0` (Legitimate): 100,945 (42.8%) | Engineered URL & HTML DOM features |
| **`enron_data_fraud_labeled_.csv`** | Corporate Email & Fraud | 717.07 MB | **447,417** | 32 | `Label` / `POI-Present` | `0` (Normal): 434,580 (97.1%)<br>`1` (Fraud): 12,837 (2.9%) | Enron Corpus Metadata + Full Text |
| **`spam_sms.csv`** | Mobile SMS Spam | 491.86 KB | **5,572** | 5 | `v1` | `ham`: 4,825 (86.6%)<br>`spam`: 747 (13.4%) | Short Text Content |
| **`Email content/CEAS_08.csv`** | Email Content Phishing | 64.76 MB | **39,154** | 7 | `label` | `1` (Phishing): 21,842 (55.8%)<br>`0` (Legitimate): 17,312 (44.2%) | Header Metadata + Email Body Text |
| **`Email content/Enron.csv`** | Email Content Phishing | 43.45 MB | **29,767** | 3 | `label` | `0` (Legitimate): 15,791 (53.0%)<br>`1` (Spam/Phishing): 13,976 (47.0%) | Subject + Body Text |
| **`Email content/Ling.csv`** | Academic/Spam Email | 8.91 MB | **2,859** | 3 | `label` | `0` (Legitimate): 2,401 (84.0%)<br>`1` (Spam): 458 (16.0%) | Subject + Body Text |
| **`Email content/Nazario.csv`** | Phishing Email Corpus | 7.45 MB | **1,565** | 7 | `label` | `1` (Phishing): 1,565 (100.0%) | Pure Phishing Target Corpus |
| **`Email content/Nigerian_Fraud.csv`** | Advance-Fee Fraud | 8.77 MB | **3,332** | 7 | `label` | `1` (Fraud): 3,332 (100.0%) | Scam Email Corpus |
| **`Email content/phishing_email.csv`** | Combined Email Phishing | 101.67 MB | **82,486** | 2 | `label` | `1` (Phishing): 42,891 (52.0%)<br>`0` (Legitimate): 39,595 (48.0%) | Combined Text NLP Corpus |
| **`Email content/SpamAssasin.csv`** | Email Content Spam | 14.19 MB | **5,809** | 7 | `label` | `0` (Legitimate): 4,091 (70.4%)<br>`1` (Spam): 1,718 (29.6%) | SpamAssassin Email Corpus |
| **TOTAL** | — | **~1.02 GB** | **853,756** | — | — | — | — |

---

## 1. Main Directory Datasets

### 1.1 `PhiUSIIL_Phishing_URL_Dataset.csv`

* **Path**: `dataset/PhiUSIIL_Phishing_URL_Dataset.csv`
* **File Size**: 51.65 MB
* **Rows**: 235,795 | **Columns**: 55
* **Target Column**: `label` (Integer: `1` = Phishing, `0` = Legitimate)
* **Class Distribution**:
  * `1` (Phishing): 134,850 (57.19%)
  * `0` (Legitimate): 100,945 (42.81%)

#### Complete Column Specification (55 Attributes)

| # | Attribute Name | Data Type | Null Count | Unique Values | Sample Value | Feature Category & Description |
|---|---|---|---|---|---|---|
| 1 | `URL` | `object` | 0 | 235,795 | `https://www.southbankmosaics.com` | Full Raw URL string |
| 2 | `URLLength` | `int64` | 0 | 545 | `31` | Character count of full URL |
| 3 | `Domain` | `object` | 0 | 173,086 | `www.southbankmosaics.com` | Extracted domain name |
| 4 | `DomainLength` | `int64` | 0 | 145 | `24` | Character length of domain |
| 5 | `IsDomainIP` | `int64` | 0 | 2 | `0` | Binary (1 if domain is IP address, 0 otherwise) |
| 6 | `TLD` | `object` | 0 | 1,180 | `com` | Top-Level Domain (TLD) extension |
| 7 | `URLSimilarityIndex` | `float64` | 0 | 6,564 | `100.0` | Similarity ratio between URL and target domain |
| 8 | `CharContinuationRate` | `float64` | 0 | 951 | `1.0` | Rate of character sequence continuation |
| 9 | `TLDLegitimateProb` | `float64` | 0 | 3,112 | `0.5229` | Probability score of TLD legitimacy |
| 10 | `URLCharProb` | `float64` | 0 | 234,449 | `0.0619` | N-gram / character probability of URL |
| 11 | `TLDLength` | `int64` | 0 | 31 | `3` | Length of TLD |
| 12 | `NoOfSubDomain` | `int64` | 0 | 20 | `1` | Count of subdomains in URL |
| 13 | `HasObfuscation` | `int64` | 0 | 2 | `0` | Flag for hex/URL encoding obfuscation |
| 14 | `NoOfObfuscatedChar` | `int64` | 0 | 114 | `0` | Number of obfuscated characters |
| 15 | `ObfuscationRatio` | `float64` | 0 | 1,845 | `0.0` | Ratio of obfuscated characters to URL length |
| 16 | `NoOfLettersInURL` | `int64` | 0 | 449 | `18` | Count of alphabetic characters |
| 17 | `LetterRatioInURL` | `float64` | 0 | 851 | `0.581` | Ratio of letters in URL |
| 18 | `NoOfDegitsInURL` | `int64` | 0 | 238 | `0` | Count of numeric digits in URL |
| 19 | `DegitRatioInURL` | `float64` | 0 | 669 | `0.0` | Ratio of digits in URL |
| 20 | `NoOfEqualsInURL` | `int64` | 0 | 64 | `0` | Count of `=` characters |
| 21 | `NoOfQMarkInURL` | `int64` | 0 | 15 | `0` | Count of `?` characters |
| 22 | `NoOfAmpersandInURL` | `int64` | 0 | 57 | `0` | Count of `&` characters |
| 23 | `NoOfOtherSpecialCharsInURL` | `int64` | 0 | 116 | `1` | Count of other special characters in URL |
| 24 | `SpacialCharRatioInURL` | `float64` | 0 | 674 | `0.032` | Ratio of special characters in URL |
| 25 | `IsHTTPS` | `int64` | 0 | 2 | `1` | Binary flag (1 if scheme is HTTPS) |
| 26 | `LineOfCode` | `int64` | 0 | 8,981 | `558` | Total lines of HTML code on web page |
| 27 | `LargestLineLength` | `int64` | 0 | 26,081 | `9381` | Character count of longest line of HTML |
| 28 | `HasTitle` | `int64` | 0 | 2 | `1` | Binary flag if HTML page has `<title>` tag |
| 29 | `Title` | `object` | 0 | 165,301 | `Southbank Mosaics` | Webpage HTML Title string |
| 30 | `DomainTitleMatchScore` | `float64` | 0 | 101 | `0.0` | Matching score between domain and title |
| 31 | `URLTitleMatchScore` | `float64` | 0 | 1,001 | `0.0` | Matching score between URL path and title |
| 32 | `HasFavicon` | `int64` | 0 | 2 | `0` | Binary flag for presence of website favicon |
| 33 | `Robots` | `int64` | 0 | 2 | `1` | Binary flag if `robots.txt` is present/allows indexing |
| 34 | `IsResponsive` | `int64` | 0 | 2 | `1` | Flag for responsive design metadata |
| 35 | `NoOfURLRedirect` | `int64` | 0 | 14 | `0` | Count of HTTP redirects |
| 36 | `NoOfSelfRedirect` | `int64` | 0 | 10 | `0` | Count of self-referencing redirects |
| 37 | `HasDescription` | `int64` | 0 | 2 | `0` | Presence of HTML `<meta description>` |
| 38 | `NoOfPopup` | `int64` | 0 | 18 | `0` | Count of JavaScript popup prompts |
| 39 | `NoOfiFrame` | `int64` | 0 | 36 | `1` | Count of HTML `<iframe>` elements |
| 40 | `HasExternalFormSubmit` | `int64` | 0 | 2 | `0` | Flag for forms submitting to external domains |
| 41 | `HasSocialNet` | `int64` | 0 | 2 | `0` | Presence of social media profile links |
| 42 | `HasSubmitButton` | `int64` | 0 | 2 | `1` | Presence of form submit buttons |
| 43 | `HasHiddenFields` | `int64` | 0 | 2 | `1` | Presence of `<input type="hidden">` fields |
| 44 | `HasPasswordField` | `int64` | 0 | 2 | `0` | Presence of password input fields |
| 45 | `Bank` | `int64` | 0 | 2 | `1` | Keyword flag: Financial/Banking terms detected |
| 46 | `Pay` | `int64` | 0 | 2 | `0` | Keyword flag: Payment terms detected |
| 47 | `Crypto` | `int64` | 0 | 2 | `0` | Keyword flag: Cryptocurrency terms detected |
| 48 | `HasCopyrightInfo` | `int64` | 0 | 2 | `1` | Presence of copyright notices |
| 49 | `NoOfImage` | `int64` | 0 | 992 | `34` | Total count of `<img>` tags |
| 50 | `NoOfCSS` | `int64` | 0 | 209 | `20` | Count of CSS stylesheet references |
| 51 | `NoOfJS` | `int64` | 0 | 253 | `28` | Count of JavaScript file inclusions |
| 52 | `NoOfSelfRef` | `int64` | 0 | 1,374 | `119` | Count of self-referencing hyperlinks |
| 53 | `NoOfEmptyRef` | `int64` | 0 | 296 | `0` | Count of empty hyperlinks (`href="#"`) |
| 54 | `NoOfExternalRef` | `int64` | 0 | 1,191 | `124` | Count of external hyperlinks |
| 55 | **`label`** | `int64` | 0 | 2 | `1` | **Target Label**: `1` (Phishing), `0` (Legitimate) |

---

### 1.2 `enron_data_fraud_labeled_.csv`

* **Path**: `dataset/enron_data_fraud_labeled_.csv`
* **File Size**: 717.07 MB
* **Rows**: 447,417 | **Columns**: 32
* **Target Columns**: 
  * `Label` (`1` = Fraud/Suspicious: 12,837, `0` = Normal: 434,580)
  * `POI-Present` (`True` = Person of Interest Involved: 769, `False`: 446,648)

#### Column Specification (32 Attributes)

| Attribute Name | Data Type | Null Count | Description & Sample Value |
|---|---|---|---|
| `Folder-User` | `object` | 0 | Enron employee username (e.g. `arnold-j`) |
| `Folder-Name` | `object` | 0 | Mailbox directory path |
| `Message-ID` | `object` | 0 | Unique MIME message identifier |
| `Date` | `object` | 0 | RFC 2822 Timestamp |
| `From` | `object` | 0 | Sender email address |
| `To` | `object` | 0 | Recipient email address(es) |
| `Subject` | `object` | 1,109 | Email subject line |
| `Mime-Version` | `object` | 0 | MIME version header |
| `Content-Type` | `object` | 0 | Content type & charset header |
| `Content-Transfer-Encoding` | `object` | 0 | Encoding format (7bit / quoted-printable) |
| `X-From` | `object` | 0 | Display name & sender info |
| `X-To` | `object` | 1,170 | Display name & recipient info |
| `X-cc` | `object` | 40,915 | Carbon copy display header |
| `X-bcc` | `object` | 49,997 | Blind carbon copy header |
| `X-Folder` | `object` | 0 | Internal Mailbox folder path |
| `X-Origin` | `object` | 0 | Enron user origin |
| `X-FileName` | `object` | 25 | Lotus Notes NSF filename |
| `Body` | `object` | 0 | Full raw email body text |
| `Cc` | `object` | 0 | Parsed CC list |
| `Bcc` | `object` | 0 | Parsed BCC list |
| `Time` | `object` | 0 | Time metadata string |
| `Attendees` | `object` | 0 | Calendar attendee metadata |
| `Re` | `object` | 0 | Reply header flag |
| `Source` | `object` | 0 | Data source tag (`Enron Data`) |
| `Mail-ID` | `object` | 0 | Hashed unique mail identifier |
| `POI-Present` | `bool` | 0 | Boolean flag: Contains Enron Person Of Interest (POI) |
| `Suspicious-Folders` | `bool` | 0 | Boolean flag: Located in flagged suspicious directory |
| `Sender-Type` | `object` | 0 | Classification of sender (Internal/External) |
| `Unique-Mails-From-Sender` | `float64` | 0 | Count of unique emails sent by this sender |
| `Low-Comm` | `bool` | 0 | Flag indicating low communication frequency |
| `Contains-Reply-Forwards` | `bool` | 0 | Boolean flag: Email contains FW: or RE: threads |
| **`Label`** | `int64` | 0 | **Target Label**: `0` (Legitimate), `1` (Fraudulent) |

---

### 1.3 `spam_sms.csv`

* **Path**: `dataset/spam_sms.csv`
* **File Size**: 491.86 KB (Latin1/CP1252 Encoded)
* **Rows**: 5,572 | **Columns**: 5 (2 primary content columns + 3 overflow columns)
* **Target Column**: `v1` (`ham`: 4,825 [86.59%], `spam`: 747 [13.41%])

#### Column Specification

| Column Name | Data Type | Null Count | Description |
|---|---|---|---|
| **`v1`** | `object` | 0 | **Target Label**: `ham` (legitimate) vs `spam` |
| **`v2`** | `object` | 0 | Raw SMS message body text |
| `Unnamed: 2` | `object` | 5,522 | Overflow text fragment from unescaped commas |
| `Unnamed: 3` | `object` | 5,560 | Overflow text fragment |
| `Unnamed: 4` | `object` | 5,566 | Overflow text fragment |

---

## 2. `Email content` Subfolder Datasets

The `dataset/Email content/` directory contains 7 specialized text & metadata datasets focusing on email-based phishing, spam, and fraud detection.

### 2.1 Standard 7-Column Email Corpus Schema

Five datasets (`CEAS_08.csv`, `Nazario.csv`, `Nigerian_Fraud.csv`, `SpamAssasin.csv`) share a standardized 7-column schema:

| Column Name | Data Type | Description |
|---|---|---|
| `sender` | `object` | Sender display name and email address |
| `receiver` | `object` | Target recipient email address |
| `date` | `object` | Email timestamp |
| `subject` | `object` | Email subject text |
| `body` | `object` | Full raw body content of the email |
| `urls` | `int64` | Binary indicator (`1` if email contains hyperlinks, `0` if none) |
| **`label`** | `int64` | **Target Label**: `1` (Phishing/Spam/Fraud), `0` (Legitimate) |

---

### 2.2 Dataset Breakdown (`Email content/`)

#### 1. `Email content/CEAS_08.csv`
* **File Size**: 64.76 MB | **Rows**: 39,154 | **Columns**: 7
* **Origin**: CEAS 2008 Spam/Phishing Challenge Benchmark Corpus
* **Label Distribution**:
  * `1` (Phishing/Spam): 21,842 (55.78%)
  * `0` (Legitimate): 17,312 (44.22%)
* **Hyperlink Distribution (`urls`)**: 26,232 emails contain URLs (67.0%), 12,922 do not.

#### 2. `Email content/Enron.csv`
* **File Size**: 43.45 MB | **Rows**: 29,767 | **Columns**: 3 (`subject`, `body`, `label`)
* **Label Distribution**:
  * `0` (Legitimate corporate Enron emails): 15,791 (53.05%)
  * `1` (Spam / Phishing): 13,976 (46.95%)

#### 3. `Email content/Ling.csv`
* **File Size**: 8.91 MB | **Rows**: 2,859 | **Columns**: 3 (`subject`, `body`, `label`)
* **Origin**: Linguist List academic email spam corpus
* **Label Distribution**:
  * `0` (Legitimate academic emails): 2,401 (83.98%)
  * `1` (Spam): 458 (16.02%)

#### 4. `Email content/Nazario.csv`
* **File Size**: 7.45 MB | **Rows**: 1,565 | **Columns**: 7
* **Origin**: Jose Nazario Phishing Corpus (Verified real-world phishing attacks)
* **Label Distribution**:
  * `1` (Phishing): 1,565 (100.00% pure phishing corpus)

#### 5. `Email content/Nigerian_Fraud.csv`
* **File Size**: 8.77 MB | **Rows**: 3,332 | **Columns**: 7
* **Origin**: 419 Advance-Fee / Nigerian Scam Email Corpus
* **Label Distribution**:
  * `1` (Fraud): 3,332 (100.00% pure fraud corpus)

#### 6. `Email content/phishing_email.csv`
* **File Size**: 101.67 MB | **Rows**: 82,486 | **Columns**: 2 (`text_combined`, `label`)
* **Origin**: Large consolidated NLP corpus combining subject & body into preprocessed clean text strings.
* **Label Distribution**:
  * `1` (Phishing): 42,891 (52.00%)
  * `0` (Legitimate): 39,595 (48.00%)

#### 7. `Email content/SpamAssasin.csv`
* **File Size**: 14.19 MB | **Rows**: 5,809 | **Columns**: 7
* **Origin**: Apache SpamAssassin Public Corpus
* **Label Distribution**:
  * `0` (Legitimate / Ham): 4,091 (70.43%)
  * `1` (Spam): 1,718 (29.57%)

---

## 💡 Recommendations for Personalized Phishing Detection

1. **Multimodal Feature Integration**:
   * **URL Model**: Train a tabular classifier (e.g., XGBoost, LightGBM, Random Forest) on `PhiUSIIL_Phishing_URL_Dataset.csv` using structural (length, special characters) and DOM features (forms, hidden fields, favicons).
   * **Text Content Model**: Fine-tune a Transformer model (e.g., RoBERTa, DistilBERT) or TF-IDF + Logistic Regression/LinearSVM on `Email content/phishing_email.csv`, `CEAS_08.csv`, and `Enron.csv`.
2. **Handling Imbalance**:
   * Use stratified splitting or focal loss for heavily imbalanced sets like `enron_data_fraud_labeled_.csv` (2.9% positive) and `spam_sms.csv` (13.4% positive).
3. **Preprocessing Pipeline**:
   * For `spam_sms.csv`: Concatenate text from `v2`, `Unnamed: 2`, `Unnamed: 3`, `Unnamed: 4` to recover broken text strings caused by unescaped commas.
   * For Email datasets: Extract header features (sender domain vs. reply-to mismatch) and extract embedded links from `body` to pass to the URL analysis engine.
