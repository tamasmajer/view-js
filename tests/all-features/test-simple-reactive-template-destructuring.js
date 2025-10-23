// Test: Simple Reactive Template Destructuring - The Real Use Case
export default async (View, { test, assert, wait }) => {
  console.group('🎯 Simple Reactive Template Test')

  // Create a custom mock fetch that returns HTML templates
  function fetch(url) {
    console.log('fetch url:', url)
    return new Promise((resolve) => {
      setTimeout(() => {
        const html = `
          <html><body>
            <template View="Card">
              <div class="card">
                <h2 View="Title">Default Title</h2>
                <p View="Body">Default Body</p>
              </div>
            </template>
          </body></html>
        `
        console.log('resolve')
        resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(html)
        })
      }, 100)
    })
  }

  // const Fetch = View(fetch)
  // const DomParser = View(DOMParser)
  const { DomParser } = View
  const Fetch = View(fetch)

  // Set up mock fetch
  // View({ window, fetch: mockFetchHTML })

  await test('THE BASE CASE: destructure and use immediately', async () => {
    const { div } = View
    // const Fetch = View(mockFetchHTML)
    // const DomParser = View(DOMParser)

    // This is the pattern we want to work
    const { Card } = View(DOMParser, Fetch({ url: '/templates.html' }))

    // Use it in a component
    const App = div(() => Card({ Title: 'Loaded!' }) || 'Loading...')

    document.body.appendChild(App)

    // Initially shows "Loading..." because templates haven't loaded yet
    await wait(50)
    console.log('Before load:', App.textContent)
    assert.truthy(App.textContent.includes('Loading'), 'Should show Loading initially')

    // Wait for templates to load
    await wait(150)

    // Now shows the card with "Loaded!"
    console.log('After load:', App.textContent)
    assert.truthy(App.textContent.includes('Loaded'), 'Should show Loaded! after templates arrive')

    document.body.removeChild(App)
  })

  await test('Card can be called multiple times with different data', async () => {
    // const { Fetch, DomParser } = View
    // const Fetch = View(mockFetchHTML)
    // const DomParser = View(DOMParser)

    const { Card } = DomParser(Fetch('/templates.html'))

    await wait(200) // Wait for templates to load
    console.log('Card', Card)

    // Create multiple instances with different data
    const card1 = Card({ Title: 'First Card', Body: 'Content 1' })
    const card2 = Card({ Title: 'Second Card', Body: 'Content 2' })
    const card3 = Card({ Title: 'Third Card', Body: 'Content 3' })

    assert.truthy(card1.textContent.includes('First Card'))
    assert.truthy(card2.textContent.includes('Second Card'))
    assert.truthy(card3.textContent.includes('Third Card'))
  })

  await test('Works with reactive data that changes', async () => {
    const { div } = View
    const { Card } = DomParser(Fetch('/templates.html'))

    const Title = View('Initial')

    const App = div(() => Card({ Title: Title() }) || 'Loading...')
    document.body.appendChild(App)

    await wait(200) // Wait for templates to load

    assert.truthy(App.textContent.includes('Initial'))

    // Change the data
    Title('Updated')
    await wait(50)

    assert.truthy(App.textContent.includes('Updated'))

    document.body.removeChild(App)
  })

  await test('Non-existent template returns undefined', async () => {
    // const { Fetch, DomParser } = View
    const { NonExistent } = DomParser(Fetch('/templates.html'))

    await wait(200)

    // Should return undefined because template doesn't exist
    const result = NonExistent({ Title: 'Test' })
    assert.equal(result, undefined)
  })

  await test('Can destructure before templates load', async () => {
    // const { Fetch, DomParser } = View

    // Destructure immediately - templates haven't loaded yet
    const { Card } = DomParser(Fetch('/templates.html'))

    // Card is a function, but returns undefined until templates load
    assert.truthy(typeof Card === 'function')
    assert.equal(Card({ Title: 'Test' }), undefined)

    // Wait for templates to load
    await wait(200)

    // Now it works
    const instance = Card({ Title: 'Now Works!' })
    assert.truthy(instance)
    assert.truthy(instance.textContent.includes('Now Works'))
  })

  // Cleanup
  // View({ window })

  console.groupEnd()
}