import { useState, useEffect } from 'react';
import type { SMSRecord } from './types';
import MessagingApp from './components/MessagingApp';

function App() {
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonUrl, setJsonUrl] = useState<string>('');
  const [mobileChatActive, setMobileChatActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url') || params.get('json');

    if (urlParam) {
      setJsonUrl(urlParam);
      loadJsonFromUrl(urlParam);
    }
  }, []);

  const loadJsonFromUrl = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setJsonData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load JSON';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonUrl.trim()) {
      loadJsonFromUrl(jsonUrl.trim());
      // Update URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('url', jsonUrl.trim());
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonData(parsed);
      // Clear any URL param since we're loading a file
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('url');
      newUrl.searchParams.delete('json');
      window.history.replaceState({}, '', newUrl.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse JSON file';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Check if we have SMS data that can be displayed as messages
  const hasSmsData = jsonData && Array.isArray(jsonData) &&
    jsonData.length > 0 &&
    jsonData[0] &&
    typeof jsonData[0] === 'object' &&
    'party' in (jsonData[0] as Record<string, unknown>) &&
    'message' in (jsonData[0] as Record<string, unknown>);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header with URL input and file upload */}
      <header className={`w-full bg-white border-b border-gray-200 ${mobileChatActive ? 'hidden md:block sticky top-0 z-20' : 'md:sticky md:top-0 md:z-20'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <h1 className="text-lg font-semibold text-gray-900">SMS Visualizer</h1>
          <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
            <input
              type="url"
              value={jsonUrl}
              onChange={(e) => setJsonUrl(e.target.value)}
              placeholder="Enter JSON URL (e.g., https://archive.org/download/bro-sms/bro-sms.json)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={loading || !jsonUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs text-center"
            >
              Load URL
            </button>
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 cursor-pointer text-xs text-center">
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              Upload JSON
            </label>
          </form>
        </div>
      </header>

      {/* Content area */}
      <main className={`${mobileChatActive ? 'h-[100dvh]' : 'h-[calc(100dvh-70px)]'} md:h-[calc(100vh-70px)]`}>
        {error && (
          <div className="max-w-6xl mx-auto px-4 pt-3">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          </div>
        )}

        {loading && (
          <div className="h-full flex items-center justify-center text-gray-500">Loading…</div>
        )}

        {!loading && hasSmsData && (
          <div className="md:h-full">
            <MessagingApp smsData={jsonData as SMSRecord[]} onMobileChatActiveChange={setMobileChatActive} />
          </div>
        )}

        {!loading && !hasSmsData && (
          <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-600">
            <p className="mb-2">Load an SMS JSON via URL or upload a file to begin.</p>
            <p className="text-sm">Tip: Append <code className="bg-gray-100 px-1 rounded">?url=…</code> to auto-load.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;