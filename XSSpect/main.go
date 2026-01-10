package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"xsspect/scanner"
)

const (
	DefaultMethod = "GET"
)

// Config holds the application configuration from CLI arguments
type Config struct {
	URL              string
	Params           []string
	Method           string
	StopOnHit        bool
	ShowAll          bool
	CustomPayload    string
	PayloadFile      string
	BrowserVerify    bool
	ChromeDriverPath string
	GenerateReport   bool
	CSVOutput        string
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
	var payloads []string

	// If custom payload is provided, use ONLY that payload
	if config.CustomPayload != "" {
		payloads = []string{config.CustomPayload}
		fmt.Printf("[*] Using custom payload only: %s\n", config.CustomPayload)
	} else if config.PayloadFile != "" {
		// Load payloads from custom file
		var err error
		payloads, err = loadPayloadsFromFile(config.PayloadFile)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error loading payloads from file: %v\n", err)
			os.Exit(1)
		}

		if len(payloads) == 0 {
			fmt.Fprintf(os.Stderr, "Error: Payload file is empty\n")
			os.Exit(1)
		}

		fmt.Printf("[*] Loaded payloads from custom file: %s\n", config.PayloadFile)
	} else {
		// Load built-in payloads from file
		var err error
		payloads, err = loadPayloads()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error loading payloads: %v\n", err)
			os.Exit(1)
		}

		if len(payloads) == 0 {
			fmt.Fprintf(os.Stderr, "Error: No payloads loaded\n")
			os.Exit(1)
		}
	}

	// Print scan info
	fmt.Printf("\n[*] Target: %s\n", config.URL)
	fmt.Printf("[*] Method: %s\n", config.Method)
	fmt.Printf("[*] Parameters: %s\n", strings.Join(config.Params, ", "))
	fmt.Printf("[*] Payloads loaded: %d\n", len(payloads))
	fmt.Printf("[*] Stop on hit: %v\n", config.StopOnHit)
	fmt.Printf("[*] Show all: %v\n", config.ShowAll)
	if config.GenerateReport {
		fmt.Printf("[*] CSV report generation: enabled\n")
		fmt.Printf("[*] CSV output: %s\n", config.CSVOutput)
	}
	fmt.Println()

	// Initialize scan summary for report generation
	scanSummary := &scanner.ScanSummary{
		TargetURL:            config.URL,
		Method:               config.Method,
		Parameters:           config.Params,
		TotalPayloads:        len(payloads),
		StartTime:            time.Now(),
		BrowserVerifyEnabled: config.BrowserVerify,
		Results:              []scanner.ScanResult{},
	}

	// Scan each parameter
	for _, param := range config.Params {
		paramResults := scanParameter(config, param, payloads)
		scanSummary.Results = append(scanSummary.Results, paramResults...)
	}

	// Update summary counts
	scanSummary.EndTime = time.Now()
	for _, result := range scanSummary.Results {
		switch result.ReflectionType {
		case scanner.RawReflection:
			scanSummary.RawCount++
			if result.BrowserVerified {
				scanSummary.VerifiedCount++
			}
		case scanner.EscapedReflection:
			scanSummary.EscapedCount++
		}
	}

	// Generate report if requested
	if config.GenerateReport {
		fmt.Println("\n[*] Generating CSV report...")

		// Save CSV report
		err = scanner.SaveCSVReport(scanSummary, config.CSVOutput)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[!] Failed to save CSV report: %v\n", err)
		} else {
			fmt.Printf("[+] CSV Report saved to: %s\n", config.CSVOutput)
		}

		// Sync to Google Drive using rclone
		fmt.Println("\n[*] Syncing reports to Google Drive...")
		cmd := exec.Command("rclone", "sync", "./outputs", "gdrive:csv-data")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "[!] Failed to sync to Google Drive: %v\n", err)
			fmt.Fprintf(os.Stderr, "[!] Make sure rclone is configured (run: rclone config)\n")
		} else {
			fmt.Printf("[+] Reports synced to Google Drive: gdrive:csv-data\n")
		}
	}

	// Calculate and display total scan time
	totalDuration := scanSummary.EndTime.Sub(scanSummary.StartTime)
	fmt.Printf("\n[*] Scan completed in %s\n", formatDuration(totalDuration))
	fmt.Printf("[*] Total payloads tested: %d\n", len(scanSummary.Results))
	fmt.Printf("[*] Average time per payload: %.3f seconds\n", totalDuration.Seconds()/float64(len(scanSummary.Results)))
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
	customPayload := flag.String("custom-payload", "", "Use ONLY this custom payload (ignores built-in payloads)")
	payloadFile := flag.String("payload-file", "", "Path to custom payload file (.txt only)")
	browserVerify := flag.Bool("browser-verify", false, "Verify XSS execution in headless browser (requires ChromeDriver)")
	chromeDriver := flag.String("chrome-driver", "chromedriver", "Path to ChromeDriver executable")
	generateReport := flag.Bool("report", false, "Generate CSV report with visualizations")
	csvOutput := flag.String("csv-output", "", "Custom output file path for CSV report (default: auto-generated in outputs/)")

	// Custom usage message
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "XSSpect - Reflected XSS Scanner\n\n")
		fmt.Fprintf(os.Stderr, "Usage: xsspect [options]\n\n")
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
		fmt.Fprintf(os.Stderr, "        Use ONLY this custom payload (ignores built-in payloads)\n")
		fmt.Fprintf(os.Stderr, "  --payload-file string\n")
		fmt.Fprintf(os.Stderr, "        Path to custom payload file (.txt only, shows only triggered)\n")
		fmt.Fprintf(os.Stderr, "  --browser-verify\n")
		fmt.Fprintf(os.Stderr, "        Verify XSS execution in headless browser (requires ChromeDriver)\n")
		fmt.Fprintf(os.Stderr, "  --chrome-driver string\n")
		fmt.Fprintf(os.Stderr, "        Path to ChromeDriver executable (default: chromedriver)\n")
		fmt.Fprintf(os.Stderr, "  --report\n")
		fmt.Fprintf(os.Stderr, "        Generate CSV report with visualizations (auto-timestamped in outputs/)\n")
		fmt.Fprintf(os.Stderr, "  --csv-output string\n")
		fmt.Fprintf(os.Stderr, "        Custom output file path for CSV report (default: auto-generated)\n\n")
		fmt.Fprintf(os.Stderr, "Example:\n")
		fmt.Fprintf(os.Stderr, "  xsspect --url https://example.com/search --params q,name --method GET\n")
		fmt.Fprintf(os.Stderr, "  xsspect --url https://example.com/search --params q --report\n")
		fmt.Fprintf(os.Stderr, "  xsspect --url https://example.com/search --params q --report --csv-output results.csv\n\n")
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
	config.PayloadFile = *payloadFile
	config.BrowserVerify = *browserVerify
	config.ChromeDriverPath = *chromeDriver
	config.GenerateReport = *generateReport

	// Generate timestamped filename if report generation is enabled and no custom path provided
	if config.GenerateReport {
		// Create outputs directory if it doesn't exist
		if err := os.MkdirAll("outputs", 0755); err != nil {
			return nil, fmt.Errorf("failed to create outputs directory: %w", err)
		}

		// Generate timestamp-based filename
		timestamp := time.Now().Format("20060102_150405")

		if *csvOutput == "" {
			config.CSVOutput = fmt.Sprintf("outputs/xsspect_report_%s.csv", timestamp)
		} else {
			config.CSVOutput = *csvOutput
		}
	} else {
		config.CSVOutput = *csvOutput
	}

	// Validate that only one payload source is specified
	if config.CustomPayload != "" && config.PayloadFile != "" {
		return nil, fmt.Errorf("cannot use both --custom-payload and --payload-file together")
	}

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

