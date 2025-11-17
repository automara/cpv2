import { useState } from 'react';
import { aiApi, type AIProcessResult } from '../services/api';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export default function AITesting() {
  const [content, setContent] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<AIProcessResult | null>(null);
  const [error, setError] = useState('');

  const sampleContent = `# Understanding React Hooks

React Hooks are functions that let you use state and other React features in functional components.

## useState Hook

The useState hook allows you to add state to functional components:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

## useEffect Hook

The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

Hooks have revolutionized how we write React components, making code more reusable and easier to understand.`;

  const handleTest = async () => {
    if (!content.trim()) {
      alert('Please provide some content to test');
      return;
    }

    try {
      setTesting(true);
      setError('');
      const data = await aiApi.test(content);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process content');
      setResult(null);
    } finally {
      setTesting(false);
    }
  };

  const handleLoadSample = () => {
    setContent(sampleContent);
    setResult(null);
    setError('');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Pipeline Testing</h1>
        <p className="mt-2 text-gray-600">Test the AI pipeline with sample content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Input Content</h2>
              <button
                onClick={handleLoadSample}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Load Sample
              </button>
            </div>
            <CodeMirror
              value={content}
              height="400px"
              extensions={[markdown()]}
              onChange={(value) => setContent(value)}
              className="border border-gray-300 rounded"
            />
            <div className="mt-4">
              <button
                onClick={handleTest}
                disabled={testing}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? 'Processing with AI...' : 'Test AI Pipeline'}
              </button>
            </div>
          </div>

          {testing && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p className="font-medium">Processing content...</p>
              <p className="text-sm mt-1">Running 8 AI agents in parallel. This may take 10-30 seconds.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Score</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        result.quality_score >= 80 ? 'bg-green-500' :
                        result.quality_score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${result.quality_score}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{Math.round(result.quality_score)}</span>
                </div>
                {result.cost_estimate !== undefined && (
                  <p className="mt-3 text-sm text-gray-600">
                    Estimated cost: ${result.cost_estimate.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summaries</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">SHORT</label>
                    <p className="text-sm text-gray-700">{result.summary_short}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">MEDIUM</label>
                    <p className="text-sm text-gray-700">{result.summary_medium}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">LONG</label>
                    <p className="text-sm text-gray-700">{result.summary_long}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CATEGORY</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {result.category}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">TAGS</label>
                    <div className="flex flex-wrap gap-1">
                      {result.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">TITLE</label>
                    <p className="text-sm text-gray-700">{result.seo_title}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">DESCRIPTION</label>
                    <p className="text-sm text-gray-700">{result.seo_description}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">KEYWORDS</label>
                    <p className="text-sm text-gray-700">{result.seo_keywords.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Image Prompt</h2>
                <p className="text-sm text-gray-700">{result.image_prompt}</p>
              </div>

              {result.schema_org && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Schema.org Data</h2>
                  <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(result.schema_org, null, 2)}
                  </pre>
                </div>
              )}

              {result.validation_report && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Report</h2>
                  <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(result.validation_report, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}

          {!result && !testing && !error && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="mt-4 text-gray-500">Enter content and click "Test AI Pipeline" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
