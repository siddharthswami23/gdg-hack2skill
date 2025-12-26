# XSScan - Reflected XSS Scanner

CLI-based reflected XSS automation tool for Ubuntu/Linux systems.

## Features

- 🔍 Automated XSS Detection
- 🎯 700+ Built-in Payloads  
- 🔄 Auto Retry on Network Errors
- 📊 Smart Analysis (RAW/ESCAPED/NONE)
- 🚀 Multiple HTTP Methods
- 🛡️ HTTP/HTTPS Support
- ⚡ Stop-on-Hit Mode

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

## Output

### RAW XSS Found
```
[+] RAW XSS FOUND
    Param: q
    Payload: <svg/onload=alert(1)>
```

### Escaped Reflection
```
[~] Escaped reflection
    Param: q
    Payload: <script>alert(1)</script>
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

- **RAW_REFLECTION**: Exact payload in response (potential XSS!)
- **ESCAPED**: Payload HTML-encoded (safer)
- **NO_REFLECTION**: Payload not found (safe)

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

## License

MIT License - See LICENSE file.

Use for authorized security testing only.
