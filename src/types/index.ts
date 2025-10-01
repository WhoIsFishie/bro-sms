export interface DataQualityIssue {
  type: 'invalid_timestamp' | 'missing_field' | 'invalid_date' | 'empty_value' | 'invalid_format';
  field: string;
  value: unknown;
  index?: number;
  message: string;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  issues: DataQualityIssue[];
}

export interface NormalizedStats {
  totalContacts: number;
  uniqueContacts: number;
  phoneVariations: { [normalizedPhone: string]: string[] };
}

// Legacy SMS Record format (keep for backward compatibility)
export interface SMSRecord {
  id: number;
  folder: string;
  party: {
    direction: 'from' | 'to';
    phone: string;
    name: string;
  };
  time: {
    date: string;
    time: string;
  };
  status: string;
  message: string;
  deleted: null | string;
}

// New unified data record format
export interface DataRecord {
  ID: string;
  Type: 'SMS Messages' | 'Calendar' | 'Call Log' | 'Instant Messages' | string;
  Direction: 'From' | 'To' | '';
  Attachments: string;
  Locations: string;
  Timestamp: string; // Format: "13/06/2014 21:15:08(UTC+0)"
  Party: string; // Format: "From: +9607781405" or "" for calendar
  Description: string; // Message content or event description
  Deleted: string;
}

// Union type for both old and new formats
export type UnifiedRecord = SMSRecord | DataRecord;

export interface Contact {
  phone: string;
  name: string;
  normalizedPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  isRead: boolean;
}

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: number;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  isRead: boolean;
  status?: MessageStatus;
  isCallLog?: boolean;
}