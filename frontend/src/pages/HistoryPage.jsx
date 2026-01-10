import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { scanHistory } from '../services/storage';

const HistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const history = scanHistory.getAll();
    setScans(history);
  };

  const handleDelete = (scanId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this scan?')) {
      scanHistory.delete(scanId);
      loadHistory();
      toast.success('Scan deleted');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all scan history?')) {
      scanHistory.clear();
      loadHistory();
      toast.success('History cleared');
    }
  };

  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.config?.url?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || scan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'running':
        return <Badge variant="info" size="sm">Running</Badge>;
      case 'failed':
        return <Badge variant="critical" size="sm">Failed</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getVulnerabilityCount = (scan) => {
    return scan.results?.vulnerabilitiesFound || scan.results?.findings?.length || 0;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-400" />
            Scan History
          </h1>
          <p className="text-gray-400 mt-1">
            View and manage your previous XSS scans
          </p>
        </div>
        <div className="flex gap-3">
          {scans.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Clear All
            </Button>
          )}
          <Link to="/scanner">
            <Button leftIcon={<Search className="w-4 h-4" />}>
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {scans.length > 0 && (
        <Card className="mb-6">
          <Card.Content>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by URL..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed
                </Button>
                <Button
                  variant={filterStatus === 'running' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('running')}
                >
                  Running
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Scan List */}
      {filteredScans.length > 0 ? (
        <div className="space-y-4">
          {filteredScans.map((scan) => {
            const vulnCount = getVulnerabilityCount(scan);
            
            return (
              <Link key={scan.id} to={`/results/${scan.id}`}>
                <Card hover className="group">
                  <Card.Content>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                          <h3 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                            {scan.config?.url || 'Unknown URL'}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(scan.timestamp || scan.startTime).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            Method: {scan.config?.method || 'GET'}
                          </span>
                          {scan.results?.scanDuration && (
                            <span>Duration: {scan.results.scanDuration}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {vulnCount > 0 ? (
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">{vulnCount} vulnerabilities</span>
                            </div>
                          ) : scan.status === 'completed' ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">No issues</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(scan.status)}
                          <button
                            onClick={(e) => handleDelete(scan.id, e)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                            title="Delete scan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : scans.length > 0 ? (
        <Card className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Matching Scans</h2>
          <p className="text-gray-400 mb-6">
            No scans match your current filter criteria.
          </p>
          <Button variant="secondary" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
            Clear Filters
          </Button>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Scan History</h2>
          <p className="text-gray-400 mb-6">
            You haven't run any scans yet. Start your first scan to see results here.
          </p>
          <Link to="/scanner">
            <Button leftIcon={<Search className="w-4 h-4" />}>
              Start First Scan
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default HistoryPage;
