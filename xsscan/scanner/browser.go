package scanner

import (
	"fmt"
	"strings"
	"time"

	"github.com/tebeka/selenium"
	"github.com/tebeka/selenium/chrome"
)

// BrowserConfig holds browser verification configuration
type BrowserConfig struct {
	SeleniumPath     string
	ChromeDriverPath string
	Headless         bool
	Timeout          time.Duration
}

// BrowserVerifier handles browser-based XSS verification
type BrowserVerifier struct {
	service *selenium.Service
	wd      selenium.WebDriver
	config  BrowserConfig
}

// NewBrowserVerifier creates a new browser verifier instance
func NewBrowserVerifier(config BrowserConfig) (*BrowserVerifier, error) {
	// Set defaults
	if config.Timeout == 0 {
		config.Timeout = 5 * time.Second
	}

	return &BrowserVerifier{
		config: config,
	}, nil
}

// Start initializes the browser and WebDriver
func (bv *BrowserVerifier) Start() error {
	// Start Selenium service (if using standalone server)
	// For ChromeDriver, we can directly use it without Selenium server

	// Configure Chrome options
	chromeCaps := chrome.Capabilities{
		Args: []string{
			"--disable-gpu",
			"--no-sandbox",
			"--disable-dev-shm-usage",
			"--disable-blink-features=AutomationControlled",
		},
	}

	if bv.config.Headless {
		chromeCaps.Args = append(chromeCaps.Args, "--headless=new")
	}

	caps := selenium.Capabilities{
		"goog:chromeOptions": chromeCaps,
	}

	// Connect to ChromeDriver (assumes ChromeDriver is running on port 9515)
	// User needs to start ChromeDriver separately: chromedriver --port=9515
	var err error
	bv.wd, err = selenium.NewRemote(caps, "http://localhost:9515")
	if err != nil {
		return fmt.Errorf("failed to connect to ChromeDriver: %w\nMake sure ChromeDriver is running: chromedriver --port=9515", err)
	}

	return nil
}

// VerifyXSSExecution tests if a payload actually triggers JavaScript execution
func (bv *BrowserVerifier) VerifyXSSExecution(url string) (bool, error) {
	if bv.wd == nil {
		return false, fmt.Errorf("browser not started, call Start() first")
	}

	// Inject alert detection script before loading page
	alertDetected := false

	// Navigate to the URL
	err := bv.wd.Get(url)
	if err != nil {
		return false, fmt.Errorf("failed to load URL: %w", err)
	}

	// Wait a moment for page to load and execute
	time.Sleep(1 * time.Second)

	// Check if alert dialog is present
	_, err = bv.wd.AlertText()
	if err == nil {
		// Alert is present!
		alertDetected = true
		// Accept the alert to continue
		bv.wd.AcceptAlert()
	}

	// Additional check: Look for console errors or specific DOM changes
	// Execute JavaScript to check if window.alert was called
	script := `
		return (typeof window.__xss_alert_triggered !== 'undefined') || 
		       (document.body && document.body.innerHTML.indexOf('alert') !== -1);
	`
	result, err := bv.wd.ExecuteScript(script, nil)
	if err == nil && result != nil {
		if triggered, ok := result.(bool); ok && triggered {
			alertDetected = true
		}
	}

	return alertDetected, nil
}

// InjectAlertDetector injects JavaScript to detect alert() calls
func (bv *BrowserVerifier) InjectAlertDetector() error {
	if bv.wd == nil {
		return fmt.Errorf("browser not started")
	}

	script := `
		window.__xss_alert_triggered = false;
		window.__original_alert = window.alert;
		window.alert = function() {
			window.__xss_alert_triggered = true;
			return window.__original_alert.apply(this, arguments);
		};
		window.__original_confirm = window.confirm;
		window.confirm = function() {
			window.__xss_alert_triggered = true;
			return true;
		};
		window.__original_prompt = window.prompt;
		window.prompt = function() {
			window.__xss_alert_triggered = true;
			return "xss";
		};
	`

	_, err := bv.wd.ExecuteScript(script, nil)
	return err
}

