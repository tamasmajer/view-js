/**
 * Test Helpers for ViewJs
 * Reusable utilities for testing ViewJs applications
 */

/**
 * Creates a mock fetch function for testing remote views
 * @param {number} delay - Delay in milliseconds before resolving (default: 500)
 * @returns {Function} Mock fetch function
 */
export const createMockFetch = (delay = 500) => {
  return function fetch(url, options) {
    console.log('Mock fetch:', url, options)

    return new Promise((resolve) => {
      setTimeout(() => {
        let data = { success: true }

        // Parse URL patterns and return appropriate mock data
        if (url.includes('/users/')) {
          const userId = url.match(/\/users\/(\d+)/)?.[1]
          data = {
            id: parseInt(userId),
            name: `User ${userId}`,
            email: `user${userId}@example.com`
          }
        } else if (url.includes('/users')) {
          data = [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
            { id: 3, name: 'Bob Smith', email: 'bob@example.com' }
          ]
        } else if (url.includes('/posts/')) {
          const postId = url.match(/\/posts\/(\d+)/)?.[1]
          data = {
            id: parseInt(postId),
            title: `Post ${postId}`,
            content: 'Lorem ipsum dolor sit amet'
          }
        } else if (url.includes('/search')) {
          const query = new URLSearchParams(url.split('?')[1])
          data = {
            results: ['Result 1', 'Result 2', 'Result 3'],
            query: query.toString()
          }
        } else if (url.includes('/auth')) {
          const authHeader = options?.headers?.Authorization
          data = {
            authenticated: !!authHeader,
            users: authHeader ? ['User A', 'User B'] : [],
            auth: authHeader
          }
        } else if (url.includes('/docs/')) {
          const docId = url.match(/\/docs\/(\d+)/)?.[1]
          const body = options?.body ? JSON.parse(options.body) : null
          data = {
            id: parseInt(docId),
            title: `Document ${docId}`,
            body: body,
            method: options?.method || 'GET'
          }
        } else if (options?.method === 'POST') {
          const body = options?.body ? JSON.parse(options.body) : null
          data = {
            success: true,
            message: 'Data posted successfully',
            posted: body
          }
        } else if (options?.method === 'PUT') {
          const body = options?.body ? JSON.parse(options.body) : null
          data = {
            success: true,
            message: 'Data updated successfully',
            updated: body
          }
        } else if (options?.method === 'DELETE') {
          data = {
            success: true,
            message: 'Data deleted successfully'
          }
        }

        resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify(data)),
          json: () => Promise.resolve(data)
        })
      }, delay)
    })
  }
}

/**
 * Creates a mock fetch that can fail
 * @param {number} delay - Delay before failing
 * @param {number} status - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @returns {Function} Mock fetch function that fails
 */
export const createFailingMockFetch = (delay = 500, status = 500, message = 'Internal Server Error') => {
  return (url, options) => {
    console.log('Mock fetch (will fail):', url, options)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: false,
          status: status,
          text: () => Promise.resolve(JSON.stringify({ error: message })),
          json: () => Promise.resolve({ error: message })
        })
      }, delay)
    })
  }
}

/**
 * Creates a mock fetch that times out
 * @returns {Function} Mock fetch function that never resolves
 */
export const createTimeoutMockFetch = () => {
  return (url, options) => {
    console.log('Mock fetch (timeout):', url, options)
    return new Promise(() => { }) // Never resolves
  }
}

/**
 * Install mock fetch globally
 * @param {Function} mockFetch - The mock fetch function to install
 * @returns {Function} Restore function to revert to original fetch
 */
export const installMockFetch = (mockFetch) => {
  const originalFetch = window.fetch
  window.fetch = mockFetch
  return () => {
    window.fetch = originalFetch
  }
}

/**
 * Creates a mock localStorage for testing
 * @returns {Object} Mock localStorage implementation
 */
export const createMockLocalStorage = () => {
  const storage = {}
  return {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value },
    removeItem: (key) => { delete storage[key] },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key])
    },
    get length() { return Object.keys(storage).length },
    key: (index) => Object.keys(storage)[index] || null
  }
}

/**
 * Wait helper for async tests
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Assertion helpers
 */
export const assert = {
  equal: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`)
    }
  },
  notEqual: (actual, expected, message) => {
    if (actual === expected) {
      throw new Error(message || `Expected not to equal ${expected}`)
    }
  },
  truthy: (value, message) => {
    if (!value) {
      throw new Error(message || `Expected truthy value but got ${value}`)
    }
  },
  falsy: (value, message) => {
    if (value) {
      throw new Error(message || `Expected falsy value but got ${value}`)
    }
  },
  deepEqual: (actual, expected, message) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`)
    }
  }
}

/**
 * Test runner helper
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export const test = async (name, fn) => {
  try {
    await fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(error)
  }
}
