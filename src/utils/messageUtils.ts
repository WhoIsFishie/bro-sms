import type {
  DataRecord,
  UnifiedRecord,
  Contact,
  Message,
  MessageStatus,
} from "../types";
import { normalizePhoneNumber } from "./phoneUtils";

const mapSMSStatusToMessageStatus = (
  smsStatus: string,
  isFromMe: boolean
): MessageStatus => {
  const normalizedStatus = smsStatus?.toLowerCase();

  if (!isFromMe) {
    // For received messages, map based on read status
    switch (normalizedStatus) {
      case "read":
        return "read";
      case "unread":
        return "delivered"; // Message was delivered but not read yet
      default:
        return "delivered";
    }
  }

  // For sent messages, map SMS status values
  switch (normalizedStatus) {
    case "sent":
      return "delivered"; // Successfully sent/delivered
    case "read":
      return "read"; // Recipient has read the message
    case "unsent":
    case "failed":
    case "error":
      return "failed";
    default:
      return "sent";
  }
};

// Helper function to detect data format
const isDataRecord = (record: UnifiedRecord): record is DataRecord => {
  return "ID" in record && "Type" in record && "Description" in record;
};

// Helper function to parse new timestamp format
const parseNewTimestamp = (timestampStr: string): Date => {
  try {
    // Format: "13/06/2014 21:15:08(UTC+0)"
    const cleanStr = timestampStr.replace(/\(.*\)/, "").trim();
    const [datePart, timePart] = cleanStr.split(" ");
    const [day, month, year] = datePart.split("/");

    // Construct ISO-like format for parsing
    const isoStr = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}T${timePart}`;
    return new Date(isoStr);
  } catch {
    return new Date();
  }
};

// Helper function to extract phone number and name from Party field
const extractPhoneFromParty = (
  party: string
): { phone: string; name: string } | null => {
  if (!party) return null;

  // Handle formats like "From: +9607781405" or "To: +9607781405"
  const match = party.match(/(?:From:|To:)\s*(.+)/);
  if (!match) return null;

  const partyContent = match[1].trim();

  // Check if it contains both phone and name (e.g., "+9607791073 Oyittey")
  const phoneNameMatch = partyContent.match(/^(\+?\d+)\s+(.+)$/);
  if (phoneNameMatch) {
    return {
      phone: phoneNameMatch[1],
      name: phoneNameMatch[2].trim(),
    };
  }

  // If it looks like just a phone number
  if (partyContent.match(/^\+?\d+$/)) {
    return {
      phone: partyContent,
      name: "Unknown",
    };
  }

  // If it doesn't look like a phone number, it might be just a name
  // Try to find a phone number pattern within it
  const phoneMatch = partyContent.match(/(\+?\d{7,15})/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const name = partyContent.replace(phone, "").trim();
    return {
      phone,
      name: name || "Unknown",
    };
  }

  // If no phone number found, skip this record
  return null;
};

export const processMessagesData = (
  data: UnifiedRecord[]
): {
  contacts: Contact[];
  messagesByContact: Map<string, Message[]>;
  searchableData: Map<string, string[]>;
} => {
  const contactsMap = new Map<string, Contact>();
  const messagesByContact = new Map<string, Message[]>();
  const searchableData = new Map<string, string[]>();
  let lastContactKey: string | null = null;

  // Process each record (both old and new formats)
  data.forEach((record) => {
    let phone: string | null = null;
    let contactName = "Unknown";
    let messageText = "";
    let timestamp: Date;
    let isFromMe = false;
    let messageId: number;
    let isRead = true;

    if (isDataRecord(record)) {
      // Process SMS Messages, Instant Messages, and Call Logs
      const isCallLog = record.Type === "Call Log";
      const isSMS = record.Type === "SMS Messages" || record.Type === "Instant Messages";

      if (!isSMS && !isCallLog) return;

      // Handle new format records
      const partyRaw = (record.Party || "").trim();
      const hasEmptyFrom = /^From:\s*$/i.test(partyRaw);
      const hasEmptyTo = /^To:\s*$/i.test(partyRaw);

      const partyInfo = extractPhoneFromParty(record.Party);

      // Call logs can exist without Description
      if (!isCallLog && !record.Description) return;

      if (partyInfo) {
        phone = partyInfo.phone;
        contactName = partyInfo.name;
      } else if (hasEmptyFrom || hasEmptyTo) {
        // Attach to the current chat (lastContactKey)
        if (!lastContactKey) return;
        const existing = contactsMap.get(lastContactKey);
        if (!existing) return;
        phone = existing.phone;
        contactName = existing.name;
      } else if (isCallLog && record.Party && !record.Party.includes("From:") && !record.Party.includes("To:")) {
        // Handle call log with just phone number (e.g., "9607778787")
        phone = record.Party;
        contactName = "Unknown";
      } else {
        return; // Skip records without identifiable party
      }

      messageText = record.Description || "";
      timestamp = parseNewTimestamp(record.Timestamp);
      // Treat Direction == "To" as sent-by-bro; also treat empty "From:" as sent-by-bro
      isFromMe = record.Direction === "To" || hasEmptyFrom;
      messageId = parseInt(record.ID);
      // For new format, we don't have read status, assume read
      isRead = true;
    } else {
      // Legacy format (SMSRecord)
      if (!record.party?.phone || !record.message) return;

      phone = record.party.phone;
      contactName = record.party.name || "Unknown";
      messageText = record.message;
      isFromMe = record.party.direction === "to";
      messageId = record.id;
      isRead = record.status === "Read";

      // Parse legacy timestamp
      try {
        const dateParts = record.time.date.split("/");
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        const timeStr = record.time.time.replace(/\(.*\)/, "");
        const fullDateStr = `${month}/${day}/${year} ${timeStr}`;
        timestamp = new Date(fullDateStr);
      } catch {
        timestamp = new Date();
      }
    }

    if (!phone) return;

    const normalizedPhone = normalizePhoneNumber(phone);
    const contactKey = normalizedPhone || phone;
    lastContactKey = contactKey;

    // Create message
    const message: Message = {
      id: messageId,
      text: messageText,
      timestamp,
      isFromMe,
      isRead,
      status: mapSMSStatusToMessageStatus(isRead ? "Read" : "Unread", isFromMe),
      isCallLog: isDataRecord(record) && record.Type === "Call Log",
    };

    // Add to messages map
    if (!messagesByContact.has(contactKey)) {
      messagesByContact.set(contactKey, []);
    }
    messagesByContact.get(contactKey)!.push(message);

    // Add searchable data for this contact
    if (!searchableData.has(contactKey)) {
      searchableData.set(contactKey, []);
    }
    const searchTerms = searchableData.get(contactKey)!;

    // Add searchable terms based on format
    if (isDataRecord(record)) {
      // New format: add Party and Description
      if (record.Party) {
        searchTerms.push(record.Party);
      }
      if (record.Description) {
        searchTerms.push(record.Description);
      }
    } else {
      // Legacy format: add party.name, party.phone, and message
      if (record.party?.name) {
        searchTerms.push(record.party.name);
      }
      if (record.party?.phone) {
        searchTerms.push(record.party.phone);
      }
      if (record.message) {
        searchTerms.push(record.message);
      }
    }

    // Update or create contact
    const existingContact = contactsMap.get(contactKey);
    if (existingContact) {
      // Update if this message is newer
      if (timestamp > existingContact.lastMessageTime) {
        existingContact.lastMessage = messageText;
        existingContact.lastMessageTime = timestamp;
      }
      existingContact.messageCount++;
      // Only received (incoming) messages should affect unread state
      if (!isFromMe) {
        if (!isRead) {
          existingContact.isRead = false;
        }
      }
    } else {
      // Create new contact
      const contact: Contact = {
        phone,
        name: contactName,
        normalizedPhone,
        lastMessage: messageText,
        lastMessageTime: timestamp,
        messageCount: 1,
        // For initial state, consider only incoming messages for unread
        isRead: !isFromMe ? isRead : true,
      };
      contactsMap.set(contactKey, contact);
    }
  });

  // Sort messages by timestamp for each contact
  messagesByContact.forEach((messages) => {
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  // Convert to array and sort contacts by last message time
  const contacts = Array.from(contactsMap.values()).sort(
    (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
  );

  return { contacts, messagesByContact, searchableData };
};

export const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today - show time
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInDays === 1) {
    // Yesterday
    return "Yesterday";
  } else if (diffInDays < 7) {
    // This week - show day
    return timestamp.toLocaleDateString([], { weekday: "short" });
  } else {
    // Older - show date
    return timestamp.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

export const formatDetailedMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate()
  );

  const time = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (messageDate.getTime() === today.getTime()) {
    // Today - show just time
    return time;
  } else {
    // Other days - show date and time WITHOUT year
    const date = timestamp.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    return `${date}, ${time}`;
  }
};

export const getMessageYear = (timestamp: Date): number => {
  return timestamp.getFullYear();
};

export const getContactDisplayName = (contact: Contact): string => {
  // Always show name first if available, regardless of format
  if (
    contact.name &&
    contact.name !== "Unknown" &&
    contact.name.trim() !== ""
  ) {
    return contact.name;
  }

  // If no name, just return the phone number as-is (no formatting)
  return contact.phone;
};
