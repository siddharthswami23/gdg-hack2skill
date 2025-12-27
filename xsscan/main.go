package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"

	"xsscan/scanner"
)

const (
	DefaultMethod = "GET"
)

// Config holds the application configuration from CLI arguments
type Config struct {
	URL           string
	Params        []string
	Method        string
	StopOnHit     bool
	ShowAll       bool
	CustomPayload string
}

func main() {
	// Parse CLI arguments
	config, err := parseArgs()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	// Print banner
	printBanner()

	// Validate URL
	if err := scanner.ValidateURL(config.URL); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	// Validate HTTP method
	if err := scanner.ValidateMethod(config.Method); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	// Validate parameters
	if len(config.Params) == 0 {
		fmt.Fprintf(os.Stderr, "Error: No parameters specified. Use --params to specify parameters.\n")
		os.Exit(1)
	}

	// Load payloads
	payloads, err := loadPayloads()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading payloads: %v\n", err)
		os.Exit(1)
	}

	if len(payloads) == 0 {
		fmt.Fprintf(os.Stderr, "Error: No payloads loaded\n")
		os.Exit(1)
	}

	// Add custom payload if provided
	if config.CustomPayload != "" {
		payloads = append(payloads, config.CustomPayload)
		fmt.Printf("[*] Custom payload added: %s\n", config.CustomPayload)
	}

	// Print scan info
	fmt.Printf("\n[*] Target: %s\n", config.URL)
	fmt.Printf("[*] Method: %s\n", config.Method)
	fmt.Printf("[*] Parameters: %s\n", strings.Join(config.Params, ", "))
	fmt.Printf("[*] Payloads loaded: %d\n", len(payloads))
	fmt.Printf("[*] Stop on hit: %v\n", config.StopOnHit)
	fmt.Printf("[*] Show all: %v\n\n", config.ShowAll)

	// Scan each parameter
	for _, param := range config.Params {
		scanParameter(config, param, payloads)
	}

	fmt.Println("\n[*] Scan completed")
}

// parseArgs parses command-line arguments and returns a Config
func parseArgs() (*Config, error) {
	config := &Config{}

	// Define flags
	url := flag.String("url", "", "Target URL (required)")
	params := flag.String("params", "", "Comma-separated parameter names (required)")
	method := flag.String("method", DefaultMethod, "HTTP method (default: GET)")
	stopOnHit := flag.Bool("stop-on-hit", false, "Stop testing a parameter after first RAW reflection")
	showAll := flag.Bool("show", false, "Show output for each payload tested (default: only triggered payloads)")
	customPayload := flag.String("custom-payload", "", "Add a custom payload to test")

	// Custom usage message
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "XSScan - Reflected XSS Scanner\n\n")
		fmt.Fprintf(os.Stderr, "Usage: xsscan [options]\n\n")
		fmt.Fprintf(os.Stderr, "Required:\n")
		fmt.Fprintf(os.Stderr, "  --url string\n")
		fmt.Fprintf(os.Stderr, "        Target URL (must include http:// or https://)\n")
		fmt.Fprintf(os.Stderr, "  --params string\n")
		fmt.Fprintf(os.Stderr, "        Comma-separated parameter names to test\n\n")
		fmt.Fprintf(os.Stderr, "Optional:\n")
		fmt.Fprintf(os.Stderr, "  --method string\n")
		fmt.Fprintf(os.Stderr, "        HTTP method (default: GET)\n")
		fmt.Fprintf(os.Stderr, "  --stop-on-hit\n")
		fmt.Fprintf(os.Stderr, "        Stop testing a parameter after first RAW reflection\n")
		fmt.Fprintf(os.Stderr, "  --show\n")
		fmt.Fprintf(os.Stderr, "        Show output for each payload tested (default: only triggered)\n")
		fmt.Fprintf(os.Stderr, "  --custom-payload string\n")
		fmt.Fprintf(os.Stderr, "        Add a custom payload to test\n\n")
		fmt.Fprintf(os.Stderr, "Example:\n")
		fmt.Fprintf(os.Stderr, "  xsscan --url https://example.com/search --params q,name --method GET\n\n")
	}

	flag.Parse()

	// Validate required arguments
	if *url == "" {
		return nil, fmt.Errorf("--url is required")
	}

	if *params == "" {
		return nil, fmt.Errorf("--params is required")
	}

	// Populate config
	config.URL = *url
	config.Method = strings.ToUpper(*method)
	config.StopOnHit = *stopOnHit
	config.ShowAll = *showAll
	config.CustomPayload = *customPayload

	// Parse parameters
	paramList := strings.Split(*params, ",")
	for _, p := range paramList {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			config.Params = append(config.Params, trimmed)
		}
	}

	return config, nil
}

