import { useState, useMemo, useEffect } from 'react';
import type { Contact, Message } from '../types';
import { formatMessageTime, getContactDisplayName } from '../utils/messageUtils';
import { getContactColor, getContactTextColor } from '../utils/contactColors';
import { useSearchWorker } from '../hooks/useSearchWorker';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onContactSelect: (contactId: string, targetMessageId?: number) => void;
  searchIndex?: Map<string, string>;
  messagesByContact?: Map<string, Message[]>;
}

export default function ContactList({ contacts, selectedContactId, onContactSelect, searchIndex, messagesByContact }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContactIds, setFilteredContactIds] = useState<string[] | null>(null);
  const [matchMetaByContact, setMatchMetaByContact] = useState<Map<string, { snippet: string; messageId: number }>>(new Map());
  const { initIndex, search, isSearching } = useSearchWorker();

  const workerSearchIndex = useMemo(() => {
    if (!searchIndex) return [];
    return Array.from(searchIndex.entries()).map(([contactId, text]) => ({
      contactId,
      text
    }));
  }, [searchIndex]);

  // Initialize/update worker index when it changes
  useEffect(() => {
    if (workerSearchIndex.length > 0) {
      initIndex(workerSearchIndex);
    }
  }, [workerSearchIndex, initIndex]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContactIds(null);
      setMatchMetaByContact(new Map());
      return;
    }

    const performSearch = async () => {
      const results = await search(searchQuery);
      setFilteredContactIds(results);
    };

    const timeoutId = setTimeout(performSearch, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, search]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !messagesByContact || !filteredContactIds || filteredContactIds.length === 0) {
      setMatchMetaByContact(new Map());
      return;
    }

    let cancelled = false;
    const result = new Map<string, { snippet: string; messageId: number }>();

    const processChunk = async (startIdx: number) => {
      if (cancelled) return;

      const endIdx = Math.min(startIdx + 20, filteredContactIds.length);

      for (let i = startIdx; i < endIdx; i++) {
        const contactId = filteredContactIds[i];
        const messages = messagesByContact.get(contactId);
        if (!messages || messages.length === 0) continue;

        let found = false;
        for (const m of messages) {
          if (!m || !m.text) continue;
          const text = String(m.text);
          const lowerText = text.toLowerCase();
          const idx = lowerText.indexOf(query);

          if (idx >= 0) {
            const start = Math.max(0, idx - 20);
            const end = Math.min(text.length, idx + query.length + 20);
            const prefix = start > 0 ? '…' : '';
            const suffix = end < text.length ? '…' : '';
            const snippet = prefix + text.slice(start, end) + suffix;
            result.set(contactId, { snippet, messageId: m.id });
            found = true;
            break;
          }
        }

        if (!found && messages.length > 0) {
          const firstMsg = messages[messages.length - 1]; // Most recent message
          if (firstMsg && firstMsg.text) {
            const text = String(firstMsg.text);
            const snippet = text.length > 60 ? text.slice(0, 60) + '…' : text;
            result.set(contactId, { snippet, messageId: firstMsg.id });
          }
        }
      }

      setMatchMetaByContact(new Map(result));

      if (endIdx < filteredContactIds.length) {
        setTimeout(() => processChunk(endIdx), 0);
      }
    };

    processChunk(0);

    return () => {
      cancelled = true;
    };
  }, [filteredContactIds, searchQuery, messagesByContact]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim() || filteredContactIds === null) return contacts;

    const resultSet = new Set(filteredContactIds);
    return contacts.filter(contact => {
      const contactId = contact.normalizedPhone || contact.phone;
      return resultSet.has(contactId);
    });
  }, [contacts, searchQuery, filteredContactIds]);

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;

    // Escape regex special characters to prevent crashes
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    try {
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-400/30 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };


  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="h-17 px-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center sticky top-0 z-10">
        <div className="relative w-full">
          {isSearching ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-transparent text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden contact-list-scroll">
        {filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.468L3 21l1.468-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <p className="text-sm">{searchQuery ? 'No matching conversations' : 'No conversations'}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const contactId = contact.normalizedPhone || contact.phone;
            const isSelected = contactId === selectedContactId;
            const displayName = getContactDisplayName(contact);
            const avatarColor = getContactColor(contactId);
            const textColor = getContactTextColor();

            return (
              <div
                key={contactId}
                onClick={() => {
                  const targetId = matchMetaByContact.get(contactId)?.messageId;
                  onContactSelect(contactId, targetId);
                }}
                className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center shadow-inner`}>
                  {contact.name && contact.name !== 'Unknown' ? (
                    <span className={`text-sm font-medium ${textColor}`}>
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className={`w-6 h-6 ${textColor}`} fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium truncate tracking-tight ${
                      isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {highlightSearchTerm(displayName, searchQuery)}
                    </p>
                    <p className={`text-[11px] md:text-xs ${
                      isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(contact.lastMessageTime)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm truncate ${
                      isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {highlightSearchTerm(contact.lastMessage, searchQuery)}
                    </p>

                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {contact.messageCount > 1 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          {contact.messageCount}
                        </span>
                      )}

                      {!contact.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {searchQuery && matchMetaByContact.has(contactId) && (
                    <div className="mt-1.5 flex items-start gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded">
                      <svg className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const meta = matchMetaByContact.get(contactId);
                          if (meta) onContactSelect(contactId, meta.messageId);
                        }}
                        className="flex-1 text-left text-xs text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        title="Click to jump to this message"
                      >
                        <span className="line-clamp-2">
                          {highlightSearchTerm(matchMetaByContact.get(contactId)!.snippet, searchQuery)}
                        </span>
                      </button>
                    </div>
                  )}

                  {contact.name && contact.name !== 'Unknown' && (
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {highlightSearchTerm(contact.phone, searchQuery)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}