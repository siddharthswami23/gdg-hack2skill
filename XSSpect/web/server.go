package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ScanRequest represents the incoming scan request from frontend
type ScanRequest struct {
	URL        string `json:"url"`
	Method     string `json:"method"`
	Parameters string `json:"parameters"`
}

// ScanInfo tracks information about a running/completed scan
type ScanInfo struct {
	ScanID     string       `json:"scanId"`
	URL        string       `json:"url"`
	Method     string       `json:"method"`
	Parameters []string     `json:"parameters"`
	Status     string       `json:"status"` // "running", "completed", "failed", "stopped"
	StartTime  time.Time    `json:"startTime"`
	EndTime    *time.Time   `json:"endTime,omitempty"`
	CSVFile    string       `json:"csvFile"`
	Progress   ScanProgress `json:"progress"`
	Results    *ScanResults `json:"results,omitempty"`
	Error      string       `json:"error,omitempty"`
	Cmd        *exec.Cmd    `json:"-"`
}

// ScanProgress tracks scan progress
type ScanProgress struct {
	CurrentPayload int `json:"currentPayload"`
	TotalPayloads  int `json:"totalPayloads"`
	VulnsFound     int `json:"vulnsFound"`
}

// ScanResults represents the final scan results
type ScanResults struct {
	TotalTests           int       `json:"totalTests"`
	VulnerabilitiesFound int       `json:"vulnerabilitiesFound"`
	ScanDuration         string    `json:"scanDuration"`
	Findings             []Finding `json:"findings"`
}