// loadPayloadsFromFile loads XSS payloads from a custom user-provided file
func loadPayloadsFromFile(filePath string) ([]string, error) {
	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(filePath), ".txt") {
		return nil, fmt.Errorf("only .txt files are supported")
	}

	// Try to open the file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open payload file: %w", err)
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
		return nil, fmt.Errorf("error reading payload file: %w", err)
	}

	return payloads, nil
}

// scanParameter tests a single parameter with all payloads using concurrent workers
func scanParameter(config *Config, param string, payloads []string) []scanner.ScanResult {
	fmt.Printf("[*] Testing param: %s\n", param)
	fmt.Printf("[*] Concurrent mode: 10 workers, 5 browser instances\n")

	var results []scanner.ScanResult
	var resultsMutex sync.Mutex

	// Initialize browser pool if enabled
	var browserPool *scanner.BrowserPool
	if config.BrowserVerify {
		fmt.Printf("[*] Initializing browser pool with 5 instances...\n")
		pool, err := scanner.NewBrowserPool(5, config.ChromeDriverPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[!] Failed to initialize browser pool: %v\n", err)
			fmt.Fprintf(os.Stderr, "[!] Continuing without browser verification...\n\n")
			config.BrowserVerify = false
		} else {
			browserPool = pool
			defer browserPool.Cleanup()
		}
	}

	// Create worker pool with 10 workers
	workerPool := scanner.NewWorkerPool(10, browserPool, config.BrowserVerify)
	workerPool.Start()

	// Result collector goroutine
	rawHitCount := 0
	escapedHitCount := 0
	verifiedHitCount := 0

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for result := range workerPool.GetResultQueue() {
			if result.Error != nil {
				// Silently skip errors to keep output clean
				continue
			}

			// Store result
			resultsMutex.Lock()
			results = append(results, result.ScanResult)

			// Update counters
			switch result.ReflectionType {
			case scanner.RawReflection:
				rawHitCount++
				if result.BrowserVerified {
					verifiedHitCount++
				}
			case scanner.EscapedReflection:
				escapedHitCount++
			}
			resultsMutex.Unlock()

			// Print results based on reflection type
			switch result.ReflectionType {
			case scanner.RawReflection:
				if result.BrowserVerified {
					fmt.Printf("[✓] BROWSER VERIFIED XSS: %s | Param: %s | Payload: %s\n",
						result.URL, result.Parameter, result.Payload)
				} else if config.BrowserVerify {
					fmt.Printf("[~] RAW REFLECTION (not verified): %s | Param: %s | Payload: %s\n",
						result.URL, result.Parameter, result.Payload)
				} else {
					fmt.Printf("[!] RAW REFLECTION: %s | Param: %s | Payload: %s\n",
						result.URL, result.Parameter, result.Payload)
				}
			case scanner.EscapedReflection:
				if config.ShowAll {
					fmt.Printf("[-] ESCAPED: %s | Payload: %s\n", result.Parameter, result.Payload)
				}
			default:
				if config.ShowAll {
					fmt.Printf("[.] NO REFLECTION: %s | Payload: %s\n", result.Parameter, result.Payload)
				}
			}

			// Stop on hit if enabled
			if config.StopOnHit && result.ReflectionType == scanner.RawReflection {
				workerPool.Stop()
				return
			}
		}
	}()

	// Submit all jobs
	jobID := 0
	for _, payload := range payloads {
		testURL, err := scanner.BuildRequestURL(config.URL, param, payload)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[!] Error building URL: %v\n", err)
			continue
		}

		job := scanner.PayloadJob{
			Payload:   payload,
			URL:       testURL,
			Method:    config.Method,
			Parameter: param,
			JobID:     jobID,
		}
		workerPool.SubmitJob(job)
		jobID++
	}

	// Close job queue and wait for workers to finish
	workerPool.CloseJobs()
	workerPool.Wait()

	// Wait for result collector to finish
	wg.Wait()

	// Print summary
	fmt.Printf("\n[*] Scan completed for parameter: %s\n", param)
	fmt.Printf("[*] Total payloads tested: %d\n", len(payloads))
	if rawHitCount > 0 {
		fmt.Printf("[!] RAW reflections found: %d\n", rawHitCount)
	}
	if verifiedHitCount > 0 {
		fmt.Printf("[✓] Browser verified: %d\n", verifiedHitCount)
	}
	if escapedHitCount > 0 {
		fmt.Printf("[-] Escaped reflections: %d\n", escapedHitCount)
	}
	fmt.Println()

	return results
}

// formatDuration formats a duration into a human-readable string
func formatDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%.2f seconds", d.Seconds())
	}
	minutes := int(d.Minutes())
	seconds := int(d.Seconds()) % 60
	return fmt.Sprintf("%d minutes %d seconds", minutes, seconds)
}

// printBanner prints the application banner
func printBanner() {
	banner := `
 __   __ _____ _____                 _   
 \ \ / // ____/ ____|              	| |  
  \ V /| (___| (___  _ __   ___  ___| |_ 
   > <  \___ \\___ \| '_ \ / _ \/ __| __|
  / . \ ____) |___) | |_) |  __/ (__| |_ 
 /_/ \_\_____/_____/| .__/ \___|\___|\__|
                    | |                  
                    |_|                  
 Reflected XSS Scanner
 ========================================
`
	fmt.Println(banner)
}
