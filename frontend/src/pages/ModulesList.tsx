import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modulesApi, type Module } from '../services/api';

export default function ModulesList() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadModules();
  }, [search, category, status]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await modulesApi.list({
        search: search || undefined,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await modulesApi.delete(id);
      await loadModules();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
        <p className="mt-2 text-gray-600">Manage your module library</p>
      </div>

      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
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
                setSearch('');
                setCategory('');
                setStatus('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Clear Filters
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
          <Link
            to="/create"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Module
          </Link>
        </div>
      )}

      {!loading && !error && modules.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {modules.map((module) => (
              <li key={module.id} className="hover:bg-gray-50">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/modules/${module.id}`}
                        className="block focus:outline-none"
                      >
                        <p className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate">
                          {module.title}
                        </p>
                        {module.summary_short && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {module.summary_short}
                          </p>
                        )}
                      </Link>
                      <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                        {module.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {module.category}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(module.status)}`}>
                          {module.status}
                        </span>
                        {module.quality_score !== undefined && (
                          <span className="text-xs">
                            Quality: {Math.round(module.quality_score)}
                          </span>
                        )}
                        {module.webflow_id && (
                          <span className="text-xs text-green-600">Synced to Webflow</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Link
                        to={`/modules/${module.id}`}
                        className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(module.id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
