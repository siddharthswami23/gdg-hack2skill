# Browser Verification Feature

## Overview

The `--browser-verify` flag enables **headless browser verification** using Selenium and ChromeDriver. This feature actually **executes** the XSS payloads in a real browser and detects if `alert()`, `confirm()`, or `prompt()` is triggered.

## Why Browser Verification?

### Without Browser Verification (Static Analysis Only):
```
❌ Reports 23 "RAW XSS" findings
✅ Only 2-5 actually execute
⚠️ Many false positives
```

### With Browser Verification:
```
✅ Reports only payloads that ACTUALLY execute
🎯 Confirms alert/confirm/prompt pop-ups
✅ Zero false positives for verified findings
```

## How It Works

### 1. Detection Script Injection
Before loading the page, the tool injects JavaScript to override dialog functions:

```javascript
window.alert = function(msg) {
    window.__xss_detected = true;
    window.__xss_type = 'alert';
    return true;
};

window.confirm = function(msg) {
    window.__xss_detected = true;
    window.__xss_type = 'confirm';
    return true;
};

window.prompt = function(msg, defaultText) {
    window.__xss_detected = true;
    window.__xss_type = 'prompt';
    return null;
};
```

### 2. Page Loading
The headless browser navigates to the URL with the injected payload.

### 3. Detection Check
After page load, the tool checks if any of the override functions were called:

```javascript
if (window.__xss_detected) {
    // XSS VERIFIED! The payload executed!
}
```

## Installation Requirements

### Install ChromeDriver

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install chromium-chromedriver
```

**Manual Installation:**
```bash
# Check your Chrome version
google-chrome --version

# Download matching ChromeDriver
wget https://chromedriver.storage.googleapis.com/LATEST_RELEASE
# Visit https://chromedriver.chromium.org/downloads
```

**Verify Installation:**
```bash
chromedriver --version
```

## Usage

### Basic Browser Verification
```bash
./xsscan --url https://example.com/search --params q --browser-verify
```

### With Custom ChromeDriver Path
```bash
./xsscan --url https://example.com/search --params q --browser-verify --chrome-driver /usr/local/bin/chromedriver
```

### Combined with Other Flags
```bash
./xsscan --url https://example.com/search --params q --browser-verify --stop-on-hit
```

## Output Examples

### Verified XSS (Actually Executed!)
```
[+++] VERIFIED XSS (Executed in Browser!)
    Param: search
    Payload: <svg/onload=alert(1)>
    Event Type: alert()
```
✅ **This is a REAL vulnerability** - the alert box popped up!

### RAW XSS (Not Verified)
```
[+] RAW XSS FOUND (Static Analysis - Not Verified in Browser)
    Param: search
    Payload: <script>alert(1)</script>
```
⚠️ Static analysis found it, but it didn't execute in the browser.
This might be in a safe context (like inside `<title>` tag).

### Summary with Verification
```
[*] Summary for param 'search': 23 raw (3 verified in browser), 156 escaped
```
- 23 payloads found by static analysis
- **Only 3 actually executed** in the browser
- 156 were properly escaped

## Performance Considerations

### Speed
- **Without browser verification**: ~1-2 seconds per payload
- **With browser verification**: ~3-5 seconds per payload (due to browser startup/loading)

### Recommendations
1. Use static analysis first to get candidates
2. Use `--stop-on-hit` with browser verification
3. Use `--custom-payload` or `--payload-file` with a small set to verify specific payloads

### Example Workflow
```bash
# Step 1: Fast scan with static analysis
./xsscan --url https://target.com --params search > results.txt

# Step 2: Verify specific payloads found
./xsscan --url https://target.com --params search --browser-verify --custom-payload "<svg/onload=alert(1)>"
```

## Troubleshooting

### Error: "Failed to start ChromeDriver"
```bash
# Check if ChromeDriver is installed
which chromedriver

# Check version compatibility
chromedriver --version
google-chrome --version

# Make sure ChromeDriver is executable
chmod +x /path/to/chromedriver
```

### Error: "ChromeDriver not found"
```bash
# Specify full path
./xsscan --url https://example.com --params q --browser-verify --chrome-driver /usr/bin/chromedriver
```

### Browser verification falls back to static analysis
If browser initialization fails, the tool continues with static analysis only and prints a warning:
```
[!] Failed to initialize browser: ...
[!] Continuing with static analysis only...
```

## Event Types Detected

The tool can detect three types of dialog events:

1. **alert()** - Standard alert dialog
   ```javascript
   alert(1)
   alert('XSS')
   ```

2. **confirm()** - Confirmation dialog
   ```javascript
   confirm('Are you sure?')
   ```

3. **prompt()** - Input prompt dialog
   ```javascript
   prompt('Enter value')
   ```

## Security Note

⚠️ Browser verification actually **executes** the payloads. Use only on:
- Your own test systems
- Authorized penetration tests
- Bug bounty programs (within scope)
- Educational environments

❌ **Never** use on production systems without explicit authorization!

## Advantages

✅ **Zero False Positives** (for verified findings)
✅ **Confirms Actual Execution**
✅ **Detects Event Type** (alert/confirm/prompt)
✅ **Real Browser Environment**
✅ **Handles JavaScript Execution Context**

## Limitations

❌ Slower than static analysis only
❌ Requires ChromeDriver installation
❌ May not work on all systems (headless mode issues)
❌ Network-dependent (loads actual pages)

## Best Practices

1. **Start with static analysis** for fast initial scan
2. **Use browser verification** for final confirmation
3. **Combine with `--stop-on-hit`** to find first working payload quickly
4. **Use `--custom-payload`** to verify specific findings
5. **Check ChromeDriver compatibility** before running large scans
