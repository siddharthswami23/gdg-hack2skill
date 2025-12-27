# Browser Verification Setup Guide

## Overview
The `--browser-verify` flag uses Selenium WebDriver to actually load pages in a real browser and detect if XSS payloads execute (alert, confirm, prompt, etc.).

## Requirements

### 1. Install Google Chrome
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install google-chrome-stable

# Or download from: https://www.google.com/chrome/
```

### 2. Install ChromeDriver

**Option A: Download and Install**
```bash
# Check your Chrome version
google-chrome --version

# Download matching ChromeDriver from:
# https://chromedriver.chromium.org/downloads

# Example for Linux:
wget https://chromedriver.storage.googleapis.com/LATEST_RELEASE
export CHROMEDRIVER_VERSION=$(cat LATEST_RELEASE)
wget https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
```

**Option B: Use Package Manager**
```bash
# Ubuntu/Debian
sudo apt install chromium-chromedriver

# Or using snap
sudo snap install chromium --classic
```

### 3. Start ChromeDriver
```bash
# Start ChromeDriver on port 9515 (default)
chromedriver --port=9515

# Or run in background
chromedriver --port=9515 &
```

You should see:
```
ChromeDriver was started successfully on port 9515.
```

## Usage

### Basic Browser Verification
```bash
./xsscan --url https://example.com/search --params q --browser-verify
```

### Headless Mode (No Browser Window)
```bash
./xsscan --url https://example.com/search --params q --browser-verify --headless
```

### Visible Browser (See What's Happening)
```bash
./xsscan --url https://example.com/search --params q --browser-verify --headless=false
```

### With Custom Payloads
```bash
./xsscan --url https://example.com/search --params q --browser-verify --custom-payload '<svg onload=alert(1)>'
```

## How It Works

### Without Browser Verification (Static Analysis)
```
1. Send HTTP request with payload
2. Check if payload exists in response HTML
3. Report if found in executable context
❌ Can't confirm if JavaScript actually runs
```

### With Browser Verification (Dynamic Analysis)
```
1. Send HTTP request with payload
2. Check if payload exists in response HTML
3. ✅ Load page in real Chrome browser
4. ✅ Inject alert/prompt/confirm detector
5. ✅ Check if XSS actually executed
6. ✅ Only report CONFIRMED vulnerabilities
```

## Output Comparison

### Static Analysis Output
```bash
./xsscan --url https://victim.com/search --params q

[+] RAW XSS FOUND
    Param: q
    Payload: <script>alert(1)</script>
# Might be false positive if in safe context
```

### Browser Verification Output
```bash
./xsscan --url https://victim.com/search --params q --browser-verify

[+] RAW XSS FOUND [✓ BROWSER VERIFIED]
    Param: q
    Payload: <script>alert(1)</script>
# Confirmed to actually execute!

[*] Summary for param 'q': 5 raw, 2 browser-verified, 12 escaped
```

## What Gets Detected

The browser verifier detects these JavaScript executions:
- ✅ `alert()` popup
- ✅ `confirm()` dialog
- ✅ `prompt()` dialog
- ✅ `onload` events
- ✅ `onerror` events
- ✅ `onmouseover` events
- ✅ `onfocus` events
- ✅ Any other JavaScript execution

## Advantages

### Browser Verification
- ✅ **100% Accurate**: Only reports payloads that actually execute
- ✅ **No False Positives**: Filters out payloads in safe contexts
- ✅ **Real World**: Tests in actual browser environment
- ✅ **Event Detection**: Catches alert, confirm, prompt
- ❌ **Slower**: Takes more time (1-2 seconds per payload)
- ❌ **Requires Setup**: Need ChromeDriver installed

### Static Analysis (Default)
- ✅ **Fast**: Tests 700+ payloads in seconds
- ✅ **No Dependencies**: Works out of the box
- ✅ **Good Coverage**: Catches most reflections
- ❌ **False Positives**: May report payloads in safe contexts
- ❌ **No Execution**: Can't confirm if JS runs

## Troubleshooting

### ChromeDriver not found
```
[!] ChromeDriver not detected. Please start ChromeDriver:
    chromedriver --port=9515
```
**Solution**: Start ChromeDriver in another terminal

### Version mismatch
```
session not created: This version of ChromeDriver only supports Chrome version X
```
**Solution**: Download ChromeDriver matching your Chrome version

### Permission denied
```
Permission denied: /usr/local/bin/chromedriver
```
**Solution**: `sudo chmod +x /usr/local/bin/chromedriver`

### Port already in use
```
Port 9515 is already in use
```
**Solution**: Kill existing ChromeDriver: `pkill chromedriver`

## Performance Tips

1. **Use --stop-on-hit**: Stop after first confirmed XSS
   ```bash
   ./xsscan --url https://example.com --params q --browser-verify --stop-on-hit
   ```

2. **Use custom payloads**: Test only specific payloads
   ```bash
   ./xsscan --url https://example.com --params q --browser-verify --custom-payload '<svg onload=alert(1)>'
   ```

3. **Combine with static first**: Run static analysis first, then verify hits
   ```bash
   # First: Fast static scan
   ./xsscan --url https://example.com --params q > results.txt
   
   # Then: Verify interesting payloads with browser
   ./xsscan --url https://example.com --params q --browser-verify --payload-file verified_payloads.txt
   ```

## Example Workflow

```bash
# Terminal 1: Start ChromeDriver
chromedriver --port=9515

# Terminal 2: Run scan with browser verification
./xsscan \
  --url "https://victim.com/search" \
  --params "q,search,query" \
  --browser-verify \
  --headless \
  --stop-on-hit

# Output:
# [*] Browser verification enabled (headless mode)
# [*] Testing param: q
# [+] RAW XSS FOUND [✓ BROWSER VERIFIED]
#     Param: q
#     Payload: <svg/onload=alert(1)>
# [*] Summary for param 'q': 23 raw, 3 browser-verified, 145 escaped
```

## Notes

- Browser verification is **OPTIONAL** - the tool works fine without it
- Use browser verification when you need **100% confirmation**
- Static analysis is faster for initial reconnaissance
- Browser mode is perfect for **proof of concept** generation
- Always use **--headless** on servers (no GUI)
