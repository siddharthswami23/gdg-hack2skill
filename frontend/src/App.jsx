import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import DocsPage from './pages/DocsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f9fafb',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f9fafb',
              },
            },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:scanId" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
