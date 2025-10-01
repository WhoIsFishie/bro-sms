import { useEffect, useMemo, useRef, useState } from "react";
import { List, CellMeasurer, CellMeasurerCache, AutoSizer } from "react-virtualized";
import type { MeasuredCellParent } from "react-virtualized/dist/es/CellMeasurer";
import "react-virtualized/styles.css";
import type { Contact, Message } from "../types";
import {
  formatDetailedMessageTime,
  getMessageYear,
  getContactDisplayName,
} from "../utils/messageUtils";
import { getContactColor, getContactTextColor } from "../utils/contactColors";

interface MessageThreadProps {
  contact: Contact | null;
  messages: Message[];
  scrollToMessageId?: number | null;
  onBack?: () => void;
}

export default function MessageThread({
  contact,
  messages,
  scrollToMessageId,
  onBack,
}: MessageThreadProps) {
  const listRef = useRef<List>(null);
  const cacheRef = useRef<CellMeasurerCache | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  if (!cacheRef.current) {
    cacheRef.current = new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 80,
      minHeight: 40,
    });
  }

  // Prepare messages with year dividers
  const itemsWithDividers = useMemo(() => {
    const items: Array<{
      type: "message" | "divider";
      data: Message | number;
      index: number;
    }> = [];
    const currentCalendarYear = new Date().getFullYear();

    messages.forEach((message, index) => {
      const currentYear = getMessageYear(message.timestamp);
      const previousYear =
        index > 0 ? getMessageYear(messages[index - 1].timestamp) : null;
      const showYearDivider =
        previousYear !== null && currentYear !== previousYear;
      const isFirstMessage = index === 0;
      const showFirstYearDivider =
        isFirstMessage && currentYear !== currentCalendarYear;

      if (showYearDivider || showFirstYearDivider) {
        items.push({ type: "divider", data: currentYear, index: items.length });
      }
      items.push({ type: "message", data: message, index: items.length });
    });

    return items;
  }, [messages]);

  useEffect(() => {
    if (cacheRef.current) {
      cacheRef.current.clearAll();
    }
    if (listRef.current) {
      listRef.current.forceUpdateGrid();
    }
  }, [itemsWithDividers]);

  useEffect(() => {
    if (!scrollToMessageId || !listRef.current) return;

    const targetIndex = itemsWithDividers.findIndex(
      (item) =>
        item.type === "message" &&
        (item.data as Message).id === scrollToMessageId
    );

    if (targetIndex !== -1) {
      listRef.current.scrollToRow(targetIndex);
      requestAnimationFrame(() => {
        if (!listRef.current) return;
        listRef.current.recomputeRowHeights(targetIndex);
        listRef.current.scrollToRow(targetIndex);
      });
      setHighlightMessageId(scrollToMessageId);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightMessageId(null);
      }, 2000);
    }
  }, [scrollToMessageId, itemsWithDividers]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.468L3 21l1.468-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a contact from the sidebar to view their messages
          </p>
        </div>
      </div>
    );
  }

  const displayName = getContactDisplayName(contact);
  const contactId = contact.normalizedPhone || contact.phone;
  const avatarColor = getContactColor(contactId);
  const textColor = getContactTextColor();

  return (
    <div className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between h-17 px-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden mr-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div className="flex items-center">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center shadow-inner`}
            >
              {contact.name && contact.name !== "Unknown" ? (
                <span className={`text-sm font-medium ${textColor}`}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg
                  className={`w-5 h-5 ${textColor}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {contact.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {messages.length} messages
          </span>
        </div>
      </div>

      <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <p className="text-xs text-red-800 dark:text-red-200 text-center">
          All responses are estimated and can be wrong
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-800" style={{ position: 'relative' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <AutoSizer>
              {({ height, width }) =>
                cacheRef.current && (
                  <List
                    ref={listRef}
                    height={height}
                    width={width}
                    rowCount={itemsWithDividers.length}
                    scrollToAlignment="center"
                    deferredMeasurementCache={cacheRef.current}
                    rowHeight={cacheRef.current.rowHeight}
                    rowRenderer={({ index, key, parent, style }) => (
                      <Row
                        key={key}
                        index={index}
                        items={itemsWithDividers}
                        style={style}
                        cache={cacheRef.current!}
                        parent={parent}
                        highlightMessageId={highlightMessageId}
                      />
                    )}
                    overscanRowCount={10}
                  />
                )
              }
            </AutoSizer>
          </div>
        )}
      </div>
    </div>
  );
}

