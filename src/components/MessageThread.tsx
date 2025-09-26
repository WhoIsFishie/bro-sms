import { useEffect, useRef } from 'react';
import type { Contact, Message } from '../types';
import { formatMessageTime, getContactDisplayName } from '../utils/messageUtils';
import { getContactColor, getContactTextColor } from '../utils/contactColors';

interface MessageThreadProps {
  contact: Contact | null;
  messages: Message[];
  scrollToMessageId?: number | null;
  onBack?: () => void;
}

export default function MessageThread({ contact, messages, scrollToMessageId, onBack }: MessageThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());


  // Scroll to a specific message when requested
  useEffect(() => {
    if (!scrollToMessageId) return;
    const target = messageRefs.current.get(scrollToMessageId);
    if (target && listRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToMessageId, messages]);

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.468L3 21l1.468-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-sm text-gray-500">Choose a contact from the sidebar to view their messages</p>
        </div>
      </div>
    );
  }

  const displayName = getContactDisplayName(contact);
  const contactId = contact.normalizedPhone || contact.phone;
  const avatarColor = getContactColor(contactId);
  const textColor = getContactTextColor();

  return (
    <div className="flex-1 flex flex-col w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between h-17 px-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          {/* Back button (mobile) */}
          {onBack && (
            <button onClick={onBack} className="md:hidden mr-3 p-2 hover:bg-gray-200 rounded-full transition-colors">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Contact info */}
          <div className="flex items-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center shadow-inner`}>
              {contact.name && contact.name !== 'Unknown' ? (
                <span className={`text-sm font-medium ${textColor}`}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg className={`w-5 h-5 ${textColor}`} fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{displayName}</h3>
              <p className="text-sm text-gray-500">{contact.phone}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{messages.length} messages</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              registerRef={(el) => {
                if (el) messageRefs.current.set(message.id, el);
                else messageRefs.current.delete(message.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, registerRef }: { message: Message; registerRef?: (el: HTMLDivElement | null) => void }) {
  const isFromMe = message.isFromMe;

  return (
    <div ref={registerRef || undefined} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-2xl shadow-sm ${
          isFromMe
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
        }`}
      >
        {/* Message text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

        {/* Timestamp */}
        <div className={`flex items-center justify-end mt-2 gap-2`}>
          <span
            className={`text-xs ${
              isFromMe ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatMessageTime(message.timestamp)}
          </span>

          {/* Message status indicators */}
          <MessageStatusIndicator message={message} />
        </div>
      </div>
    </div>
  );
}

function MessageStatusIndicator({ message }: { message: Message }) {
  if (!message.isFromMe) {
    // For received messages, show read/unread text
    const isRead = message.status === 'read' || message.isRead;
    return (
      <span className={`text-xs ${isRead ? 'text-gray-400' : 'text-blue-500'}`}>
        {isRead ? 'Read' : 'Unread'}
      </span>
    );
  }

  const getStatusInfo = (message: Message) => {
    if (!message.isFromMe) {
      // For received messages, show read/unread indicators
      if (message.status === 'read' || message.isRead) {
        return { icon: 'dot', color: 'text-gray-400', title: 'Read' };
      } else {
        return { icon: 'dot', color: 'text-blue-500', title: 'Unread' };
      }
    }

    // For sent messages, show delivery status
    if (message.status) {
      switch (message.status) {
        case 'sent':
          return { icon: 'single-check', color: 'text-blue-300', title: 'Sent' };
        case 'delivered':
          return { icon: 'double-check', color: 'text-blue-300', title: 'Delivered' };
        case 'read':
          return { icon: 'double-check', color: 'text-blue-200', title: 'Read' };
        case 'failed':
          return { icon: 'exclamation', color: 'text-red-400', title: 'Failed' };
        default:
          return { icon: 'single-check', color: 'text-blue-300', title: 'Sent' };
      }
    }

    // Fallback to isRead property for backward compatibility
    if (message.isRead) {
      return { icon: 'double-check', color: 'text-blue-200', title: 'Read' };
    }

    return { icon: 'single-check', color: 'text-blue-300', title: 'Sent' };
  };

  const statusInfo = getStatusInfo(message);

  if (!statusInfo) {
    return null;
  }

  if (statusInfo.icon === 'dot') {
    const bgColor = statusInfo.color === 'text-gray-400' ? 'bg-gray-400' : 'bg-blue-500';
    return (
      <div
        className={`w-3 h-3 rounded-full ${bgColor} flex-shrink-0`}
        title={statusInfo.title}
      />
    );
  }

  if (statusInfo.icon === 'single-check') {
    return (
      <svg
        className={`h-3 w-3 ${statusInfo.color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>{statusInfo.title}</title>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (statusInfo.icon === 'double-check') {
    return (
      <div className="flex items-center" title={statusInfo.title}>
        <svg
          className={`h-3 w-3 ${statusInfo.color} -mr-1`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <svg
          className={`h-3 w-3 ${statusInfo.color}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  if (statusInfo.icon === 'exclamation') {
    return (
      <svg
        className={`h-3 w-3 ${statusInfo.color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>{statusInfo.title}</title>
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return null;
}