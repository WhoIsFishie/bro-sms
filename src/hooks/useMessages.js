import { useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useContacts } from './useContacts'

export function useMessages(contactKey) {
  const { messages, loadedMessages, messageSearchTerm, jumpToMessageId } = useApp()
  const contacts = useContacts()

  const contactMessages = useMemo(() => {
    if (!contactKey) return []

    const contact = contacts.find(c => c.contactKey === contactKey)
    if (!contact) return []

    let allMessages = messages.filter(msg => {
      const mContact = msg.party

      if (contactKey.startsWith('unknown_')) {
        const messageId = contactKey.split('_')[1]
        return msg.id.toString() === messageId
      } else if (contactKey.startsWith('name_')) {
        const contactName = contactKey.substring(5)
        return mContact.name && mContact.name.trim() === contactName &&
               (!mContact.phone || mContact.phone.trim() === '')
      } else {
        return mContact.phone && mContact.phone.trim() === contactKey
      }
    })

    // Filter by message search term if provided
    if (messageSearchTerm) {
      allMessages = allMessages.filter(msg =>
        msg.message.toLowerCase().includes(messageSearchTerm.toLowerCase())
      )
    }

    // Sort by date
    allMessages.sort((a, b) => {
      const dateA = new Date(`${a.time.date} ${a.time.time.split('(')[0]}`)
      const dateB = new Date(`${b.time.date} ${b.time.time.split('(')[0]}`)
      return dateA - dateB
    })

    // If we have a jumpToMessageId, ensure that message is included in the results
    let messagesToShow = allMessages.slice(0, loadedMessages)

    if (jumpToMessageId && !messagesToShow.find(msg => msg.id.toString() === jumpToMessageId.toString())) {
      const jumpTargetIndex = allMessages.findIndex(msg => msg.id.toString() === jumpToMessageId.toString())
      if (jumpTargetIndex !== -1) {
        // Include all messages up to and including the target message
        messagesToShow = allMessages.slice(0, Math.max(loadedMessages, jumpTargetIndex + 1))
      }
    }

    return messagesToShow
  }, [contactKey, messages, loadedMessages, contacts, messageSearchTerm, jumpToMessageId])

  const totalMessages = useMemo(() => {
    if (!contactKey) return 0

    return messages.filter(msg => {
      const mContact = msg.party

      if (contactKey.startsWith('unknown_')) {
        const messageId = contactKey.split('_')[1]
        return msg.id.toString() === messageId
      } else if (contactKey.startsWith('name_')) {
        const contactName = contactKey.substring(5)
        return mContact.name && mContact.name.trim() === contactName &&
               (!mContact.phone || mContact.phone.trim() === '')
      } else {
        return mContact.phone && mContact.phone.trim() === contactKey
      }
    }).length
  }, [contactKey, messages])

  const hasMoreMessages = totalMessages > loadedMessages

  return {
    messages: contactMessages,
    totalMessages,
    hasMoreMessages
  }
}