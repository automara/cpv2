import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { modulesApi } from '../services/api';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export default function ModuleCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'write' | 'upload'>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        setFile(file);
        // Read file content to display
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
          // Extract title from first heading or filename
          const firstLine = text.split('\n')[0];
          if (firstLine.startsWith('# ')) {
            setTitle(firstLine.substring(2).trim());
          } else {
            setTitle(file.name.replace(/\.md$|\.markdown$/, ''));
          }
        };
        reader.readAsText(file);
      } else {
        alert('Please drop a markdown (.md) file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        const firstLine = text.split('\n')[0];
        if (firstLine.startsWith('# ')) {
          setTitle(firstLine.substring(2).trim());
        } else {
          setTitle(file.name.replace(/\.md$|\.markdown$/, ''));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both title and content');
      return;
    }

    try {
      setCreating(true);
      const module = await modulesApi.create({ title, content });
      navigate(`/modules/${module.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create module');
      setCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setCreating(true);
      const module = await modulesApi.upload(file);
      navigate(`/modules/${module.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload module');
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Module</h1>
        <p className="mt-2 text-gray-600">Create a new module from markdown content</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMode('write')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'write'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Write Markdown
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload File
            </button>
          </nav>
        </div>
      </div>

      {mode === 'write' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter module title"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content (Markdown)
              </label>
              <CodeMirror
                value={content}
                height="500px"
                extensions={[markdown()]}
                onChange={(value) => setContent(value)}
                className="border border-gray-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate('/modules')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating & Processing...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center ${
                dragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!file && (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a markdown file here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    browse to upload
                  </button>
                  <p className="mt-1 text-xs text-gray-500">Markdown files (.md) only</p>
                </>
              )}

              {file && (
                <div className="text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setContent('');
                        setTitle('');
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  {content && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview Content
                        </label>
                        <div className="border border-gray-300 rounded p-4 bg-gray-50 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{content.substring(0, 1000)}{content.length > 1000 && '...'}</pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate('/modules')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || creating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Uploading & Processing...' : 'Upload Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">Processing module with AI pipeline...</p>
          <p className="text-sm mt-1">This may take 10-30 seconds. Please wait.</p>
        </div>
      )}
    </div>
  );
}
