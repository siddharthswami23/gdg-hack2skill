import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Search,
  Globe,
  FileText,
  Play,
  Save,
  Info,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { scannerApi } from '../services/api';
import { scanHistory, scanConfigs } from '../services/storage';

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
];

const ScannerPage = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      url: '',
      method: 'GET',
      parameters: '',
      postData: '',
    },
  });

  const watchMethod = watch('method');

  useEffect(() => {
    setSavedConfigs(scanConfigs.getAll());
  }, []);

  const onSubmit = async (data) => {
    setIsScanning(true);
    
    // Prepare scan configuration for backend
    const scanConfig = {
      url: data.url,
      method: data.method,
      parameters: data.parameters || extractParameters(data.url),
    };

    try {
      // Start real scan via backend
      const response = await scannerApi.startScan(scanConfig);
      
      // Save to local history
      scanHistory.add({
        id: response.scanId,
        config: scanConfig,
        status: 'running',
        startTime: new Date().toISOString(),
      });

      toast.success('Scan started successfully!');
      
      // Navigate to results page
      navigate(`/results/${response.scanId}`);
      
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error(error.response?.data?.message || 'Failed to start scan');
      setIsScanning(false);
    }
  };

  const extractParameters = (url) => {
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.keys());
      return params.join(',');
    } catch {
      return '';
    }
  };

  const handleSaveConfig = () => {
    const configName = prompt('Enter a name for this configuration:');
    if (configName) {
      const formData = watch();
      scanConfigs.save(configName, formData);
      setSavedConfigs(scanConfigs.getAll());
      toast.success('Configuration saved!');
    }
  };

  const handleLoadConfig = (config) => {
    reset(config.config);
    toast.success(`Loaded: ${config.name}`);
  };

  const handleDeleteConfig = (configId) => {
    scanConfigs.delete(configId);
    setSavedConfigs(scanConfigs.getAll());
    toast.success('Configuration deleted');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-indigo-400" />
          XSS Scanner
        </h1>
        <p className="text-gray-400">
          Configure and run XSS vulnerability scans on your target URL.
        </p>
      </div>

      {/* Saved Configurations */}
      {savedConfigs.length > 0 && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-400" />
              Saved Configurations
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {savedConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
                >
                  <button
                    onClick={() => handleLoadConfig(config)}
                    className="text-sm text-gray-300 hover:text-white"
                  >
                    {config.name}
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(config.id)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Scanner Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Target Configuration
            </Card.Title>
            <Card.Description>
              Enter the target URL and basic scan parameters
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            {/* URL Input */}
            <Input
              label="Target URL"
              placeholder="https://example.com/page?param=value"
              leftIcon={<Globe className="w-4 h-4" />}
              error={errors.url?.message}
              {...register('url', {
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'Please enter a valid URL starting with http:// or https://',
                },
              })}
            />

            {/* Request Method */}
            <Select
              label="Request Method"
              options={methodOptions}
              {...register('method')}
            />

            {/* Parameters */}
            <Input
              label="Parameters"
              placeholder="param1,param2,param3"
              helperText="Comma-separated list of URL parameters to test (leave empty to auto-detect)"
              {...register('parameters')}
            />

            {/* POST Data (conditional) */}
            {watchMethod === 'POST' && (
              <Textarea
                label="POST Data"
                placeholder="param1=value1&param2=value2"
                helperText="Form data to send with POST request"
                rows={3}
                {...register('postData')}
              />
            )}
          </Card.Content>
        </Card>

        {/* Info Box */}
        {/* <Card className="mb-6 bg-blue-900/20 border-blue-500/30">
          <Card.Content className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                <li>Only scan applications you have permission to test</li>
                <li>Large scans may take several minutes to complete</li>
                <li>Results will be stored locally in your browser</li>
              </ul>
            </div>
          </Card.Content>
        </Card> */}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            size="lg"
            isLoading={isScanning}
            leftIcon={<Play className="w-5 h-5" />}
            className="flex-1"
          >
            {isScanning ? 'Starting Scan...' : 'Start Scan'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleSaveConfig}
            leftIcon={<Save className="w-5 h-5" />}
          >
            Save Config
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ScannerPage;
