import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchIndexItem {
  contactId: string;
  text: string;
}

export function useSearchWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const resolversRef = useRef<Map<number, (results: string[]) => void>>(new Map());
  const nextIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/search.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const handleMessage = (e: MessageEvent) => {
      if (!e || !e.data) return;
      if (e.data.type === 'result') {
        const { id, results } = e.data as { id: number; results: string[] };
        const resolver = resolversRef.current.get(id);
        if (resolver) {
          resolver(Array.isArray(results) ? results : []);
          resolversRef.current.delete(id);
        }
        // If no more pending requests, clear searching flag
        if (resolversRef.current.size === 0) {
          setIsSearching(false);
        }
      }
    };

    const handleError = () => {
      // Fail-safe: reject all pending resolvers on error
      resolversRef.current.forEach((resolve) => resolve([]));
      resolversRef.current.clear();
      setIsSearching(false);
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.addEventListener('error', handleError as unknown as EventListener);

    return () => {
      workerRef.current?.removeEventListener('message', handleMessage);
      workerRef.current?.removeEventListener('error', handleError as unknown as EventListener);
      workerRef.current?.terminate();
    };
  }, []);

  const initIndex = useCallback((searchIndex: SearchIndexItem[]) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'init', searchIndex });
  }, []);

  const search = useCallback((query: string): Promise<string[]> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve([]);
        return;
      }

      setIsSearching(true);
      const id = ++nextIdRef.current;
      resolversRef.current.set(id, resolve);

      // Timeout safety to avoid stuck state
      const timeoutId = window.setTimeout(() => {
        if (resolversRef.current.has(id)) {
          resolversRef.current.delete(id);
          resolve([]);
          if (resolversRef.current.size === 0) {
            setIsSearching(false);
          }
        }
      }, 5000);

      const wrappedResolve = (results: string[]) => {
        window.clearTimeout(timeoutId);
        resolve(results);
      };
      resolversRef.current.set(id, wrappedResolve);

      workerRef.current.postMessage({ type: 'search', id, query });
    });
  }, []);

  return { initIndex, search, isSearching };
}