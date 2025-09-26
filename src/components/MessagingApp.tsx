import { useState, useMemo } from 'react';
import type { SMSRecord, Message } from '../types';
import { processMessagesData } from '../utils/messageUtils';
import ContactList from './ContactList';
import MessageThread from './MessageThread';

interface MessagingAppProps {
  smsData: SMSRecord[];
  onMobileChatActiveChange?: (active: boolean) => void;
}

export default function MessagingApp({ smsData, onMobileChatActiveChange }: MessagingAppProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showMobileContactList, setShowMobileContactList] = useState(true);
  const [scrollToMessageId, setScrollToMessageId] = useState<number | null>(null);

  // Process SMS data into contacts and messages
  const { contacts, messagesByContact } = useMemo(() => {
    return processMessagesData(smsData);
  }, [smsData]);

  // Build a precomputed, per-contact search index so queries are instant
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    if (!contacts.length) return index;

    contacts.forEach(contact => {
      const contactId = contact.normalizedPhone || contact.phone;
      const messages = messagesByContact.get(contactId) || [];
      const aggregated = [
        contact.name || '',
        contact.phone || '',
        contact.normalizedPhone || '',
        contact.lastMessage || '',
        ...messages.map(m => m.text || '')
      ].join('\n');
      index.set(contactId, aggregated.toLowerCase());
    });

    return index;
  }, [contacts, messagesByContact]);

  // Get selected contact and their messages
  const selectedContact = selectedContactId
    ? contacts.find(c => (c.normalizedPhone || c.phone) === selectedContactId) || null
    : null;

  const selectedMessages: Message[] = selectedContactId
    ? messagesByContact.get(selectedContactId) || []
    : [];

  const handleContactSelect = (contactId: string, targetMessageId?: number) => {
    setSelectedContactId(contactId);
    setScrollToMessageId(targetMessageId ?? null);
    setShowMobileContactList(false); // Hide contact list on mobile when contact is selected
    if (onMobileChatActiveChange) onMobileChatActiveChange(true);
  };

  const handleBackToContacts = () => {
    setShowMobileContactList(true);
    setSelectedContactId(null);
    if (onMobileChatActiveChange) onMobileChatActiveChange(false);
  };

  if (contacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.468L3 21l1.468-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
          <p className="text-sm text-gray-500">Load SMS data to see conversations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white relative">
      {/* Contact List Sidebar - Always visible on desktop, toggleable on mobile */}
      <div className={`
        ${showMobileContactList ? 'flex' : 'hidden md:flex'}
        w-full md:w-80 lg:w-96 flex-shrink-0 bg-white z-10
      `}>
        <ContactList
          contacts={contacts}
          selectedContactId={selectedContactId}
          onContactSelect={handleContactSelect}
          messagesByContact={messagesByContact}
          searchIndex={searchIndex}
        />
      </div>

      {/* Message Thread - Hidden on mobile when contact list is showing */}
      <div className={`
        ${showMobileContactList ? 'hidden md:flex' : 'flex'}
        flex-1 min-w-0 bg-white
      `}>
        <MessageThread
          contact={selectedContact}
          messages={selectedMessages}
          scrollToMessageId={scrollToMessageId}
          onBack={handleBackToContacts}
        />
      </div>

      
    </div>
  );
}