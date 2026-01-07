# XSSpect - Reflected XSS Scanner

CLI-based reflected XSS automation tool for Ubuntu/Linux systems.

## Features

- 🔍 Automated XSS Detection
- 🔄 Auto Retry on Network Errors
- 📊 Smart Analysis (RAW/ESCAPED/NONE)
- 🧠 Context-Aware Detection (Reduces False Positives)
- 🌐 **Browser Verification (Detects alert/confirm/prompt execution!)**
- ☁️ **Google Drive Auto-Sync (rclone integration)**

### Prerequisites

- Ubuntu/Linux
- Go 1.21+
- **ChromeDriver** (optional, for browser verification)

### Install ChromeDriver

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install chromium-chromedriver

### Build

```bash
cd xsspect
go build -o xsspect
```

## Usage

### Basic Syntax

```bash
./xsspect --url <target-url> --params <param1,param2> [options]
```

### Required Arguments

- `--url`: Target URL (http:// or https://)
- `--params`: Comma-separated parameter names

### Optional Arguments

- `--method`: HTTP method (default: GET)
- `--stop-on-hit`: Stop after first RAW reflection
- `--show`: Show output for ALL payloads including escaped reflections and no reflections
- `--custom-payload`: Use ONLY this custom payload (ignores built-in payloads)
- `--payload-file`: Path to custom payload file (.txt only, shows only triggered)
- `--browser-verify`: **Verify XSS execution in headless browser (requires ChromeDriver)**
- `--chrome-driver`: Path to ChromeDriver executable (default: chromedriver)
- `--report`: **Generate analysis report**

### Examples

#### Single parameter
```bash
./xsspect --url https://example.com/search --params q
```

#### Multiple parameters
```bash
./xsspect --url https://example.com/search --params q,name,filter
```

#### POST method
```bash
./xsspect --url https://example.com/api/search --params query --method POST
```

#### Stop on first hit
```bash
./xsspect --url https://example.com/search --params q --stop-on-hit
```

#### Show all payloads (including non-triggered)
```bash
./xsspect --url https://example.com/search --params q --show
```

#### Test with custom payload
```bash
./xsspect --url https://example.com/search --params q --custom-payload "<script>alert('custom')</script>"
```

#### Test with custom payload file
```bash
./xsspect --url https://example.com/search --params q --payload-file /path/to/custom_payloads.txt
```

#### **Browser Verification (Verify Actual Execution!)**
```bash
# Verify XSS actually executes in headless browser
./xsspect --url https://example.com/search --params q --browser-verify

# With custom ChromeDriver path
./xsspect --url https://example.com/search --params q --browser-verify --chrome-driver /usr/bin/chromedriver
```

#### Combine multiple options
```bash
./xsspect --url https://example.com/api/search --params query --method POST --custom-payload "<img src=x onerror=alert(document.domain)>" --show
```

## Output

### RAW XSS Found (Default Output)
```
[+] RAW XSS FOUND
    Param: q
    Payload: <svg/onload=alert(1)>
```

### **VERIFIED XSS (Browser Verification)**
```
[+++] VERIFIED XSS (Executed in Browser!)
    Param: q
    Payload: <svg/onload=alert(1)>
    Event Type: alert()
```
✅ This means the alert box **actually popped up** in the headless browser!

### RAW XSS (Not Verified)
```
[+] RAW XSS FOUND (Static Analysis - Not Verified in Browser)
    Param: q
    Payload: <script>alert(1)</script>
```
⚠️ Found by static analysis but didn't execute in browser (might be in safe context)

### With --show Flag
Shows all results including escaped reflections and no reflections:

**Escaped Reflection:**
```
[~] Escaped reflection
    Param: q
    Payload: <script>alert(1)</script>
```

**No Reflection:**
```
[-] No reflection
    Param: q
    Payload: <img src=x>
```

### No Reflections
```
[-] No reflections found for param: q
```

## How It Works

1. Parse arguments and validate URL
2. Load 700+ payloads from `payloads/payloads.txt`
3. For each parameter:
   - Inject each payload into query parameter
   - Send HTTP request (retry on network failure)
   - Analyze response for reflection
   - Print results if meaningful

### Response Analysis

- **RAW_REFLECTION**: Exact payload in response **AND** in executable context (potential XSS!)
- **ESCAPED**: Payload HTML-encoded OR in safe context (safer)
- **NO_REFLECTION**: Payload not found (safe)

### Context-Aware Detection

The tool now checks if payloads are in **executable contexts**:

**Safe Contexts (Not Reported as RAW XSS):**
- Inside HTML comments: `<!-- payload -->`
- Inside `<title>` tags (displays but doesn't execute)
- Inside `<textarea>` tags (displays as text)
- Inside `<noscript>` tags
- Inside `<style>` tags (CSS context)

**Dangerous Contexts (Reported as RAW XSS):**
- In HTML body: `<div>payload</div>`
- In event handlers: `<img onerror=payload>`
- SVG/IMG tags with events

This significantly reduces false positives! See `CONTEXT_DETECTION.md` for details.


#### Example Usage

```bash
./xsscan --url "https://target.com/" --params q,search --browser-verify --report
