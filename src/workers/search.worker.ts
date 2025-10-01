type SearchIndexItem = {
  contactId: string;
  text: string;
};

type InitMessage = {
  type: 'init';
  searchIndex: SearchIndexItem[];
};

type SearchMessage = {
  type: 'search';
  id: number;
  query: string;
};

type IncomingMessage = InitMessage | SearchMessage;

let index: SearchIndexItem[] = [];

self.onmessage = (e: MessageEvent<IncomingMessage>) => {
  const { type } = e.data as IncomingMessage;

  if (type === 'init') {
    const { searchIndex } = e.data as InitMessage;
    // Normalize and store lowercased text once
    index = searchIndex.map(({ contactId, text }) => ({
      contactId,
      text: (text || '').toLowerCase()
    }));
    return;
  }

  if (type === 'search') {
    const { id, query } = e.data as SearchMessage;
    const lowerQuery = (query || '').toLowerCase().trim();

    if (!lowerQuery) {
      self.postMessage({ type: 'result', id, results: [] });
      return;
    }

    const results: string[] = [];

    for (const { contactId, text } of index) {
      if (text.includes(lowerQuery)) {
        results.push(contactId);
      }
    }

    self.postMessage({ type: 'result', id, results });
  }
};

export {};