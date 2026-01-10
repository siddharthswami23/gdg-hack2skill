import {
  BookOpen,
  Terminal,
  Globe,
  Cookie,
  FileText,
  Clock,
  Layers,
  AlertTriangle,
  Shield,
  Code,
  ExternalLink,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Accordion from '../components/ui/Accordion';
import Badge from '../components/ui/Badge';

const DocsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-400" />
          Documentation
        </h1>
        <p className="text-gray-400 mt-2">
          Learn how to use XSSpect to scan for XSS vulnerabilities effectively.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Quick Start Guide</Card.Title>
          <Card.Description>Get up and running in minutes</Card.Description>
        </Card.Header>
        <Card.Content>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </span>
              <div>
                <h4 className="font-medium text-white">Enter Target URL</h4>
                <p className="text-gray-400 text-sm">
                  Navigate to the Scanner page and enter the URL you want to test. 
                  Include query parameters if testing specific injection points.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </span>
              <div>
                <h4 className="font-medium text-white">Configure Options</h4>
                <p className="text-gray-400 text-sm">
                  Set request method, add cookies for authenticated testing, and adjust 
                  timeout and concurrency settings as needed.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </span>
              <div>
                <h4 className="font-medium text-white">Run Scan</h4>
                <p className="text-gray-400 text-sm">
                  Click "Start Scan" and wait for the results. The scanner will test 
                  multiple payloads against your target.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </span>
              <div>
                <h4 className="font-medium text-white">Review Results</h4>
                <p className="text-gray-400 text-sm">
                  Analyze the findings, copy payloads for verification, and export 
                  reports in CSV format.
                </p>
              </div>
            </li>
          </ol>
        </Card.Content>
      </Card>

      {/* Parameters Reference */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Configuration Parameters</Card.Title>
          <Card.Description>Detailed explanation of all scan options</Card.Description>
        </Card.Header>
        <Card.Content className="p-0">
          <Accordion>
            <Accordion.Item title="Target URL" icon={<Globe className="w-4 h-4" />} defaultOpen>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  The URL of the web page you want to scan for XSS vulnerabilities.
                </p>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Example:</p>
                  <code className="text-indigo-400">https://example.com/search?q=test</code>
                </div>
                <p className="text-gray-400">
                  <strong>Tip:</strong> Include query parameters to test specific injection points.
                </p>
              </div>
            </Accordion.Item>

            <Accordion.Item title="Request Method" icon={<Terminal className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Choose between GET and POST request methods.
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li><strong>GET:</strong> Test URL parameters and query strings</li>
                  <li><strong>POST:</strong> Test form submissions and request body data</li>
                </ul>
              </div>
            </Accordion.Item>

            {/* <Accordion.Item title="Cookies" icon={<Cookie className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Session cookies for authenticated scanning.
                </p>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Format:</p>
                  <code className="text-indigo-400">session=abc123; token=xyz789</code>
                </div>
                <p className="text-gray-400">
                  <strong>Note:</strong> Required for testing pages that require login.
                </p>
              </div>
            </Accordion.Item> */}

            <Accordion.Item title="Custom Headers" icon={<FileText className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Additional HTTP headers to include in requests.
                </p>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Format (one per line):</p>
                  <code className="text-indigo-400 block">Authorization: Bearer token123</code>
                  <code className="text-indigo-400 block">X-Custom-Header: value</code>
                </div>
              </div>
            </Accordion.Item>

            {/* <Accordion.Item title="Timeout" icon={<Clock className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Maximum time to wait for each HTTP request response.
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Default: 30 seconds</li>
                  <li>Range: 5-120 seconds</li>
                  <li>Increase for slow servers or complex pages</li>
                </ul>
              </div>
            </Accordion.Item> */}

            {/* <Accordion.Item title="Concurrency" icon={<Layers className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Number of simultaneous requests to send.
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Default: 10 concurrent requests</li>
                  <li>Range: 1-50</li>
                  <li>Lower values are safer, higher values are faster</li>
                </ul>
                <p className="text-amber-400">
                  <strong>Warning:</strong> High concurrency may trigger rate limiting.
                </p>
              </div>
            </Accordion.Item> */}

            <Accordion.Item title="Custom Payloads" icon={<Code className="w-4 h-4" />}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Use your own XSS payloads instead of the built-in library.
                </p>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Format (one per line):</p>
                  <code className="text-red-400 block">&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
                  <code className="text-red-400 block">&lt;img src=x onerror=alert(1)&gt;</code>
                </div>
                <p className="text-gray-400">
                  Leave empty to use the default payload library.
                </p>
              </div>
            </Accordion.Item>
          </Accordion>
        </Card.Content>
      </Card>

      {/* XSS Types */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Understanding XSS Types
          </Card.Title>
        </Card.Header>
        <Card.Content className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-white">Reflected XSS</h4>
              <Badge variant="high" size="sm">Common</Badge>
            </div>
            <p className="text-gray-400 text-sm">
              The malicious script is reflected off the web server in error messages, 
              search results, or any response that includes input sent to the server.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-white">Stored XSS</h4>
              <Badge variant="critical" size="sm">Severe</Badge>
            </div>
            <p className="text-gray-400 text-sm">
              The malicious script is permanently stored on the target servers, 
              such as in a database, comment field, or forum post.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-white">DOM-based XSS</h4>
              <Badge variant="medium" size="sm">Client-side</Badge>
            </div>
            <p className="text-gray-400 text-sm">
              The vulnerability exists in client-side code rather than server-side. 
              The attack payload is executed by modifying the DOM environment.
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Best Practices */}
      {/* <Card className="mb-8">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Best Practices
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Always get permission</p>
                <p className="text-gray-400">Only scan applications you own or have explicit authorization to test.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Start with low concurrency</p>
                <p className="text-gray-400">Begin with 5-10 concurrent requests to avoid overwhelming the server.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Test in staging first</p>
                <p className="text-gray-400">When possible, test against a staging or development environment.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Verify findings manually</p>
                <p className="text-gray-400">Always manually verify reported vulnerabilities to confirm they are exploitable.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Document everything</p>
                <p className="text-gray-400">Export and save scan reports for compliance and remediation tracking.</p>
              </div>
            </li>
          </ul>
        </Card.Content>
      </Card> */}

      {/* Resources */}
      <Card>
        <Card.Header>
          <Card.Title>Additional Resources</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://owasp.org/www-community/attacks/xss/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
            >
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <ExternalLink className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">OWASP XSS Guide</p>
                <p className="text-gray-400 text-sm">Official documentation</p>
              </div>
            </a>
            <a
              href="https://portswigger.net/web-security/cross-site-scripting"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
            >
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <ExternalLink className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">PortSwigger XSS Labs</p>
                <p className="text-gray-400 text-sm">Hands-on practice</p>
              </div>
            </a>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default DocsPage;
