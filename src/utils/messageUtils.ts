import type { SMSRecord, Contact, Message, MessageStatus } from '../types';
import { normalizePhoneNumber } from './phoneUtils';

const mapSMSStatusToMessageStatus = (smsStatus: string, isFromMe: boolean): MessageStatus => {
  const normalizedStatus = smsStatus?.toLowerCase();

  if (!isFromMe) {
    // For received messages, map based on read status
    switch (normalizedStatus) {
      case 'read':
        return 'read';
      case 'unread':
        return 'delivered'; // Message was delivered but not read yet
      default:
        return 'delivered';
    }
  }

  // For sent messages, map SMS status values
  switch (normalizedStatus) {
    case 'sent':
      return 'delivered'; // Successfully sent/delivered
    case 'read':
      return 'read'; // Recipient has read the message
    case 'unsent':
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'sent';
  }
};

export const processMessagesData = (smsData: SMSRecord[]): { contacts: Contact[], messagesByContact: Map<string, Message[]> } => {
  const contactsMap = new Map<string, Contact>();
  const messagesByContact = new Map<string, Message[]>();

  // Process each SMS record
  smsData.forEach(record => {
    if (!record.party?.phone || !record.message) return;

    const normalizedPhone = normalizePhoneNumber(record.party.phone);
    const contactKey = normalizedPhone || record.party.phone;

    // Parse the date/time
    let timestamp: Date;
    try {
      const dateParts = record.time.date.split('/');
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      const timeStr = record.time.time.replace(/\(.*\)/, '');
      const fullDateStr = `${month}/${day}/${year} ${timeStr}`;
      timestamp = new Date(fullDateStr);
    } catch {
      timestamp = new Date();
    }

    // Create message
    const isFromMe = record.party.direction === 'to';
    const message: Message = {
      id: record.id,
      text: record.message,
      timestamp,
      isFromMe,
      isRead: record.status === 'Read',
      status: mapSMSStatusToMessageStatus(record.status, isFromMe)
    };

    // Add to messages map
    if (!messagesByContact.has(contactKey)) {
      messagesByContact.set(contactKey, []);
    }
    messagesByContact.get(contactKey)!.push(message);

    // Update or create contact
    const existingContact = contactsMap.get(contactKey);
    if (existingContact) {
      // Update if this message is newer
      if (timestamp > existingContact.lastMessageTime) {
        existingContact.lastMessage = record.message;
        existingContact.lastMessageTime = timestamp;
      }
      existingContact.messageCount++;
      // Only received (incoming) messages should affect unread state
      if (record.party.direction === 'from') {
        if (!record.status || record.status !== 'Read') {
          existingContact.isRead = false;
        }
      }
    } else {
      // Create new contact
      const contact: Contact = {
        phone: record.party.phone,
        name: record.party.name || 'Unknown',
        normalizedPhone,
        lastMessage: record.message,
        lastMessageTime: timestamp,
        messageCount: 1,
        // For initial state, consider only incoming messages for unread
        isRead: record.party.direction === 'from' ? (record.status === 'Read') : true
      };
      contactsMap.set(contactKey, contact);
    }
  });

  // Sort messages by timestamp for each contact
  messagesByContact.forEach(messages => {
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  // Convert to array and sort contacts by last message time
  const contacts = Array.from(contactsMap.values()).sort((a, b) =>
    b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
  );

  return { contacts, messagesByContact };
};

export const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today - show time
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // This week - show day
    return timestamp.toLocaleDateString([], { weekday: 'short' });
  } else {
    // Older - show date
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const getContactDisplayName = (contact: Contact): string => {
  if (contact.name && contact.name !== 'Unknown' && contact.name.trim() !== '') {
    return contact.name;
  }

  // Format phone number for display
  const phone = contact.phone;
  if (phone.startsWith('+')) {
    return phone;
  } else if (phone.length === 10) {
    return `+960 ${phone.slice(0, 3)} ${phone.slice(3)}`;
  }

  return phone;
};