// VerifyWithInjectedDetector verifies XSS with pre-injected detector
func (bv *BrowserVerifier) VerifyWithInjectedDetector(url string) (bool, error) {
	if bv.wd == nil {
		return false, fmt.Errorf("browser not started")
	}

	// Navigate to URL
	err := bv.wd.Get(url)
	if err != nil {
		return false, fmt.Errorf("failed to load URL: %w", err)
	}

	// Small delay for initial page load
	time.Sleep(500 * time.Millisecond)

	// Inject the alert detector
	err = bv.InjectAlertDetector()
	if err != nil {
		// If injection fails, page might have already executed XSS
		// Check for alert dialog
		_, alertErr := bv.wd.AlertText()
		if alertErr == nil {
			bv.wd.AcceptAlert()
			return true, nil
		}
		return false, fmt.Errorf("failed to inject detector: %w", err)
	}

	// Wait for potential XSS execution
	time.Sleep(1 * time.Second)

	// Check if alert was triggered
	script := `return window.__xss_alert_triggered === true;`
	result, err := bv.wd.ExecuteScript(script, nil)
	if err != nil {
		// Check for alert dialog as fallback
		_, alertErr := bv.wd.AlertText()
		if alertErr == nil {
			bv.wd.AcceptAlert()
			return true, nil
		}
		return false, nil
	}

	if triggered, ok := result.(bool); ok && triggered {
		return true, nil
	}

	// Final check: Look for alert dialog
	_, err = bv.wd.AlertText()
	if err == nil {
		bv.wd.AcceptAlert()
		return true, nil
	}

	return false, nil
}

// Close closes the browser and cleans up
func (bv *BrowserVerifier) Close() error {
	if bv.wd != nil {
		err := bv.wd.Quit()
		if err != nil {
			return fmt.Errorf("failed to close browser: %w", err)
		}
	}

	if bv.service != nil {
		err := bv.service.Stop()
		if err != nil {
			return fmt.Errorf("failed to stop service: %w", err)
		}
	}

	return nil
}

// QuickVerify is a convenience method to verify XSS without manual browser management
func QuickVerify(url string, headless bool) (bool, error) {
	config := BrowserConfig{
		Headless: headless,
		Timeout:  5 * time.Second,
	}

	bv, err := NewBrowserVerifier(config)
	if err != nil {
		return false, err
	}

	err = bv.Start()
	if err != nil {
		return false, err
	}
	defer bv.Close()

	return bv.VerifyWithInjectedDetector(url)
}

// GetPageTitle retrieves the page title (useful for debugging)
func (bv *BrowserVerifier) GetPageTitle() (string, error) {
	if bv.wd == nil {
		return "", fmt.Errorf("browser not started")
	}
	return bv.wd.Title()
}

// TakeScreenshot captures a screenshot (useful for debugging)
func (bv *BrowserVerifier) TakeScreenshot() ([]byte, error) {
	if bv.wd == nil {
		return nil, fmt.Errorf("browser not started")
	}
	return bv.wd.Screenshot()
}

// IsChromeDriverRunning checks if ChromeDriver is accessible
func IsChromeDriverRunning() bool {
	caps := selenium.Capabilities{}
	wd, err := selenium.NewRemote(caps, "http://localhost:9515")
	if err != nil {
		return false
	}
	wd.Quit()
	return true
}

// GetBrowserLogs retrieves browser console logs
func (bv *BrowserVerifier) GetBrowserLogs() ([]string, error) {
	if bv.wd == nil {
		return nil, fmt.Errorf("browser not started")
	}

	logs, err := bv.wd.Log("browser")
	if err != nil {
		return nil, err
	}

	var messages []string
	for _, log := range logs {
		msg := fmt.Sprintf("[%s] %s", log.Level, log.Message)
		messages = append(messages, msg)
	}

	return messages, nil
}

// CheckForXSSIndicators looks for common XSS execution indicators
func (bv *BrowserVerifier) CheckForXSSIndicators() (bool, error) {
	if bv.wd == nil {
		return false, fmt.Errorf("browser not started")
	}

	// Check 1: Alert dialog present
	_, err := bv.wd.AlertText()
	if err == nil {
		bv.wd.AcceptAlert()
		return true, nil
	}

	// Check 2: Look for eval() or Function() calls in page source
	script := `
		var indicators = [
			document.documentElement.innerHTML.indexOf('eval(') !== -1,
			document.documentElement.innerHTML.indexOf('alert(') !== -1,
			document.documentElement.innerHTML.indexOf('prompt(') !== -1,
			document.documentElement.innerHTML.indexOf('confirm(') !== -1,
			window.__xss_alert_triggered === true
		];
		return indicators.some(function(i) { return i; });
	`

	result, err := bv.wd.ExecuteScript(script, nil)
	if err == nil && result != nil {
		if found, ok := result.(bool); ok {
			return found, nil
		}
	}

	// Check 3: Look for suspicious event handlers in DOM
	source, err := bv.wd.PageSource()
	if err == nil {
		suspiciousPatterns := []string{
			"onerror=",
			"onload=",
			"onmouseover=",
			"onfocus=",
			"javascript:",
		}
		lowerSource := strings.ToLower(source)
		for _, pattern := range suspiciousPatterns {
			if strings.Contains(lowerSource, pattern) {
				return true, nil
			}
		}
	}

	return false, nil
}
