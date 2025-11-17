import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modulesApi, webflowApi, type Module } from '../services/api';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Module>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (id) {
      loadModule();
    }
  }, [id]);

  const loadModule = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await modulesApi.get(id);
      setModule(data);
      setEditData(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !module) return;

    try {
      setSaving(true);
      const updated = await modulesApi.update(id, editData);
      setModule(updated);
      setEditData(updated);
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!id) return;

    try {
      setSyncing(true);
      await webflowApi.sync(id);
      alert('Module synced to Webflow successfully!');
      await loadModule();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sync to Webflow');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownload = async () => {
    if (!id || !module) return;

    try {
      const blob = await modulesApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module.slug}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to download module');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading module...</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Module not found'}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link to="/modules" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Modules
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
          <p className="mt-1 text-sm text-gray-500">ID: {module.id} • Slug: {module.slug}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Download
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync to Webflow'}
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditData(module);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            {editing ? (
              <CodeMirror
                value={editData.content || ''}
                height="400px"
                extensions={[markdown()]}
                onChange={(value) => setEditData({ ...editData, content: value })}
                className="border border-gray-300 rounded"
              />
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200 text-sm">
                  {module.content}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summaries</h2>
            <div className="space-y-4">
              {module.summary_short && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Summary</label>
                  <p className="text-sm text-gray-600">{module.summary_short}</p>
                </div>
              )}
              {module.summary_medium && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medium Summary</label>
                  <p className="text-sm text-gray-600">{module.summary_medium}</p>
                </div>
              )}
              {module.summary_long && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long Summary</label>
                  <p className="text-sm text-gray-600">{module.summary_long}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {editing ? (
                  <select
                    value={editData.status || 'draft'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    module.status === 'published' ? 'bg-green-100 text-green-800' :
                    module.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {module.status}
                  </span>
                )}
              </div>

              {module.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-sm text-gray-600">{module.category}</p>
                </div>
              )}

              {module.tags && module.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {module.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {module.quality_score !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          module.quality_score >= 80 ? 'bg-green-500' :
                          module.quality_score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${module.quality_score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{Math.round(module.quality_score)}</span>
                  </div>
                </div>
              )}

              {module.webflow_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webflow</label>
                  <p className="text-xs text-green-600">Synced</p>
                  <p className="text-xs text-gray-500">ID: {module.webflow_id}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
            <div className="space-y-3">
              {module.seo_title && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-sm text-gray-600">{module.seo_title}</p>
                </div>
              )}
              {module.seo_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-600">{module.seo_description}</p>
                </div>
              )}
              {module.seo_keywords && module.seo_keywords.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <p className="text-sm text-gray-600">{module.seo_keywords.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {module.image_prompt && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Image Prompt</h2>
              <p className="text-sm text-gray-600">{module.image_prompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
