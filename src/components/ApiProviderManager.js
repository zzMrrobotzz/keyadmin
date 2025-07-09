import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ApiKeyManagerModal from './ApiKeyManagerModal'; // Import the modal

const ApiProviderManager = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/providers');
      setProviders(response.data);
    } catch (err) {
      setError('Failed to fetch API providers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleApiKeysUpdate = (providerId, updatedKeys) => {
    setProviders(prevProviders =>
      prevProviders.map(p =>
        p._id === providerId ? { ...p, apiKeys: updatedKeys } : p
      )
    );
    // Also update the selected provider if it's open in the modal
    setSelectedProvider(prev => (prev && prev._id === providerId ? { ...prev, apiKeys: updatedKeys } : prev));
  };

  if (loading) return <div className="text-center p-8">Loading providers...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">API Provider Management</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">API Keys Count</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider._id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{provider.name}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{provider.apiKeys?.length || 0}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight ${
                      provider.status === 'Operational' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                    <span aria-hidden className={`absolute inset-0 ${
                        provider.status === 'Operational' ? 'bg-green-200' : 'bg-red-200'
                      } opacity-50 rounded-full`}></span>
                    <span className="relative">{provider.status}</span>
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <button
                    onClick={() => setSelectedProvider(provider)}
                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    Manage Keys
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProvider && (
        <ApiKeyManagerModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onApiKeysUpdate={(updatedKeys) => {
            handleApiKeysUpdate(selectedProvider._id, updatedKeys);
          }}
        />
      )}
    </div>
  );
};

export default ApiProviderManager;
