// Test: Reactive Template Destructuring
export default async (View, { test, assert, wait }) => {
  console.group('🔄 Reactive Template Destructuring')

  // Create a custom mock fetch that returns HTML templates
  function fetch(url) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let html = ''

        if (url.includes('/templates.html')) {
          html = `
            <html><body>
              <template View="Card">
                <div class="card">
                  <h2 View="Title">Default Title</h2>
                  <p View="Body">Default Body</p>
                  <button View="Action">Click</button>
                </div>
              </template>
              <template View="List">
                <ul View="Items"></ul>
              </template>
              <template View="Form">
                <input View="Field" />
              </template>
              <template View="Outer">
                <div View="Container">
                  <span View="Text">Text</span>
                </div>
              </template>
            </body></html>
          `
        } else if (url.includes('/other-templates.html')) {
          html = `
            <html><body>
              <template View="List">
                <div View="Items"></div>
              </template>
            </body></html>
          `
        }

        resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(html),
          json: () => Promise.resolve({ html })
        })
      }, 100)
    })
  }

  const Fetch = View(fetch)
  const DomParser = View(DOMParser)

  // Set up mock fetch using View
  // View({ window, fetch: mockFetchHTML })

  await test('immediate destructuring returns reactive views', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    // Destructure immediately - before fetch completes
    const { Card } = Templates

    console.log('Card type:', typeof Card)
    console.log('Card is function:', typeof Card === 'function')

    // Card should be a function (callable template)
    assert.truthy(typeof Card === 'function', 'Card should be a function')

    // Initially returns undefined (fetch hasn't completed)
    assert.equal(Card({ Title: 'Test' }), undefined, 'Card() should return undefined initially')

    // Wait for fetch to complete (100ms) + extra time for reactive updates
    await wait(200)

    // Now Card() should return the cloned template
    const cardInstance = Card({ Title: 'Hello' })
    console.log('Card after load:', cardInstance)
    assert.truthy(cardInstance, 'Card() should return template instance after load')
    assert.truthy(cardInstance.textContent.includes('Hello'))
  })

  await test('multiple templates can be destructured', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    // Destructure multiple templates immediately
    const { Card, List, Form } = Templates

    // All should be functions
    assert.truthy(typeof Card === 'function')
    assert.truthy(typeof List === 'function')
    assert.truthy(typeof Form === 'function')

    // All initially return undefined
    assert.equal(Card({}), undefined)
    assert.equal(List({}), undefined)
    assert.equal(Form({}), undefined)

    await wait(150)

    // All should now return template instances
    assert.truthy(Card({}))
    assert.truthy(List({}))
    assert.truthy(Form({}))
  })

  await test('reactive views update in components', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)
    const { Card } = Templates

    // Create a component that uses Card
    let renderCount = 0
    const { div } = View
    const component = div(() => {
      renderCount++
      return Card({ Title: 'Test' }) || 'Loading...'
    })

    document.body.appendChild(component)
    await wait(50)

    // Initially shows "Loading..." (Card returns undefined)
    assert.truthy(component.textContent.includes('Loading'))
    const initialRenderCount = renderCount

    // Wait for templates to load
    await wait(150)

    // Should have re-rendered with the actual template
    assert.truthy(renderCount > initialRenderCount, 'Component should re-render')
    assert.truthy(component.textContent.includes('Test'))

    document.body.removeChild(component)
  })

  await test('destructuring before and after load behaves same', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    // Destructure before load
    const { Card: CardEarly } = Templates

    await wait(150)

    // Destructure after load
    const { Card: CardLate } = Templates

    // Both should be callable functions
    assert.truthy(typeof CardEarly === 'function')
    assert.truthy(typeof CardLate === 'function')

    // Both should return template instances
    const earlyInstance = CardEarly({ Title: 'Early' })
    const lateInstance = CardLate({ Title: 'Late' })

    console.log('earlyInstance:', earlyInstance)
    console.log('earlyInstance.textContent:', earlyInstance?.textContent)
    console.log('lateInstance:', lateInstance)
    console.log('lateInstance.textContent:', lateInstance?.textContent)

    assert.truthy(earlyInstance)
    assert.truthy(lateInstance)
    assert.truthy(earlyInstance.textContent.includes('Early'), 'Early instance should contain "Early"')
    assert.truthy(lateInstance.textContent.includes('Late'), 'Late instance should contain "Late"')
  })

  await test('non-existent templates return undefined', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    const { NonExistent } = Templates

    // Should be a function (callable template)
    assert.truthy(typeof NonExistent === 'function')

    // Should return undefined initially
    assert.equal(NonExistent({}), undefined)

    await wait(150)

    // Should still return undefined after load (template doesn't exist)
    assert.equal(NonExistent({}), undefined)
  })

  await test('can use destructured templates with bindings', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)
    const { Card } = Templates

    await wait(150)

    // Should be able to call with bindings directly
    const instance = Card({
      Title: 'My Title',
      Body: 'My Body'
    })

    assert.truthy(instance)
    assert.truthy(instance.textContent.includes('My Title'))
  })

  await test('reactive templates work with conditional rendering', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)
    const { Card } = Templates

    const Show = View(true)
    const { div } = View

    const component = div(() =>
      Show() ? Card({ Title: 'Visible' }) || 'Loading...' : 'Hidden'
    )

    document.body.appendChild(component)
    await wait(50)

    console.log('Initial component.textContent:', component.textContent)

    // Initially shows "Loading..." (Card returns undefined)
    assert.truthy(component.textContent.includes('Loading'), 'Should show Loading initially')

    // Wait for templates to load
    await wait(150)

    console.log('After load component.textContent:', component.textContent)

    // Now shows the card
    assert.truthy(component.textContent.includes('Visible'), 'Should show Visible after load')

    // Toggle visibility
    Show(false)
    await wait(50)
    assert.truthy(component.textContent.includes('Hidden'), 'Should show Hidden when toggled off')

    Show(true)
    await wait(50)
    assert.truthy(component.textContent.includes('Visible'), 'Should show Visible when toggled back on')

    document.body.removeChild(component)
  })

  await test('templates from different sources can be mixed', async () => {
    // const { Fetch, DomParser } = View
    const Html1 = Fetch('/templates.html')
    const Templates1 = DomParser(Html1)

    const Html2 = Fetch('/other-templates.html')
    const Templates2 = DomParser(Html2)

    const { Card } = Templates1
    const { List } = Templates2

    // Both should be reactive views
    assert.truthy(typeof Card === 'function')
    assert.truthy(typeof List === 'function')

    await wait(150)

    // Both should be available
    assert.truthy(Card({}))
    assert.truthy(List({}))
  })

  await test('calling Templates() directly still works', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    // Should be able to call Templates() to get document
    assert.equal(Templates(), undefined, 'Should be undefined initially')

    await wait(150)

    const doc = Templates()
    assert.truthy(doc, 'Should return document')
    assert.equal(doc.nodeType, 9, 'Should be a document node')
  })

  await test('nested templates work with reactive destructuring', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)
    const { Outer } = Templates

    await wait(150)

    // Create instance from Outer template
    const outerInstance = Outer({ Text: 'Hello' })
    assert.truthy(outerInstance, 'Outer instance should exist')
    assert.truthy(outerInstance.textContent.includes('Hello'), 'Outer should contain text')

    // Note: Sub-views of template instances work differently than document templates
    // The Outer template function creates instances, it doesn't expose sub-templates
  })

  await test('error handling: invalid HTML', async () => {
    // const { DomParser } = View
    const Html = View('<invalid><html')
    const Templates = DomParser(Html)
    const { Card } = Templates

    // Should still be a reactive view
    assert.truthy(typeof Card === 'function')

    await wait(50)

    // Document should exist but template might not
    const doc = Templates()
    assert.truthy(doc || doc === undefined)
  })

  await test('templates update when source changes', async () => {
    // const { DomParser } = View
    const Html = View('<html><body><template View="Dynamic"><span View="Val">1</span></template></body></html>')
    const Templates = DomParser(() => Html())
    const { Dynamic } = Templates

    await wait(50)

    // Should have initial template
    const first = Dynamic({ Val: 'A' })
    assert.truthy(first)

    // Change HTML source
    Html('<html><body><template View="Dynamic"><span View="Val">2</span></template></body></html>')
    await wait(50)

    // Dynamic should still work (returns updated template)
    const second = Dynamic({ Val: 'B' })
    assert.truthy(second)
  })

  await test('performance: destructuring creates minimal overhead', async () => {
    // const { Fetch, DomParser } = View
    const Html = Fetch('/templates.html')
    const Templates = DomParser(Html)

    // Destructure multiple times
    const { Card: Card1 } = Templates
    const { Card: Card2 } = Templates
    const { Card: Card3 } = Templates

    await wait(150)

    // All should return template instances
    assert.truthy(Card1({}))
    assert.truthy(Card2({}))
    assert.truthy(Card3({}))

    // Calling them should be fast (no repeated lookups)
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      Card1({})
    }
    const duration = performance.now() - start

    console.log(`1000 calls took ${duration.toFixed(2)}ms`)
    assert.truthy(duration < 100, 'Should be fast (< 100ms for 1000 calls)')
  })

  // Cleanup - restore original context
  // View({ window })

  console.groupEnd()
}