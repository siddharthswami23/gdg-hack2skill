import { Github, Twitter, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-2">XSSpect</h3>
            <p className="text-gray-400 text-sm max-w-md">
              Advanced XSS vulnerability scanner powered by intelligent detection algorithms. 
              Secure your web applications with comprehensive cross-site scripting testing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/scanner" className="text-gray-400 hover:text-indigo-400 text-sm transition-colors">
                  Start Scanning
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-gray-400 hover:text-indigo-400 text-sm transition-colors">
                  Scan History
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-gray-400 hover:text-indigo-400 text-sm transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://owasp.org/www-community/attacks/xss/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  OWASP XSS Guide
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  API Documentation
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500" /> for security researchers
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-500 hover:text-indigo-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-indigo-400 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-indigo-400 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
