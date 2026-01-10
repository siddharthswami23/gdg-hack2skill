package scanner

import (
	"fmt"
	"sync"
	"time"
)

// PayloadJob represents a job to test a payload
type PayloadJob struct {
	Payload   string
	URL       string
	Method    string
	Parameter string
	JobID     int
}

// PayloadResult represents the result of testing a payload
type PayloadResult struct {
	ScanResult
	JobID int
	URL   string // URL that was tested
	Error error
}

// BrowserPool manages a pool of browser instances for concurrent verification
type BrowserPool struct {
	browsers      []*BrowserInstance
	availableChan chan int // Channel of available browser indices
	mutex         sync.Mutex
	currentIndex  int // For round-robin distribution
}

// BrowserInstance represents a single headless browser with mutex protection
type BrowserInstance struct {
	ID          int

		availableChan: make(chan int, size),
		currentIndex:  0,
	}

	// Create browser instances
	for i := 0; i < size; i++ {
		config := BrowserConfig{
			ChromeDriverPath: chromeDriverPath,
			Headless:         true,
		}

		browser, err := NewBrowserVerifier(config)
		if err != nil {
			// Clean up already created browsers
			pool.Cleanup()
			return nil, fmt.Errorf("failed to create browser %d: %v", i, err)
		}

		// Start the browser
		err = browser.Start()
		if err != nil {
			pool.Cleanup()
			return nil, fmt.Errorf("failed to start browser %d: %v", i, err)
		}

		instance := &BrowserInstance{
			ID:          i,
			Browser:     browser,
			inUse:       false,
			totalChecks: 0,
		}

		pool.browsers = append(pool.browsers, instance)
		pool.availableChan <- i // Mark as available
	}

	fmt.Printf("[*] Browser pool created with %d instances\n", size)
	return pool, nil
}

// AcquireBrowser gets an available browser instance (round-robin)
func (p *BrowserPool) AcquireBrowser() *BrowserInstance {
	// Wait for an available browser
	index := <-p.availableChan

	p.mutex.Lock()
	instance := p.browsers[index]
	instance.mutex.Lock()
	instance.inUse = true
	instance.mutex.Unlock()
	p.mutex.Unlock()

	return instance
}

// ReleaseBrowser returns a browser instance to the pool
func (p *BrowserPool) ReleaseBrowser(instance *BrowserInstance) {
	instance.mutex.Lock()
	instance.inUse = false
	instance.totalChecks++
	instance.mutex.Unlock()

	// Return to available pool
	p.availableChan <- instance.ID
}

// Cleanup closes all browser instances
func (p *BrowserPool) Cleanup() {
	close(p.availableChan)

	for _, instance := range p.browsers {
		if instance.Browser != nil {
			instance.Browser.Close()
		}
	}

	fmt.Printf("[*] Browser pool cleaned up. Total browsers: %d\n", len(p.browsers))
}

// GetStats returns pool statistics
func (p *BrowserPool) GetStats() map[string]interface{} {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	stats := make(map[string]interface{})
	stats["total_browsers"] = len(p.browsers)
	stats["available"] = len(p.availableChan)

	totalChecks := 0
	for _, instance := range p.browsers {
		instance.mutex.Lock()
		totalChecks += instance.totalChecks
		instance.mutex.Unlock()
	}
	stats["total_checks"] = totalChecks

	return stats
}

// WorkerPool manages concurrent payload testing workers
type WorkerPool struct {
	numWorkers    int
	jobQueue      chan PayloadJob
	resultQueue   chan PayloadResult
	browserPool   *BrowserPool
	wg            sync.WaitGroup
	stopChan      chan struct{}
	browserVerify bool
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(numWorkers int, browserPool *BrowserPool, browserVerify bool) *WorkerPool {
	return &WorkerPool{
		numWorkers:    numWorkers,
		jobQueue:      make(chan PayloadJob, numWorkers*2), // Buffered queue
		resultQueue:   make(chan PayloadResult, numWorkers*2),
		browserPool:   browserPool,
		stopChan:      make(chan struct{}),
		browserVerify: browserVerify,
	}
}

// Start launches all worker goroutines
func (wp *WorkerPool) Start() {
	fmt.Printf("[*] Starting %d workers...\n", wp.numWorkers)

	for i := 0; i < wp.numWorkers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

// worker is the main worker function that processes jobs
func (wp *WorkerPool) worker(workerID int) {
	defer wp.wg.Done()

	for {
		select {
		case job, ok := <-wp.jobQueue:
			if !ok {
				// Job queue closed, worker exits
				return
			}

			// Process the job
			result := wp.processJob(workerID, job)

			// Send result back
			select {
			case wp.resultQueue <- result:
			case <-wp.stopChan:
				return
			}

		case <-wp.stopChan:
			return
		}
	}
}

// processJob handles a single payload testing job
func (wp *WorkerPool) processJob(workerID int, job PayloadJob) PayloadResult {
	startTime := time.Now()

	result := PayloadResult{
		JobID: job.JobID,
		URL:   job.URL,
		ScanResult: ScanResult{
			Parameter:       job.Parameter,
			Payload:         job.Payload,
			ReflectionType:  NoReflection,
			BrowserVerified: false,
			StartTime:       startTime,
		},
	}

	// Step 1: Send HTTP request
	reqConfig := RequestConfig{
		URL:    job.URL,
		Method: job.Method,
	}

	reqResult := SendRequest(reqConfig)
	if reqResult.Error != nil {
		result.Error = reqResult.Error
		result.EndTime = time.Now()
		return result
	}

	// Step 2: Analyze response
	analysisResult := AnalyzeResponse(reqResult.ResponseBody, job.Payload, job.Parameter)

	result.ReflectionType = analysisResult.Type

	// Step 3: Browser verification if raw reflection detected
	if wp.browserVerify && analysisResult.Type == RawReflection {
		// Acquire a browser from the pool
		browserInstance := wp.browserPool.AcquireBrowser()

		// Verify with browser (with retry)
		browserVerified, xssEventType, err := browserInstance.Browser.VerifyWithRetry(job.URL, 1)

		// Release browser back to pool
		wp.browserPool.ReleaseBrowser(browserInstance)

		if err == nil && browserVerified {
			result.BrowserVerified = true
			result.XSSEventType = xssEventType
		}
	}

	result.EndTime = time.Now()
	return result
}

// SubmitJob adds a job to the queue
func (wp *WorkerPool) SubmitJob(job PayloadJob) {
	select {
	case wp.jobQueue <- job:
	case <-wp.stopChan:
	}
}

// CloseJobs signals that no more jobs will be submitted
func (wp *WorkerPool) CloseJobs() {
	close(wp.jobQueue)
}

// Wait waits for all workers to complete
func (wp *WorkerPool) Wait() {
	wp.wg.Wait()
	close(wp.resultQueue)
}

// Stop stops all workers immediately
func (wp *WorkerPool) Stop() {
	close(wp.stopChan)
	wp.wg.Wait()
}

// GetResultQueue returns the result queue channel
func (wp *WorkerPool) GetResultQueue() <-chan PayloadResult {
	return wp.resultQueue
}
