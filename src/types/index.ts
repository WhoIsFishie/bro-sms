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
}