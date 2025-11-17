import { useEffect, useState } from 'react';
import { modulesApi, webflowApi, type Module } from '../services/api';

export default function WebflowSync() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadModules();
  }, [category, status]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await modulesApi.list({
        category: category || undefined,
        status: status || undefined,
      });
      setModules(data.modules);

      const uniqueCategories = Array.from(
        new Set(data.modules.map((m) => m.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      await webflowApi.sync(id);
      alert('Module synced successfully!');
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sync module');
    } finally {
      setSyncing(null);
    }
  };

  const handleBatchSync = async () => {
    if (!confirm(`Sync ${modules.filter(m => !m.webflow_id).length} modules to Webflow?`)) {
      return;
    }

    try {
      setBatchSyncing(true);
      const filters: any = {};
      if (category) filters.category = category;
      if (status) filters.status = status;

      await webflowApi.syncBatch(filters);
      alert('Batch sync completed!');
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to batch sync');
    } finally {
      setBatchSyncing(false);
    }
  };

  const getSyncStatus = (module: Module) => {
    if (module.webflow_id) {
      return {
        status: 'synced',
        label: 'Synced',
        color: 'bg-green-100 text-green-800',
      };
    }
    return {
      status: 'not-synced',
      label: 'Not Synced',
      color: 'bg-gray-100 text-gray-800',
    };
  };

  const unsyncedCount = modules.filter(m => !m.webflow_id).length;
  const syncedCount = modules.filter(m => m.webflow_id).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Webflow Sync</h1>
        <p className="mt-2 text-gray-600">Manage synchronization with Webflow CMS</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Modules</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{modules.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Synced</p>
                <p className="mt-1 text-3xl font-semibold text-green-600">{syncedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Not Synced</p>
                <p className="mt-1 text-3xl font-semibold text-yellow-600">{unsyncedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setCategory('');
                setStatus('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBatchSync}
              disabled={batchSyncing || unsyncedCount === 0}
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {batchSyncing ? 'Syncing...' : `Sync All (${unsyncedCount})`}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading modules...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && modules.length === 0 && (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <p className="text-gray-500">No modules found</p>
        </div>
      )}

      {!loading && !error && modules.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {modules.map((module) => {
              const syncStatus = getSyncStatus(module);
              return (
                <li key={module.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 truncate">
                          {module.title}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                          {module.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {module.category}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            module.status === 'published' ? 'bg-green-100 text-green-800' :
                            module.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {module.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${syncStatus.color}`}>
                            {syncStatus.label}
                          </span>
                          {module.webflow_id && (
                            <span className="text-xs text-gray-500">
                              ID: {module.webflow_id.substring(0, 8)}...
                            </span>
                          )}
                          {module.webflow_published_at && (
                            <span className="text-xs text-gray-500">
                              Synced: {new Date(module.webflow_published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleSync(module.id)}
                          disabled={syncing === module.id}
                          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                            module.webflow_id
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {syncing === module.id ? 'Syncing...' : module.webflow_id ? 'Re-sync' : 'Sync'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {batchSyncing && (
        <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">Batch sync in progress...</p>
          <p className="text-sm mt-1">Syncing modules to Webflow with rate limiting. This may take a few minutes.</p>
        </div>
      )}
    </div>
  );
}
