# XSSpect - Intelligent XSS Vulnerability Scanner

**A context-aware, browser-verified XSS detection tool built entirely on the Google Tech Stack.**

XSSpect is a powerful CLI-based scanner designed to detect reflected XSS vulnerabilities with high accuracy. Unlike traditional scanners that produce false positives, XSSpect uses context-aware analysis and optional browser verification to ensure detected vulnerabilities are real and exploitable, with automatic cloud syncing for team collaboration.

![Tech Stack](https://img.shields.io/badge/Stack-Go%20%7C%20Selenium%20%7C%20ChromeDriver%20%7C%20Google%20Drive-blue)
![Version](https://img.shields.io/badge/version-1.0-green)

---

## Team Details
* **Team Name:** TEAM MARCO
* **Leader:** Siddharth Swami
* **Member:** Ayush Shankarpure
* **Member:** Chinmay Kulkarni

## Problem Statement
Manual XSS testing is time-consuming and prone to human error. Existing automated tools suffer from:
* **High False Positive Rates** (Detecting XSS in safe contexts like HTML comments).
* **No Real Execution Verification** (Static analysis only, no browser testing).
* **Poor Reporting** (No structured output for further analysis).
<!-- * **No Cloud Integration** (Results trapped locally). -->

## The Solution
XSSpect solves this by combining three powerful approaches:
<!-- 1. **Context-Aware Static Analysis**: Intelligently distinguishes between safe and dangerous HTML contexts. -->
1. **Browser Verification**: Uses Selenium + ChromeDriver to verify if payloads actually execute in a real browser.
<!-- 3. **Cloud Sync**: Automatically syncs CSV reports to Google Drive for team collaboration. -->

---

## Key Features

### 1. Context-Aware Detection
* **Smart Analysis**: Detects if payloads are in executable vs. safe contexts (comments, textarea, title tags).
* **Reduced False Positives**: Only flags RAW XSS when payload is in dangerous contexts like HTML body or event handlers.
* **700+ Built-in Payloads**: Comprehensive payload library covering modern XSS vectors.

### 2. Browser Verification
* **Real Execution Testing**: Launches headless Chrome to verify if alert/confirm/prompt actually triggers.
* **Event Type Detection**: Identifies which JavaScript event fired (alert, confirm, prompt).
* **Confidence Levels**: Distinguishes between verified XSS and potential XSS.

### 3. Automated Reporting & Sync
* **CSV Export**: Structured reports with timestamp, severity, parameters, and verification status.
* **Google Drive Sync**: Automatic sync via rclone integration.
* **Severity Classification**: Critical, High, Medium, Low, Info levels.

---

## Tech Stack

| Component | Technology Used | Purpose |
| :--- | :--- | :--- |
| Core Engine | Go 1.21+ | High-performance scanning engine |
| Browser Automation | Selenium WebDriver | Real browser verification |
| Driver | ChromeDriver | Headless Chrome control |
| HTTP Client | net/http | Request handling with retry logic |
| Cloud Sync | rclone | Google Drive integration |
| Platform | Linux/Ubuntu | CLI-based security tool |

---

## Architecture Flow

1. **Input Validation**: Validates target URL, HTTP method, and parameters.
2. **Payload Loading**: Loads 700+ XSS payloads from `payloads/payloads.txt`.
3. **Payload Injection**: Injects each payload into target parameters.
4. **HTTP Request**: Sends request with retry logic for network failures.
5. **Static Analysis**: Checks response for payload reflection and context.
6. **Browser Verification** (Optional): Launches headless Chrome to verify execution.
7. **Result Storage**: Stores findings with severity classification.
8. **Report Generation**: Exports CSV report with all findings.
9. **Cloud Sync**: Automatically syncs to Google Drive.

---

## Installation & Setup

### Prerequisites
- **Ubuntu/Linux** (Tested on Ubuntu 22.04)
- **Go 1.21+** ([Install Go](https://go.dev/doc/install))
- **ChromeDriver** (for browser verification)

### 1. Install Dependencies

```bash
# Install Go (if not already installed)
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Install ChromeDriver
sudo apt-get update
sudo apt-get install chromium-browser chromium-chromedriver

# Install rclone (for Google Drive sync)
sudo apt install rclone
```

### 2. Clone the Repository

```bash
git clone https://github.com/siddharthswami23/gdg-hack2skill.git
cd gdg-hack2skill/XSSpect
```

### 3. Build XSSpect

```bash
go build -o xsspect
```

### 4. Configure Google Drive (Optional)

To enable automatic report syncing to Google Drive:

```bash
# Configure rclone
rclone config

# Follow the prompts:
# - Choose: New remote
# - Name it: gdrive
# - Type: Google Drive
# - Authorize with your Google account
```

---

## Usage Guide

### Basic Syntax

```bash
./xsspect --url <target-url> --params <param1,param2> [options]
```

### Required Arguments

| Argument | Description |
| :--- | :--- |
| `--url` | Target URL (must include http:// or https://) |
| `--params` | Comma-separated parameter names to test |

### Optional Arguments

| Argument | Description |
| :--- | :--- |
| `--method` | HTTP method (default: GET) |
| `--browser-verify` | Verify XSS execution in headless browser |
| `--report` | Generate CSV report and sync to Google Drive |
| `--stop-on-hit` | Stop testing parameter after first RAW XSS found |
| `--show` | Show all payload results (including escaped/no reflection) |
| `--custom-payload` | Use only this custom payload |
| `--payload-file` | Path to custom payload file (.txt) |
| `--chrome-driver` | Path to ChromeDriver executable |
| `--csv-output` | Custom CSV output path |

---

## Usage Examples

### 1. Basic Scan (Single Parameter)
```bash
./xsspect --url https://example.com/search --params q
```

### 2. Multiple Parameters
```bash
./xsspect --url https://example.com/search --params q,name,filter
```

### 3. POST Request with Browser Verification
```bash
./xsspect --url https://example.com/api/search --params query --method POST --browser-verify
```

### 4. Custom Payload Testing
```bash
./xsspect --url https://example.com/search --params q --custom-payload "<img src=x onerror=alert(document.domain)>"
```

### 5. Generate Report with Cloud Sync
```bash
./xsspect --url https://example.com/search --params q,search --browser-verify --report
```

### 6. Custom Payload File
```bash
./xsspect --url https://example.com/search --params q --payload-file custom_payloads.txt --report
```

### 7. Stop on First Hit (Fast Scanning)
```bash
./xsspect --url https://example.com/search --params q --stop-on-hit
```

---

## Understanding the Output

### 🔴 Verified XSS (Browser Confirmation)
```
[+++] VERIFIED XSS (Executed in Browser!)
    Param: q
    Payload: <svg/onload=alert(1)>
    Event Type: alert()
```
✅ **Meaning**: XSS payload successfully executed in headless Chrome. **Confirmed vulnerability**.

### 🟠 RAW XSS (Static Analysis)
```
[+] RAW XSS FOUND (Static Analysis - Not Verified in Browser)
    Param: q
    Payload: <script>alert(1)</script>
```
⚠️ **Meaning**: Payload reflected in dangerous context but not browser-verified. **Likely exploitable**.

### 🟡 Escaped Reflection
```
[~] Escaped reflection
    Param: q
    Payload: <script>alert(1)</script>
```
ℹ️ **Meaning**: Payload found but HTML-encoded (e.g., `&lt;script&gt;`). **Not exploitable**.

### ⚪ No Reflection
```
[-] No reflection
    Param: q
    Payload: <img src=x>
```
✅ **Meaning**: Payload not reflected in response. **Safe**.

---

## How It Works

### Context-Aware Detection Engine

XSSpect analyzes where the payload appears in the HTML response:

**🔴 Dangerous Contexts (Reported as RAW XSS):**
- HTML body: `<div>payload</div>`
- Event handlers: `<img onerror=payload>`
- Script tags: `<script>payload</script>`
- SVG/IMG with events

**🟢 Safe Contexts (Not Reported):**
- HTML comments: `<!-- payload -->`
- `<title>` tags (displays but doesn't execute)
- `<textarea>` tags (renders as text)
- `<noscript>` tags
- `<style>` tags (CSS context)

### Browser Verification Process

When `--browser-verify` is enabled:

1. **Launch Headless Chrome**: Selenium starts ChromeDriver in headless mode.
2. **Navigate to URL**: Loads the URL with injected payload.
3. **Detect Alerts**: Checks if `alert()`, `confirm()`, or `prompt()` was triggered.
4. **Verify Execution**: Uses JavaScript injection to detect XSS execution.
5. **Return Result**: Marks as "VERIFIED XSS" if execution confirmed.

### Retry Logic

XSSpect includes intelligent retry for network failures:
- **Max Retries**: 2 attempts
- **Timeout**: 10 seconds per request
- **Retryable Errors**: Connection timeout, DNS errors, temporary network issues
- **Non-Retryable**: Valid HTTP responses (even 403, 500, etc.)

---

## CSV Report Structure

Generated reports include the following fields:

| Field | Description |
| :--- | :--- |
| Timestamp | Scan completion time |
| Target_URL | Scanned URL |
| HTTP_Method | GET/POST/PUT |
| Parameter | Tested parameter name |
| Payload | XSS payload used |
| Reflection_Type | RAW_REFLECTION / ESCAPED / NO_REFLECTION |
| Browser_Verified | Yes/No |
| XSS_Event_Type | alert / confirm / prompt |
| Severity | Critical / High / Medium / Low / Info |

### Severity Classification

- **Critical**: Browser-verified XSS
- **High**: RAW XSS (not browser-verified)
- **Medium**: Escaped reflection
- **Low**: Safe context reflection
- **Info**: No reflection

---

## Troubleshooting

### Issue: ChromeDriver Not Found

**Error**: `failed to start ChromeDriver service`

**Solution**:
```bash
# Install ChromeDriver
sudo apt-get install chromium-chromedriver

# Or specify custom path
./xsspect --url https://example.com --params q --browser-verify --chrome-driver /usr/bin/chromedriver
```

### Issue: Browser Permission Denied

**Error**: `failed to create WebDriver`

**Solution**:
```bash
# Ensure Chromium browser is installed
sudo apt-get install chromium-browser

# Check ChromeDriver is executable
chmod +x /usr/bin/chromedriver
```

### Issue: Google Drive Sync Failed

**Error**: `Failed to sync to Google Drive`

**Solution**:
```bash
# Reconfigure rclone
rclone config

# Test connection
rclone lsd gdrive:

# Check outputs directory exists
mkdir -p outputs
```

### Issue: Too Many False Positives

**Solution**: Use `--browser-verify` flag to eliminate false positives:
```bash
./xsspect --url https://example.com --params q --browser-verify
```

---

## Performance Metrics

- **Per Payload**: ~1-2 seconds (HTTP request + analysis)
- **With Browser Verify**: +3-5 seconds per RAW hit
- **Example**: 3 parameters × 700 payloads ≈ 35-70 minutes
- **With `--stop-on-hit`**: Can complete in under 1 minute

---

## Roadmap

- [ ] Multi-threaded scanning for faster results
- [ ] DOM-based XSS detection
- [ ] Stored XSS testing module
- [ ] Integration with Burp Suite
- [ ] Web UI dashboard
- [ ] Docker containerization
- [ ] OWASP ZAP plugin

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

⚠️ **For Educational and Authorized Testing Only**

XSSpect is designed for security professionals and penetration testers. Only use this tool on systems you own or have explicit permission to test. Unauthorized testing may be illegal in your jurisdiction.

---

## Acknowledgments

- Google Tech Stack (Go, Firebase, Google Drive)
- Selenium WebDriver team
- ChromeDriver developers
- Open-source security community

---

## Contact & Support

- **GitHub**: [siddharthswami23/gdg-hack2skill](https://github.com/siddharthswami23/gdg-hack2skill)
- **Issues**: [Report a Bug](https://github.com/siddharthswami23/gdg-hack2skill/issues)
- **Documentation**: See `/XSSpect/WORKFLOW.md` for technical details

---

**Made with ❤️ by Team MARCO for GDG Hack2Skill 2026**
