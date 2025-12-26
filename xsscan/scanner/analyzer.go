package scanner

import (
	"strings"
)

// ReflectionType represents the type of reflection detected
type ReflectionType int

const (
	NoReflection ReflectionType = iota
	EscapedReflection
	RawReflection
)

// String returns the string representation of ReflectionType
func (r ReflectionType) String() string {
	switch r {
	case RawReflection:
		return "RAW_REFLECTION"
	case EscapedReflection:
		return "ESCAPED"
	case NoReflection:
		return "NO_REFLECTION"
	default:
		return "UNKNOWN"
	}
}

// AnalysisResult contains the result of analyzing a response
type AnalysisResult struct {
	Type           ReflectionType
	Parameter      string
	Payload        string
	ResponseSnippet string
}

// AnalyzeResponse analyzes the HTTP response body to detect XSS reflection
// Returns the type of reflection detected according to these rules:
// 1. RAW_REFLECTION: Exact payload string found in response body
// 2. ESCAPED: Payload present but HTML-escaped (< > " ')
// 3. NO_REFLECTION: Payload not found
func AnalyzeResponse(responseBody, payload, parameter string) AnalysisResult {
	result := AnalysisResult{
		Parameter: parameter,
		Payload:   payload,
	}

	// Extract a small snippet from the response (30-40 characters around the payload)
	snippetLength := 40
	if len(responseBody) > snippetLength {
		result.ResponseSnippet = responseBody[:snippetLength]
	} else {
		result.ResponseSnippet = responseBody
	}

	// Check for exact payload (RAW_REFLECTION)
	if strings.Contains(responseBody, payload) {
		result.Type = RawReflection
		return result
	}

	// Check for escaped payload (ESCAPED)
	// HTML entities that might be escaped: < > " ' &
	escapedPayload := escapeHTML(payload)
	if escapedPayload != payload && strings.Contains(responseBody, escapedPayload) {
		result.Type = EscapedReflection
		return result
	}

	// Check for partial escaping - sometimes only some characters are escaped
	// Try multiple escape patterns
	escapePatterns := []struct {
		from string
		to   string
	}{
		{"<", "&lt;"},
		{">", "&gt;"},
		{"\"", "&quot;"},
		{"'", "&#39;"},
		{"'", "&apos;"},
		{"&", "&amp;"},
	}

	// Build different escaped versions
	testPayload := payload
	for _, pattern := range escapePatterns {
		testPayload = strings.ReplaceAll(testPayload, pattern.from, pattern.to)
		if strings.Contains(responseBody, testPayload) {
			result.Type = EscapedReflection
			return result
		}
	}

	// Also check for HTML entity numeric encoding
	if containsEncodedPayload(responseBody, payload) {
		result.Type = EscapedReflection
		return result
	}

	// No reflection found
	result.Type = NoReflection
	return result
}

// escapeHTML escapes special HTML characters
func escapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}

// containsEncodedPayload checks if the response contains HTML entity encoded version of payload
func containsEncodedPayload(responseBody, payload string) bool {
	// Check for numeric HTML entities (decimal and hex)
	for _, char := range payload {
		// Decimal encoding: &#60; for <
		decEncoded := "&#" + string(rune(char)) + ";"
		if strings.Contains(responseBody, decEncoded) {
			return true
		}
	}
	return false
}
