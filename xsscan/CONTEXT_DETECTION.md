# Context-Aware XSS Detection

## Problem
The tool was reporting false positives because it only checked if the payload **exists** in the response, not whether it's in an **executable context**.

## Solution
Now the tool checks if the payload appears in a **dangerous context** where it can actually execute.

## Safe Contexts (Won't Execute - Not Reported as RAW XSS)

### 1. HTML Comments
```html
<!-- <script>alert(1)</script> -->
❌ NOT VULNERABLE (commented out)
```

### 2. Title Tag
```html
<title>Search: <script>alert(1)</script></title>
❌ NOT VULNERABLE (displays in browser tab, doesn't execute)
```

### 3. Textarea Tag
```html
<textarea><script>alert(1)</script></textarea>
❌ NOT VULNERABLE (displays as text in textarea)
```

### 4. NoScript Tag
```html
<noscript><script>alert(1)</script></noscript>
❌ NOT VULNERABLE (only shows when JS is disabled)
```

### 5. Style Tag
```html
<style><script>alert(1)</script></style>
❌ NOT VULNERABLE (treated as CSS, not executed)
```

## Dangerous Contexts (Will Execute - Reported as RAW XSS)

### 1. HTML Body
```html
<div>Search results: <script>alert(1)</script></div>
✅ VULNERABLE! (executes immediately)
```

### 2. Event Handlers
```html
<input value="test" onload="alert(1)">
✅ VULNERABLE! (executes on event)
```

### 3. SVG Tags
```html
<svg/onload=alert(1)>
✅ VULNERABLE! (executes on load)
```

### 4. IMG Tags
```html
<img src=x onerror=alert(1)>
✅ VULNERABLE! (executes on error)
```

## How Detection Works

```
1. Find payload in response HTML
2. Extract 500 characters before and after payload
3. Check if payload is between safe tags:
   - If YES: Mark as ESCAPED (false positive avoided!)
   - If NO: Mark as RAW XSS (real vulnerability!)
```

## Example

**Before (False Positive):**
```
Payload: <script>alert(1)</script>
Response: <title>Search: <script>alert(1)</script></title>
Old Result: ❌ RAW XSS FOUND (FALSE POSITIVE!)
New Result: ✅ ESCAPED (Correctly identified as safe)
```

**After (True Positive):**
```
Payload: <script>alert(1)</script>
Response: <div>Results: <script>alert(1)</script></div>
Old Result: ✅ RAW XSS FOUND
New Result: ✅ RAW XSS FOUND (Correctly identified as vulnerable)
```

This drastically reduces false positives! 🎯