// Row component for virtual list
type Item = {
  type: "message" | "divider";
  data: Message | number;
  index: number;
};
const Row = ({
  index,
  items,
  style,
  cache,
  parent,
  highlightMessageId,
}: {
  index: number;
  items: Item[];
  style: React.CSSProperties;
  cache: CellMeasurerCache;
  parent: MeasuredCellParent;
  highlightMessageId: number | null;
}) => {
  const item = items[index];

  if (item.type === "divider") {
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={`divider-${index}`}
        parent={parent}
        rowIndex={index}
      >
        <div style={style} className="py-4">
          <YearDivider year={item.data as number} />
        </div>
      </CellMeasurer>
    );
  }

  const message = item.data as Message;
  const isHighlighted = highlightMessageId != null && message.id === highlightMessageId;
  return (
    <CellMeasurer
      cache={cache}
      columnIndex={0}
      key={`message-${message.id}`}
      parent={parent}
      rowIndex={index}
    >
      <div style={style}>
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          <MessageBubble message={message} isHighlighted={isHighlighted} />
        </div>
      </div>
    </CellMeasurer>
  );
};

function MessageBubble({ message, isHighlighted = false }: { message: Message; isHighlighted?: boolean }) {
  const isFromMe = message.isFromMe;

  // Render call log differently
  if (message.isCallLog) {
    return (
      <div className="flex px-4 justify-center">
        <div className={`px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center gap-2 ${isHighlighted ? "ring-2 ring-amber-400" : ""}`}>
          <svg
            className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Phone call
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatDetailedMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex px-4 ${isFromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-2xl shadow-sm transition-colors duration-300 ${
          isFromMe
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-sm"
        } ${isHighlighted ? "ring-2 ring-amber-400" : ""}`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>
        <div className={`flex items-center justify-end mt-2 gap-2`}>
          <span
            className={`text-xs ${
              isFromMe ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatDetailedMessageTime(message.timestamp)}
          </span>
          <MessageStatusIndicator message={message} />
        </div>
      </div>
    </div>
  );
}

function MessageStatusIndicator({ message }: { message: Message }) {
  if (!message.isFromMe) {
    const isRead = message.status === "read" || message.isRead;
    return (
      <span
        className={`text-xs ${
          isRead
            ? "text-gray-400 dark:text-gray-500"
            : "text-blue-500 dark:text-blue-400"
        }`}
      >
        {isRead ? "Read" : "Unread"}
      </span>
    );
  }

  const getStatusInfo = (message: Message) => {
    if (!message.isFromMe) {
      if (message.status === "read" || message.isRead) {
        return { icon: "dot", color: "text-gray-400", title: "Read" };
      } else {
        return { icon: "dot", color: "text-blue-500", title: "Unread" };
      }
    }

    if (message.status) {
      switch (message.status) {
        case "sent":
          return {
            icon: "single-check",
            color: "text-blue-300",
            title: "Sent",
          };
        case "delivered":
          return {
            icon: "double-check",
            color: "text-blue-300",
            title: "Delivered",
          };
        case "read":
          return {
            icon: "double-check",
            color: "text-blue-200",
            title: "Read",
          };
        case "failed":
          return {
            icon: "exclamation",
            color: "text-red-400",
            title: "Failed",
          };
        default:
          return {
            icon: "single-check",
            color: "text-blue-300",
            title: "Sent",
          };
      }
    }

    if (message.isRead) {
      return { icon: "double-check", color: "text-blue-200", title: "Read" };
    }

    return { icon: "single-check", color: "text-blue-300", title: "Sent" };
  };

  const statusInfo = getStatusInfo(message);

  if (!statusInfo) {
    return null;
  }

  if (statusInfo.icon === "dot") {
    const bgColor =
      statusInfo.color === "text-gray-400" ? "bg-gray-400" : "bg-blue-500";
    return (
      <div
        className={`w-3 h-3 rounded-full ${bgColor} flex-shrink-0`}
        title={statusInfo.title}
      />
    );
  }

  if (statusInfo.icon === "single-check") {
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

  if (statusInfo.icon === "double-check") {
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

  if (statusInfo.icon === "exclamation") {
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

function YearDivider({ year }: { year: number }) {
  return (
    <div className="flex items-center my-6">
      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
      <div className="mx-4 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
        {year}
      </div>
      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
    </div>
  );
}
