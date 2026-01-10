# XSSpect Web Backend

Go-based REST API backend for XSSpect web interface.

## Setup

### 1. Install Dependencies

```bash
cd web
go mod download
```

### 2. Build the Server

```bash
go build -o xsspect-server server.go
```

### 3. Run the Server

```bash
./xsspect-server
```

The server will start on `http://localhost:8080`

## API Endpoints

### Start a Scan
```
POST /api/scan
Content-Type: application/json

{
  "url": "https://example.com/search",
  "method": "GET",
  "parameters": "q,search",
  "options": {
    "browserVerify": true,
    "stopOnHit": false,
    "showAll": false
  }
}

Response:
{
  "scanId": "1_a1b2c3d4",
  "status": "running",
  "message": "Scan started successfully"
}
```

### Get Scan Status
```
GET /api/scan/{scanId}/status

Response:
{
  "scanId": "1_a1b2c3d4",
  "url": "https://example.com/search",
  "method": "GET",
  "status": "running",
  "progress": {
    "currentPayload": 1234,
    "totalPayloads": 8000,
    "vulnsFound": 3
  }
}
```

### Get Scan Results
```
GET /api/scan/{scanId}/results

Response:
{
  "scanId": "1_a1b2c3d4",
  "status": "completed",
  "results": {
    "totalTests": 8000,
    "vulnerabilitiesFound": 5,
    "scanDuration": "1m23s",
    "findings": [...]
  }
}
```

### Stop a Running Scan
```
POST /api/scan/{scanId}/stop

Response:
{
  "message": "Scan stopped successfully",
  "scanId": "1_a1b2c3d4"
}
```

### Download CSV Report
```
GET /api/scan/{scanId}/download

Returns: CSV file download
```

### Get All Scans (History)
```
GET /api/scans?page=1&limit=10

Response:
{
  "scans": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Delete a Scan
```
DELETE /api/scan/{scanId}

Response:
{
  "message": "Scan deleted successfully"
}
```

## How It Works

1. **Frontend** (React on :5173) sends scan request to backend
2. **Backend** (Go on :8080) receives request and generates unique scan ID
3. **Backend** executes `../xsspect` binary with parameters
4. **XSSpect** runs in background, generates CSV report
5. **Backend** monitors scan progress by reading CSV file
6. **Frontend** polls `/api/scan/{scanId}/status` every 2 seconds
7. **Backend** parses CSV when scan completes and returns results
8. **Frontend** displays results and provides CSV download

## File Structure

```
web/
├── server.go       # Main web server
├── go.mod          # Go dependencies
└── README.md       # This file

../outputs/         # CSV reports stored here
├── scan_1_abc123.csv
├── scan_2_def456.csv
└── ...
```

## Development

### Run in Development Mode
```bash
go run server.go
```

### Build for Production
```bash
go build -o xsspect-server server.go
```

### CORS Configuration
The server allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative React dev server)

## Notes

- Ensure `xsspect` binary is built in parent directory
- CSV files are stored in `../outputs/` directory
- Server automatically creates `outputs/` if it doesn't exist
- Each scan gets a unique ID to prevent collisions
- Multiple scans can run simultaneously
