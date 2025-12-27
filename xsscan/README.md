# XSScan - Reflected XSS Scanner

CLI-based reflected XSS automation tool for Ubuntu/Linux systems.

## Features

- 🔍 Automated XSS Detection
- 🎯 700+ Built-in Payloads  
- 🔄 Auto Retry on Network Errors
- 📊 Smart Analysis (RAW/ESCAPED/NONE)
- 🧠 Context-Aware Detection (Reduces False Positives)
- 🌐 **Browser Verification with Selenium (NEW!)**
- 🚀 Multiple HTTP Methods
- 🛡️ HTTP/HTTPS Support
- ⚡ Stop-on-Hit Mode
- 👁️ Show All Payloads Mode
- 🎨 Custom Payload Support
- 📁 Custom Payload File Support

## Installation

### Prerequisites

- Ubuntu/Linux
- Go 1.21+

### Build

```bash
cd xsscan
go build -o xsscan
```

## Usage

### Basic Syntax

```bash
./xsscan --url <target-url> --params <param1,param2> [options]
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
- `--browser-verify`: **Use real browser to verify XSS execution (requires ChromeDriver)**
- `--headless`: Run browser in headless mode (default: true)

### Examples

#### Single parameter
```bash
./xsscan --url https://example.com/search --params q
```

#### Multiple parameters
```bash
./xsscan --url https://example.com/search --params q,name,filter
```

#### POST method
```bash
./xsscan --url https://example.com/api/search --params query --method POST
```

#### Stop on first hit
```bash
./xsscan --url https://example.com/search --params q --stop-on-hit
```

#### Show all payloads (including non-triggered)
```bash
./xsscan --url https://example.com/search --params q --show
```

#### Test with custom payload
```bash
./xsscan --url https://example.com/search --params q --custom-payload "<script>alert('custom')</script>"
```

#### Test with custom payload file
```bash
./xsscan --url https://example.com/search --params q --payload-file /path/to/custom_payloads.txt
```

#### Browser verification (100% accuracy)
```bash
# Start ChromeDriver first: chromedriver --port=9515
./xsscan --url https://example.com/search --params q --browser-verify
```

#### Browser verification in visible mode
```bash
./xsscan --url https://example.com/search --params q --browser-verify --headless=false
```

#### Combine multiple options
```bash
./xsscan --url https://example.com/api/search --params query --method POST --custom-payload "<img src=x onerror=alert(document.domain)>" --show
```

## Output

### RAW XSS Found (Default Output)
```
[+] RAW XSS FOUND
    Param: q
    Payload: <svg/onload=alert(1)>
```

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

## Browser Verification (NEW!)

### What is Browser Verification?

Instead of just checking if payloads exist in HTML, the tool can load pages in a **real Chrome browser** and detect if JavaScript actually executes!

### Setup

1. **Install Chrome and ChromeDriver**:
   ```bash
   sudo apt install google-chrome-stable chromium-chromedriver
   ```

2. **Start ChromeDriver**:
   ```bash
   chromedriver --port=9515
   ```

3. **Run with browser verification**:
   ```bash
   ./xsscan --url https://example.com/search --params q --browser-verify
   ```

### How It Works

```
Static Analysis (Default):
✓ Fast, but may have false positives
✓ Checks if payload exists in HTML
✗ Can't confirm if JavaScript runs

Browser Verification:
✓ 100% accurate - only reports confirmed XSS
✓ Loads page in real Chrome browser
✓ Detects alert(), confirm(), prompt()
✓ Detects all JavaScript execution
✗ Slower (1-2 seconds per payload)
```

### Output Comparison

**Without browser verification:**
```
[+] RAW XSS FOUND
    Param: q
    Payload: <script>alert(1)</script>
```

**With browser verification:**
```
[+] RAW XSS FOUND [✓ BROWSER VERIFIED]
    Param: q
    Payload: <script>alert(1)</script>

[*] Summary for param 'q': 23 raw, 3 browser-verified, 145 escaped
```

Only the **3 browser-verified** payloads actually executed!

See `BROWSER_SETUP.md` for complete setup and usage guide.

## Payload Management

Edit `payloads/payloads.txt` to customize payloads:
- One payload per line
- Lines starting with `#` or `//` are ignored
- Empty lines are skipped

Example payloads:
```
<script>alert(1)</script>
<svg/onload=alert(1)>
<img src=x onerror=alert(1)>
```

## Troubleshooting

**"go: command not found"**  
→ Install Go: `sudo apt install golang-go`

**"Failed to open payloads file"**  
→ Run from xsscan directory

**"Invalid URL"**  
→ Include http:// or https://

**No results?**  
→ Target may be properly sanitized

## Important Notes

⚠️ **Use only on authorized systems**

- Your own applications
- Bug bounty programs (within scope)
- Authorized pentests
- Educational environments (DVWA, bWAPP)

❌ **Unauthorized testing is illegal**

## What This Tool Does

✅ Tests reflected XSS in query parameters  
✅ Supports HTTP/HTTPS  
✅ Raw payload injection  
✅ Sequential execution  

## What This Tool Does NOT Do

❌ DOM-based XSS  
❌ Stored XSS  
❌ JavaScript execution  
❌ URL encoding  
❌ Concurrent requests  
❌ Auto parameter discovery  