// loadPayloads loads XSS payloads from the embedded payloads file
func loadPayloads() ([]string, error) {
	// Try to read from payloads/payloads.txt relative to the executable
	file, err := os.Open("payloads/payloads.txt")
	if err != nil {
		return nil, fmt.Errorf("failed to open payloads file: %w", err)
	}
	defer file.Close()

	var payloads []string
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "//") {
			continue
		}

		payloads = append(payloads, line)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading payloads file: %w", err)
	}

	return payloads, nil
}

// scanParameter tests a single parameter with all payloads
func scanParameter(config *Config, param string, payloads []string) {
	fmt.Printf("[*] Testing param: %s\n", param)

	rawHitCount := 0
	escapedHitCount := 0

	for _, payload := range payloads {
		// Build URL with injected payload
		testURL, err := scanner.BuildRequestURL(config.URL, param, payload)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[!] Error building URL: %v\n", err)
			continue
		}

		// Send HTTP request
		reqConfig := scanner.RequestConfig{
			URL:    testURL,
			Method: config.Method,
		}

		result := scanner.SendRequest(reqConfig)

		// Handle request errors
		if result.Error != nil {
			// Only print errors that aren't just timeouts or common network issues
			// (to keep output clean)
			continue
		}

		// Analyze response
		analysis := scanner.AnalyzeResponse(result.ResponseBody, payload, param)

		// Print results based on reflection type
		switch analysis.Type {
		case scanner.RawReflection:
			rawHitCount++
			fmt.Printf("\n[+] RAW XSS FOUND\n")
			fmt.Printf("    Param: %s\n", param)
			fmt.Printf("    Payload: %s\n", payload)
			fmt.Println()

			// Stop testing this parameter if --stop-on-hit is enabled
			if config.StopOnHit {
				fmt.Printf("[*] Stopping tests for param '%s' (--stop-on-hit enabled)\n\n", param)
				return
			}

		case scanner.EscapedReflection:
			escapedHitCount++
			fmt.Printf("\n[~] Escaped reflection\n")
			fmt.Printf("    Param: %s\n", param)
			fmt.Printf("    Payload: %s\n", payload)
			fmt.Println()

		case scanner.NoReflection:
			// Show all payloads if --show flag is enabled
			if config.ShowAll {
				fmt.Printf("[-] No reflection\n")
				fmt.Printf("    Param: %s\n", param)
				fmt.Printf("    Payload: %s\n", payload)
				fmt.Println()
			}
		}
	}

	// Print summary for this parameter
	if rawHitCount == 0 && escapedHitCount == 0 {
		fmt.Printf("[-] No reflections found for param: %s\n\n", param)
	} else {
		fmt.Printf("[*] Summary for param '%s': %d raw, %d escaped\n\n", param, rawHitCount, escapedHitCount)
	}
}

// printBanner prints the application banner
func printBanner() {
	banner := `
 __   __ _____ _____                 
 \ \ / // ____/ ____|                
  \ V /| (___| (___   ___ __ _ _ __  
   > <  \___ \\___ \ / __/ _' | '_ \ 
  / . \ ____) |___) | (_| (_| | | | |
 /_/ \_\_____/_____/ \___\__,_|_| |_|
                                      
 Reflected XSS Scanner
 ========================================
`
	fmt.Println(banner)
}
