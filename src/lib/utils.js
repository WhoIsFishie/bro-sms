import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeObj) {
  const date = new Date(`${timeObj.date} ${timeObj.time.split('(')[0]}`)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Indian/Maldives' // GMT+5 Maldivian Time
  })
}

export function parseMessages(jsonData) {
  const messagesArray = Array.isArray(jsonData) ? jsonData : jsonData.messages || []
  return messagesArray
}

export async function fetchPastebinData(pastebinKey) {
  try {
    // Clean the key
    const cleanKey = pastebinKey.replace(/[^a-zA-Z0-9]/g, '')

    if (!cleanKey || cleanKey.length < 5) {
      throw new Error('Invalid pastebin key format')
    }

    const response = await fetch(`https://pastebin.com/raw/${cleanKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pastebin not found. Please check the key and try again.')
      } else if (response.status === 403) {
        throw new Error('Pastebin is private or access denied.')
      } else {
        throw new Error(`Failed to fetch pastebin data (${response.status})`)
      }
    }

    const text = await response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('Pastebin is empty or contains no data')
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch (parseError) {
      throw new Error('Pastebin does not contain valid JSON data')
    }
  } catch (error) {
    console.error('Error fetching pastebin data:', error)
    throw error
  }
}


export async function fetchInternetArchiveData(archiveUrl) {
  try {
    // Validate Internet Archive URL format
    const url = new URL(archiveUrl)

    if (!url.hostname.includes('archive.org')) {
      throw new Error('Invalid Internet Archive URL format')
    }

    // Test CORS by attempting direct fetch
    const response = await fetch(archiveUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      mode: 'cors'
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Internet Archive file not found. Please check the URL and try again.')
      } else if (response.status === 403) {
        throw new Error('Internet Archive file access denied.')
      } else {
        throw new Error(`Failed to fetch Internet Archive data (${response.status})`)
      }
    }

    const text = await response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('Internet Archive file is empty or contains no data')
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch (parseError) {
      throw new Error('Internet Archive file does not contain valid JSON data')
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      throw new Error(
        'Internet Archive files cannot be automatically fetched due to CORS restrictions. ' +
        'Please download the JSON file from Internet Archive manually and upload it using the file upload button.'
      )
    }
    console.error('Error fetching Internet Archive data:', error)
    throw error
  }
}

export async function fetchGitHubData(githubUrl) {
  try {
    // Convert GitHub URLs to raw.githubusercontent.com format
    let rawUrl = githubUrl

    // Handle different GitHub URL formats
    if (githubUrl.includes('github.com') && !githubUrl.includes('raw.githubusercontent.com')) {
      // Convert github.com/user/repo/blob/branch/file.json to raw.githubusercontent.com/user/repo/branch/file.json
      rawUrl = githubUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/')
    }

    // Validate GitHub URL format
    const url = new URL(rawUrl)
    if (!url.hostname.includes('githubusercontent.com') && !url.hostname.includes('github.com')) {
      throw new Error('Invalid GitHub URL format')
    }

    const response = await fetch(rawUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('GitHub file not found. Please check the URL and try again.')
      } else if (response.status === 403) {
        throw new Error('GitHub file access denied. Make sure the repository is public.')
      } else {
        throw new Error(`Failed to fetch GitHub data (${response.status})`)
      }
    }

    const text = await response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('GitHub file is empty or contains no data')
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch (parseError) {
      throw new Error('GitHub file does not contain valid JSON data')
    }
  } catch (error) {
    console.error('Error fetching GitHub data:', error)
    throw error
  }
}

export async function fetchGenericJsonData(jsonUrl) {
  try {
    // Validate URL format
    const url = new URL(jsonUrl)

    const response = await fetch(jsonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      mode: 'cors'
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('JSON file not found. Please check the URL and try again.')
      } else if (response.status === 403) {
        throw new Error('JSON file access denied.')
      } else {
        throw new Error(`Failed to fetch JSON data (${response.status})`)
      }
    }

    const text = await response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('JSON file is empty or contains no data')
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch (parseError) {
      throw new Error('File does not contain valid JSON data')
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      throw new Error(
        'JSON file cannot be fetched due to CORS restrictions. ' +
        'Please ensure the server allows cross-origin requests or download the file manually.'
      )
    }
    console.error('Error fetching JSON data:', error)
    throw error
  }
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}