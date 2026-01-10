import { Link } from 'react-router-dom';
import {
  Shield,
  Search,
  Zap,
  FileText,
  ArrowRight,
  Bug,
  Lock,
  Terminal,
  CheckCircle,
  Code,
  Target,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const features = [
  {
    icon: Bug,
    title: 'Smart Detection',
    description: 'Advanced algorithms detect reflected, stored, and DOM-based XSS vulnerabilities with high accuracy.',
  },
  {
    icon: Zap,
    title: 'Fast Scanning',
    description: 'Concurrent request handling with configurable threads for rapid vulnerability assessment.',
  },
  {
    icon: Code,
    title: 'Custom Payloads',
    description: 'Use built-in payload library or upload your own custom payloads for targeted testing.',
  },
  {
    icon: FileText,
    title: 'Detailed Reports',
    description: 'Comprehensive reports with vulnerability details, proof of concept, and remediation guidance.',
  },
  {
    icon: Lock,
    title: 'Secure Testing',
    description: 'All scans run in isolated environments with no data stored on external servers.',
  },
  {
    icon: Terminal,
    title: 'API Access',
    description: 'Full REST API access for integration with your CI/CD pipelines and security workflows.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Enter Target URL',
    description: 'Provide the target URL and configure scan parameters like headers.',
  },
  {
    number: '02',
    title: 'Configure Options',
    description: 'Set timeout, concurrency, request method, and choose custom payloads if needed.',
  },
  {
    number: '03',
    title: 'Run Scan',
    description: 'Start the scan and monitor progress in real-time as vulnerabilities are discovered.',
  },
  {
    number: '04',
    title: 'Review Results',
    description: 'Analyze detailed findings, export reports, and get remediation recommendations.',
  },
];

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-gray-950 to-purple-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 animate-pulse-glow">
                <Shield className="w-16 h-16 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Detect XSS Vulnerabilities
              <span className="block text-indigo-400">Before Attackers Do</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              XSSpect is a powerful cross-site scripting (XSS) vulnerability scanner 
              that helps security researchers and developers identify and fix XSS flaws 
              in web applications.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/scanner">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start Scanning
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="outline" size="lg">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to identify and understand XSS vulnerabilities in your web applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover className="group">
                  <div className="p-3 bg-indigo-600/20 rounded-xl w-fit mb-4 group-hover:bg-indigo-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get started in minutes with our simple four-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full">
                  <span className="text-5xl font-bold text-indigo-600/30 absolute top-4 right-4">
                    {step.number}
                  </span>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Target className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">100+</div>
              <div className="text-gray-400 text-sm">Payload Vectors</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">Fast</div>
              <div className="text-gray-400 text-sm">Concurrent Scanning</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">Accurate</div>
              <div className="text-gray-400 text-sm">Detection Engine</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">CSV</div>
              <div className="text-gray-400 text-sm">Export Reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
            <div className="text-center py-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Secure Your Application?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Start scanning for XSS vulnerabilities now and protect your users from 
                cross-site scripting attacks.
              </p>
              <Link to="/scanner">
                <Button size="lg" rightIcon={<Search className="w-5 h-5" />}>
                  Launch Scanner
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
