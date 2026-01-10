import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Globe,
  Download,
  ArrowLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { scanHistory } from '../services/storage';
import { scannerApi } from '../services/api';

const severityConfig = {
  critical: {
    color: 'critical',
    icon: AlertTriangle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  high: {
    color: 'high',
    icon: AlertTriangle,
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  medium: {
    color: 'medium',
    icon: AlertCircle,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  low: {
    color: 'low',
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
};

const ResultsPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadScanResults();
    // Poll for updates if scan is running
    const interval = setInterval(async () => {
      try {
        const status = await scannerApi.getScanStatus(scanId);
        if (status.status === 'running') {
          setScan(status);
        } else {
          clearInterval(interval);
          loadScanResults();
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [scanId]);

  const loadScanResults = async () => {
    setLoading(true);
    try {
      const results = await scannerApi.getScanResults(scanId);
      setScan(results);
      
      // Show error toast if scan failed
      if (results.status === 'failed') {
        toast.error(`Scan failed: ${results.error || 'Unknown error'}`);
      }
      
      // Save to local storage
      scanHistory.update(scanId, {
        status: results.status,
        endTime: results.endTime,
        results: results.results,
        error: results.error,
      });
    } catch (error) {
      console.error('Failed to load scan results:', error);
      toast.error('Failed to load scan results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const blob = await scannerApi.downloadCSV(scanId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xsspect_scan_${scanId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error('Failed to download CSV:', error);
      toast.error('Failed to download CSV');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading scan results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Scan Not Found</h2>
          <p className="text-gray-400 mb-6">
            The requested scan could not be found. It may have been deleted or expired.
          </p>
          <Link to="/scanner">
            <Button>Start New Scan</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isRunning = scan.status === 'running';
  const results = scan.results || { totalTests: 0, vulnerabilitiesFound: 0, findings: [] };

  // Pagination logic
  const totalFindings = results.findings?.length || 0;
  const totalPages = Math.ceil(totalFindings / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFindings = results.findings?.slice(startIndex, endIndex) || [];

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedFinding(null); // Close any open finding when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            Scan Results
          </h1>
        </div>
        <div className="flex gap-3">
          {!isRunning && results.findings?.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleDownloadCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
          )}
          <Link to="/scanner">
            <Button leftIcon={<RefreshCw className="w-4 h-4" />}>
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Scan Status */}
      {isRunning && (
        <Card className="mb-6 bg-indigo-900/20 border-indigo-500/30">
          <Card.Content className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <div>
              <p className="text-white font-medium">Scan in Progress</p>
              <p className="text-indigo-300 text-sm">
                Testing payloads against target. This may take a few minutes...
              </p>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Error Status */}
      {scan.status === 'failed' && (
        <Card className="mb-6 bg-red-900/20 border-red-500/30">
          <Card.Content className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div className="flex-1">
              <p className="text-white font-medium">Scan Failed</p>
              <p className="text-red-300 text-sm">
                {scan.error || 'An error occurred during the scan. Please check your URL and parameters.'}
              </p>
            </div>
            <Link to="/scanner">
              <Button variant="secondary" size="sm">
                Try Again
              </Button>
            </Link>
          </Card.Content>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <Card.Content className="text-center">
            <Globe className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{results.totalTests || 0}</p>
            <p className="text-gray-400 text-sm">Tests Run</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{results.vulnerabilitiesFound || 0}</p>
            <p className="text-gray-400 text-sm">Vulnerabilities</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="text-center">
            <Clock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{results.scanDuration || 'N/A'}</p>
            <p className="text-gray-400 text-sm">Duration</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="text-center">
            {results.vulnerabilitiesFound > 0 ? (
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            )}
            <p className="text-2xl font-bold text-white">
              {results.vulnerabilitiesFound > 0 ? 'At Risk' : 'Secure'}
            </p>
            <p className="text-gray-400 text-sm">Status</p>
          </Card.Content>
        </Card>
      </div>

      {/* Target Info */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title>Target Information</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">URL:</span>
              <p className="text-white font-mono break-all">{scan.url}</p>
            </div>
            <div>
              <span className="text-gray-400">Method:</span>
              <p className="text-white">{scan.method || 'GET'}</p>
            </div>
            <div>
              <span className="text-gray-400">Started:</span>
              <p className="text-white">{new Date(scan.startTime).toLocaleString()}</p>
            </div>
            {scan.endTime && (
              <div>
                <span className="text-gray-400">Completed:</span>
                <p className="text-white">{new Date(scan.endTime).toLocaleString()}</p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Findings */}
      {results.findings && results.findings.length > 0 ? (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Vulnerabilities Found ({results.findings.length})
              </div>
              {totalPages > 1 && (
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-gray-800">
              {currentFindings.map((finding) => {
                const config = severityConfig[finding.severity] || severityConfig.low;
                const Icon = config.icon;
                
                return (
                  <div
                    key={finding.id}
                    className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                      selectedFinding === finding.id ? 'bg-gray-800/50' : ''
                    }`}
                    onClick={() => setSelectedFinding(
                      selectedFinding === finding.id ? null : finding.id
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`w-5 h-5 text-${finding.severity === 'critical' ? 'red' : finding.severity === 'high' ? 'orange' : finding.severity === 'medium' ? 'yellow' : 'blue'}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">{finding.type}</h4>
                            <Badge variant={config.color} size="sm">
                              {finding.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Parameter: <span className="text-indigo-400 font-mono">{finding.parameter}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedFinding === finding.id && (
                      <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Payload:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-red-400 font-mono break-all">
                              {finding.payload}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(finding.payload);
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Evidence:</p>
                          <p className="text-gray-300 text-sm bg-gray-900 px-3 py-2 rounded">
                            {finding.evidence}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Affected URL:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-gray-300 font-mono break-all">
                              {finding.url}
                            </code>
                            <a
                              href={finding.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Content>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card.Footer>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalFindings)} of {totalFindings} vulnerabilities
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[2.5rem] h-10 px-3 rounded transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card.Footer>
          )}
        </Card>
      ) : !isRunning ? (
        <Card className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Vulnerabilities Found</h2>
          <p className="text-gray-400">
            Great news! No XSS vulnerabilities were detected in the target application.
          </p>
        </Card>
      ) : null}
    </div>
  );
};

export default ResultsPage;
