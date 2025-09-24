import { useMemo } from 'react'
import { useApp } from '../contexts/AppContext'

export function useContacts() {
  const { messages, searchTerm } = useApp()

  const contacts = useMemo(() => {
    // If searching, return message-level results
    if (searchTerm && searchTerm.trim() !== '') {
      const messageResults = []

      messages.forEach(msg => {
        const contact = msg.party
        let displayName
        let displayPhone
        let contactKey

        if (contact.phone && contact.phone.trim() !== '') {
          contactKey = contact.phone.trim()
          displayName = contact.name || 'Unknown Contact'
          displayPhone = contact.phone.trim()
        } else if (contact.name && contact.name.trim() !== '') {
          contactKey = `name_${contact.name.trim()}`
          displayName = contact.name.trim()
          displayPhone = 'Unknown'
        } else {
          contactKey = `unknown_${msg.id}`
          displayName = `Unknown Contact ${msg.id}`
          displayPhone = 'Unknown'
        }

        // Check if message contains search term
        const messageMatch = msg.message.toLowerCase().includes(searchTerm.toLowerCase())
        const nameMatch = displayName.toLowerCase().includes(searchTerm.toLowerCase())
        const phoneMatch = displayPhone.includes(searchTerm)

        if (messageMatch || nameMatch || phoneMatch) {
          messageResults.push({
            phone: displayPhone,
            name: displayName,
            lastMessage: msg.message, // Use the actual matching message
            lastTime: msg.time, // Use the actual message time
            unreadCount: msg.status === 'Unread' ? 1 : 0,
            totalMessages: 1, // This represents one message match
            contactKey: contactKey,
            messageId: msg.id, // Store the specific message ID
            messageDirection: msg.party.direction, // Store message direction
            isMessageResult: true // Flag to indicate this is a message-level result
          })
        }
      })

      // Sort by message timestamp (newest first)
      return messageResults.sort((a, b) => {
        const dateA = new Date(`${a.lastTime.date} ${a.lastTime.time.split('(')[0]}`)
        const dateB = new Date(`${b.lastTime.date} ${b.lastTime.time.split('(')[0]}`)
        return dateB - dateA
      })
    }

    // Normal contact view (no search)
    const contactMap = new Map()

    messages.forEach(msg => {
      const contact = msg.party
      let contactKey
      let displayName
      let displayPhone

      if (contact.phone && contact.phone.trim() !== '') {
        contactKey = contact.phone.trim()
        displayName = contact.name || 'Unknown Contact'
        displayPhone = contact.phone.trim()
      } else if (contact.name && contact.name.trim() !== '') {
        contactKey = `name_${contact.name.trim()}`
        displayName = contact.name.trim()
        displayPhone = 'Unknown'
      } else {
        contactKey = `unknown_${msg.id}`
        displayName = `Unknown Contact ${msg.id}`
        displayPhone = 'Unknown'
      }

      if (!contactMap.has(contactKey)) {
        const contactMessages = messages.filter(m => {
          const mContact = m.party

          if (contact.phone && contact.phone.trim() !== '') {
            return mContact.phone && mContact.phone.trim() === contact.phone.trim()
          } else if (contact.name && contact.name.trim() !== '') {
            return mContact.name && mContact.name.trim() === contact.name.trim() &&
                   (!mContact.phone || mContact.phone.trim() === '')
          } else {
            return m.id === msg.id
          }
        })

        // Sort messages by date and get the latest one
        const sortedMessages = contactMessages.sort((a, b) => {
          const dateA = new Date(`${a.time.date} ${a.time.time.split('(')[0]}`)
          const dateB = new Date(`${b.time.date} ${b.time.time.split('(')[0]}`)
          return dateB - dateA // Latest first
        })
        const latestMessage = sortedMessages[0]

        contactMap.set(contactKey, {
          phone: displayPhone,
          name: displayName,
          lastMessage: latestMessage.message,
          lastTime: latestMessage.time,
          unreadCount: contactMessages.filter(m => m.status === 'Unread').length,
          totalMessages: contactMessages.length,
          contactKey: contactKey,
          isMessageResult: false
        })
      }
    })

    return Array.from(contactMap.values())
      .sort((a, b) => {
        const dateA = new Date(`${a.lastTime.date} ${a.lastTime.time.split('(')[0]}`)
        const dateB = new Date(`${b.lastTime.date} ${b.lastTime.time.split('(')[0]}`)
        return dateB - dateA
      })
  }, [messages, searchTerm])

  return contacts
}