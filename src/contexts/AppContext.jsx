import { createContext, useContext, useReducer, useEffect } from 'react'
import { parseMessages, fetchPastebinData, fetchInternetArchiveData, fetchGitHubData, fetchGenericJsonData } from '../lib/utils'

const AppContext = createContext()

const initialState = {
  messages: [],
  selectedContact: null,
  searchTerm: '',
  messageSearchTerm: '',
  jumpToMessageId: null,
  loadedMessages: 50,
  loading: false,
  error: null,
  isMobile: false,
  showContacts: true,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, selectedContact: null, searchTerm: '', messageSearchTerm: '', jumpToMessageId: null }
    case 'SET_SELECTED_CONTACT':
      return {
        ...state,
        selectedContact: action.payload,
        loadedMessages: 50,
        showContacts: action.showContacts ?? state.showContacts,
        jumpToMessageId: action.jumpToMessageId ?? null
      }
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload }
    case 'SET_MESSAGE_SEARCH_TERM':
      return { ...state, messageSearchTerm: action.payload }
    case 'SET_JUMP_TO_MESSAGE':
      return { ...state, jumpToMessageId: action.payload }
    case 'CLEAR_JUMP_TO_MESSAGE':
      return { ...state, jumpToMessageId: null }
    case 'SET_LOADED_MESSAGES':
      return { ...state, loadedMessages: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload }
    case 'SET_SHOW_CONTACTS':
      return { ...state, showContacts: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const checkMobile = () => {
      dispatch({ type: 'SET_IS_MOBILE', payload: window.innerWidth < 768 })
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check for URL parameters on mount
  useEffect(() => {
    const urlPath = window.location.pathname
    const searchParams = new URLSearchParams(window.location.search)

    // Check for GitHub URL first
    const githubUrl = searchParams.get('github') || searchParams.get('gh')
    if (githubUrl) {
      loadFromGitHub(githubUrl)
      return
    }

    // Check for Internet Archive URL
    const archiveUrl = searchParams.get('archive') || searchParams.get('ia')
    if (archiveUrl) {
      loadFromInternetArchive(archiveUrl)
      return
    }

    let pastebinKey = null

    // Check URL path first
    const pathSegments = urlPath.split('/').filter(segment => segment !== '')

    // For GitHub Pages: /bro-sms/[pastebinkey] or direct /[pastebinkey]
    if (pathSegments.length >= 2 && pathSegments[0] === 'bro-sms') {
      // Format: /bro-sms/pastebinkey
      pastebinKey = pathSegments[1]
    } else if (pathSegments.length === 1 && pathSegments[0] !== 'bro-sms') {
      // Format: /pastebinkey (direct)
      pastebinKey = pathSegments[0]
    }

    // Check query parameters as fallback: ?pastebin=key or ?p=key
    if (!pastebinKey) {
      pastebinKey = searchParams.get('pastebin') || searchParams.get('p') || searchParams.get('key')
    }

    // Clean up the key (remove any unwanted characters)
    if (pastebinKey) {
      pastebinKey = pastebinKey.replace(/[^a-zA-Z0-9]/g, '')
      if (pastebinKey.length > 0) {
        loadFromPastebin(pastebinKey)
      }
    }
  }, [])

  const loadFromPastebin = async (pastebinKey) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      const data = await fetchPastebinData(pastebinKey)
      const messages = parseMessages(data)

      if (messages.length === 0) {
        throw new Error('No messages found in the pastebin data')
      }

      dispatch({ type: 'SET_MESSAGES', payload: messages })
      console.log(`Loaded ${messages.length} messages from pastebin`)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load pastebin data: ${error.message}` })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadFromInternetArchive = async (archiveUrl) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      const data = await fetchInternetArchiveData(archiveUrl)
      const messages = parseMessages(data)

      if (messages.length === 0) {
        throw new Error('No messages found in the Internet Archive data')
      }

      dispatch({ type: 'SET_MESSAGES', payload: messages })
      console.log(`Loaded ${messages.length} messages from Internet Archive`)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load Internet Archive data: ${error.message}` })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadFromGitHub = async (githubUrl) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      const data = await fetchGitHubData(githubUrl)
      const messages = parseMessages(data)

      if (messages.length === 0) {
        throw new Error('No messages found in the GitHub data')
      }

      dispatch({ type: 'SET_MESSAGES', payload: messages })
      console.log(`Loaded ${messages.length} messages from GitHub`)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load GitHub data: ${error.message}` })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }


  const loadFromFile = (file) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        const messages = parseMessages(jsonData)

        if (messages.length === 0) {
          throw new Error('No messages found in the JSON file')
        }

        dispatch({ type: 'SET_MESSAGES', payload: messages })
        console.log(`Loaded ${messages.length} messages from file`)
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Error parsing JSON file: ${error.message}` })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    reader.onerror = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Error reading file' })
    }

    reader.readAsText(file)
  }

  const loadFromGenericJson = async (jsonUrl) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      const data = await fetchGenericJsonData(jsonUrl)
      const messages = parseMessages(data)

      if (messages.length === 0) {
        throw new Error('No messages found in the JSON data')
      }

      dispatch({ type: 'SET_MESSAGES', payload: messages })
      console.log(`Loaded ${messages.length} messages from JSON URL`)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load JSON data: ${error.message}` })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadFromUrl = async (url) => {
    // Smart URL detection
    if (url.includes('pastebin.com')) {
      // Extract pastebin key
      const keyMatch = url.match(/pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)/)
      if (keyMatch) {
        return loadFromPastebin(keyMatch[1])
      }
    } else if (url.includes('github.com') || url.includes('githubusercontent.com')) {
      return loadFromGitHub(url)
    } else if (url.includes('archive.org')) {
      return loadFromInternetArchive(url)
    } else if (url.length <= 20 && /^[a-zA-Z0-9]+$/.test(url)) {
      // Looks like a pastebin key
      return loadFromPastebin(url)
    } else if (url.endsWith('.json') || url.includes('github.io')) {
      // Direct JSON URL or GitHub Pages
      return loadFromGenericJson(url)
    } else {
      // Try as generic JSON URL as last resort
      try {
        const urlObj = new URL(url)
        return loadFromGenericJson(url)
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid URL format. Please use a valid JSON URL, Pastebin, GitHub, or Internet Archive URL.' })
      }
    }
  }

  const value = {
    ...state,
    dispatch,
    loadFromFile,
    loadFromPastebin,
    loadFromInternetArchive,
    loadFromGitHub,
    loadFromGenericJson,
    loadFromUrl,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}