// Finding represents a single vulnerability finding
type Finding struct {
	ID        int    `json:"id"`
	Severity  string `json:"severity"`
	Type      string `json:"type"`
	URL       string `json:"url"`
	Parameter string `json:"parameter"`
	Payload   string `json:"payload"`
	Evidence  string `json:"evidence"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
	Duration  string `json:"duration"`
}

// Global scan tracker
var (
	activeScans sync.Map
	scanCounter int
)

func main() {
	// Simple HTTP server without external dependencies
	http.HandleFunc("/api/scan", handleStartScan)
	http.HandleFunc("/api/scan/", handleScanRoutes)
	http.HandleFunc("/api/scans", handleGetScans)

	// Ensure outputs directory exists
	if err := os.MkdirAll("../outputs", 0755); err != nil {
		log.Fatalf("Failed to create outputs directory: %v", err)
	}

	port := ":8080"
	log.Printf("🚀 XSSpect backend server starting on http://localhost%s", port)
	log.Printf("📂 CSV reports will be saved to: ../outputs/")
	log.Fatal(http.ListenAndServe(port, nil))
}

// handleScanRoutes routes all /api/scan/* requests
func handleScanRoutes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Extract scanId from URL
	path := strings.TrimPrefix(r.URL.Path, "/api/scan/")
	parts := strings.Split(path, "/")
	scanId := parts[0]

	if len(parts) == 1 {
		// /api/scan/{scanId}
		if r.Method == "DELETE" {
			handleDeleteScan(w, r, scanId)
		} else {
			handleGetScanStatus(w, r, scanId)
		}
	} else if len(parts) == 2 {
		// /api/scan/{scanId}/{action}
		action := parts[1]
		switch action {
		case "status":
			handleGetScanStatus(w, r, scanId)
		case "results":
			handleGetScanResults(w, r, scanId)
		case "stop":
			handleStopScan(w, r, scanId)
		case "download":
			handleDownloadCSV(w, r, scanId)
		default:
			respondError(w, http.StatusNotFound, "Not found")
		}
	}
}

// handleStartScan starts a new XSS scan
func handleStartScan(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.URL == "" {
		respondError(w, http.StatusBadRequest, "URL is required")
		return
	}

	// Extract parameters from URL if not provided
	params := req.Parameters
	if params == "" {
		// Try to extract from URL query string
		params = extractParametersFromURL(req.URL)
	}

	if params == "" {
		respondError(w, http.StatusBadRequest, "Parameters are required")
		return
	}

	// Generate unique scan ID
	scanID := generateScanID()
	csvFile := fmt.Sprintf("outputs/scan_%s.csv", scanID)
	csvFilePath := filepath.Join("..", csvFile) // Absolute path from web directory

	// Build xsspect command
	args := []string{
		"--url", req.URL,
		"--params", params,
		"--method", req.Method,
		"--browser-verify",
		"--report",
		"--csv-output", csvFile,
	}

	// Create command - execute from XSSpect root directory
	cmd := exec.Command("./xsspect", args...)
	cmd.Dir = ".."

	// Capture stderr for better error messages
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout

	// Start scan in background
	if err := cmd.Start(); err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start scan: %v", err))
		return
	}

	// Create scan info
	scanInfo := &ScanInfo{
		ScanID:     scanID,
		URL:        req.URL,
		Method:     req.Method,
		Parameters: strings.Split(params, ","),
		Status:     "running",
		StartTime:  time.Now(),
		CSVFile:    csvFilePath,
		Cmd:        cmd,
		Progress: ScanProgress{
			CurrentPayload: 0,
			TotalPayloads:  0,
			VulnsFound:     0,
		},
	}

	// Store scan info
	activeScans.Store(scanID, scanInfo)

	// Monitor scan in goroutine
	go monitorScan(scanID, cmd)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"scanId":  scanID,
		"status":  "running",
		"message": "Scan started successfully",
	})
}

// handleGetScanStatus returns the current status of a scan
func handleGetScanStatus(w http.ResponseWriter, r *http.Request, scanID string) {

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		respondError(w, http.StatusNotFound, "Scan not found")
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)

	// Update progress by checking CSV file
	if scanInfo.Status == "running" {
		updateScanProgress(scanInfo)
	}

	respondJSON(w, http.StatusOK, scanInfo)
}

// handleGetScanResults returns the detailed results of a completed scan
func handleGetScanResults(w http.ResponseWriter, r *http.Request, scanID string) {

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		respondError(w, http.StatusNotFound, "Scan not found")
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)

	// If scan is completed, parse CSV and return results
	if scanInfo.Status == "completed" {
		if scanInfo.Results == nil {
			results, err := parseCSVResults(scanInfo.CSVFile, scanInfo)
			if err != nil {
				respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to parse results: %v", err))
				return
			}
			scanInfo.Results = results
		}
	}

	respondJSON(w, http.StatusOK, scanInfo)
}

// handleStopScan stops a running scan
func handleStopScan(w http.ResponseWriter, r *http.Request, scanID string) {

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		respondError(w, http.StatusNotFound, "Scan not found")
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)

	if scanInfo.Status != "running" {
		respondError(w, http.StatusBadRequest, "Scan is not running")
		return
	}

	// Kill the process
	if scanInfo.Cmd != nil && scanInfo.Cmd.Process != nil {
		if err := scanInfo.Cmd.Process.Kill(); err != nil {
			respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to stop scan: %v", err))
			return
		}
	}

	endTime := time.Now()
	scanInfo.Status = "stopped"
	scanInfo.EndTime = &endTime

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Scan stopped successfully",
		"scanId":  scanID,
	})
}

// handleDownloadCSV serves the CSV file for download
func handleDownloadCSV(w http.ResponseWriter, r *http.Request, scanID string) {

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		respondError(w, http.StatusNotFound, "Scan not found")
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)

	// Check if CSV file exists
	if _, err := os.Stat(scanInfo.CSVFile); os.IsNotExist(err) {
		respondError(w, http.StatusNotFound, "CSV file not found")
		return
	}

	// Serve the file
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=scan_%s.csv", scanID))
	http.ServeFile(w, r, scanInfo.CSVFile)
}

// handleGetScans returns all scans (for history page)
func handleGetScans(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	// Get pagination params
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			page = p
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	// Collect all scans
	var scans []*ScanInfo
	activeScans.Range(func(key, value interface{}) bool {
		scanInfo := value.(*ScanInfo)
		scans = append(scans, scanInfo)
		return true
	})

	// Sort by start time (newest first)
	for i := 0; i < len(scans); i++ {
		for j := i + 1; j < len(scans); j++ {
			if scans[i].StartTime.Before(scans[j].StartTime) {
				scans[i], scans[j] = scans[j], scans[i]
			}
		}
	}

	// Paginate
	total := len(scans)
	start := (page - 1) * limit
	end := start + limit

	if start >= total {
		scans = []*ScanInfo{}
	} else {
		if end > total {
			end = total
		}
		scans = scans[start:end]
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"scans": scans,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// handleDeleteScan deletes a scan and its CSV file
func handleDeleteScan(w http.ResponseWriter, r *http.Request, scanID string) {

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		respondError(w, http.StatusNotFound, "Scan not found")
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)

	// Delete CSV file if exists
	if _, err := os.Stat(scanInfo.CSVFile); err == nil {
		os.Remove(scanInfo.CSVFile)
	}

	// Remove from map
	activeScans.Delete(scanID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Scan deleted successfully",
	})
}

// monitorScan monitors a scan process and updates its status
func monitorScan(scanID string, cmd *exec.Cmd) {
	err := cmd.Wait()

	scanInfoInterface, ok := activeScans.Load(scanID)
	if !ok {
		return
	}

	scanInfo := scanInfoInterface.(*ScanInfo)
	endTime := time.Now()
	scanInfo.EndTime = &endTime

	if err != nil {
		scanInfo.Status = "failed"
		scanInfo.Error = err.Error()
	} else {
		scanInfo.Status = "completed"
		// Parse results
		results, err := parseCSVResults(scanInfo.CSVFile, scanInfo)
		if err == nil {
			scanInfo.Results = results
		}
	}
}

// updateScanProgress updates scan progress by checking CSV file line count
func updateScanProgress(scanInfo *ScanInfo) {
	if _, err := os.Stat(scanInfo.CSVFile); os.IsNotExist(err) {
		return
	}

	file, err := os.Open(scanInfo.CSVFile)
	if err != nil {
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	lineCount := 0
	vulnCount := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}
		lineCount++

		// Count vulnerabilities (skip header)
		if lineCount > 1 && len(record) > 5 {
			reflectionType := record[5] // Reflection_Type column
			if reflectionType == "RAW_REFLECTION" {
				vulnCount++
			}
		}
	}

	scanInfo.Progress.CurrentPayload = lineCount - 1 // Exclude header
	scanInfo.Progress.VulnsFound = vulnCount
}

// parseCSVResults parses the CSV file and returns structured results
func parseCSVResults(csvFile string, scanInfo *ScanInfo) (*ScanResults, error) {
	file, err := os.Open(csvFile)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(records) < 2 {
		return &ScanResults{
			TotalTests:           0,
			VulnerabilitiesFound: 0,
			ScanDuration:         "0s",
			Findings:             []Finding{},
		}, nil
	}

	var findings []Finding
	vulnCount := 0

	// Skip header (first row)
	for i, record := range records[1:] {
		if len(record) < 11 {
			continue
		}

		severity := mapSeverity(record[10])
		reflectionType := record[7]

		// Only include actual vulnerabilities in findings
		if reflectionType == "RAW_REFLECTION" || severity == "critical" || severity == "high" {
			vulnCount++

			finding := Finding{
				ID:        i + 1,
				Severity:  severity,
				Type:      determineXSSType(reflectionType),
				URL:       record[3],
				Parameter: record[5],
				Payload:   record[6],
				Evidence:  fmt.Sprintf("Reflection Type: %s, Browser Verified: %s", record[7], record[8]),
				StartTime: record[0],
				EndTime:   record[1],
				Duration:  record[2],
			}
			findings = append(findings, finding)
		}
	}

	duration := "0s"
	if scanInfo.EndTime != nil {
		duration = scanInfo.EndTime.Sub(scanInfo.StartTime).Round(time.Second).String()
	}

	return &ScanResults{
		TotalTests:           len(records) - 1,
		VulnerabilitiesFound: vulnCount,
		ScanDuration:         duration,
		Findings:             findings,
	}, nil
}

// Helper functions

func generateScanID() string {
	scanCounter++
	return fmt.Sprintf("%d_%d", scanCounter, time.Now().Unix())
}

func extractParametersFromURL(urlStr string) string {
	// Simple parameter extraction from query string
	parts := strings.Split(urlStr, "?")
	if len(parts) < 2 {
		return ""
	}

	params := strings.Split(parts[1], "&")
	var paramNames []string
	for _, param := range params {
		name := strings.Split(param, "=")[0]
		if name != "" {
			paramNames = append(paramNames, name)
		}
	}

	return strings.Join(paramNames, ",")
}

func mapSeverity(csvSeverity string) string {
	switch strings.ToLower(csvSeverity) {
	case "critical":
		return "critical"
	case "high":
		return "high"
	case "medium":
		return "medium"
	case "low":
		return "low"
	default:
		return "info"
	}
}

func determineXSSType(reflectionType string) string {
	if reflectionType == "RAW_REFLECTION" {
		return "Reflected XSS"
	}
	return "Potential XSS"
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error":   "true",
		"message": message,
	})
}
