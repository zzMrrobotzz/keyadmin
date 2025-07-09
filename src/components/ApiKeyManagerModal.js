import React, { useState } from 'react';
import axios from 'axios';

const ApiKeyManagerModal = ({ provider, onClose, onApiKeysUpdate }) => {
  const [newApiKey, setNewApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      setError('API key cannot be empty.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`/api/providers/${provider._id}/keys`, { apiKey: newApiKey });
      onApiKeysUpdate(response.data.apiKeys);
      setNewApiKey('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add key.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (apiKeyToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the key ending in ...${apiKeyToDelete.slice(-4)}?`)) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Note: axios.delete with a body is standard, but some servers/proxies don't like it.
      // Using a data object is the correct way for axios.
      const response = await axios.delete(`/api/providers/${provider._id}/keys`, {
        data: { apiKey: apiKeyToDelete }
      });
      onApiKeysUpdate(response.data.apiKeys);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Keys for {provider.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleAddKey} className="mb-6">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">New API Key</label>
          <div className="flex items-center space-x-2">
            <input
              id="apiKey"
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="flex-grow shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter new API key"
              disabled={loading}
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Existing Keys</h3>
          {provider.apiKeys && provider.apiKeys.length > 0 ? (
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {provider.apiKeys.map((key, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-600">
                    ...{key.slice(-12)}
                  </span>
                  <button
                    onClick={() => handleDeleteKey(key)}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm disabled:opacity-50"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No API keys added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagerModal;
