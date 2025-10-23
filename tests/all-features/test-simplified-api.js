// Test: Simplified API with Debug Logging
export default async (View, { test, assert, wait, createMockFetch }) => {
  const fetch = createMockFetch(100)
  console.group('🔍 Simplified API - Debug')

  await test('LocalStorage destructuring - step by step', () => {
    console.log('Step 1: Destructure LocalStorage from View')
    const { LocalStorage } = View
    console.log('LocalStorage type:', typeof LocalStorage)
    console.log('LocalStorage:', LocalStorage)

    if (typeof LocalStorage === 'object') {
      console.log('Step 2: Call LocalStorage() to get storage proxy')
      const storage = LocalStorage
      console.log('storage type:', typeof storage)
      console.log('storage:', storage)

      console.log('Step 3: Try to destructure Settings from storage')
      try {
        const { Settings } = storage
        console.log('Settings type:', typeof Settings)
        console.log('Settings:', Settings)

        if (typeof Settings === 'function') {
          Settings({ theme: 'dark' })
          console.log('Settings() after set:', Settings())
        } else {
          console.error('Settings is not a function, it is:', typeof Settings)
        }
      } catch (err) {
        console.error('Error destructuring Settings:', err)
      }
    } else {
      console.error('LocalStorage is not a function, it is:', typeof LocalStorage)
    }
  })

  await test('LocalStorage with prefix - step by step', () => {
    console.log('Step 1: Get LocalStorage')
    const { LocalStorage } = View
    console.log('LocalStorage:', LocalStorage)

    console.log('Step 2: Call LocalStorage with prefix')
    try {
      const UserStorage = View(localStorage, 'user/')
      console.log('UserStorage type:', typeof UserStorage)
      console.log('UserStorage:', UserStorage)

      console.log('Step 3: Destructure from UserStorage')
      const { Settings } = UserStorage
      console.log('Settings type:', typeof Settings)
      console.log('Settings:', Settings)
    } catch (err) {
      console.error('Error:', err)
    }
  })

  await test('DomParser - step by step', () => {
    console.log('Step 1: Get DomParser')
    const { DomParser } = View
    console.log('DomParser type:', typeof DomParser)
    console.log('DomParser:', DomParser)

    console.log('\nStep 2: Call DomParser with HTML string')
    try {
      const html = '<html><body><template View="Card"><div View="Title">Test</div></template></body></html>'
      console.log('HTML:', html.substring(0, 50) + '...')

      const Templates = DomParser(html)
      console.log('Templates type:', typeof Templates)
      console.log('Templates:', Templates)

      console.log('\nStep 3: Call Templates() to get parsed document')
      const doc = Templates()
      console.log('doc:', doc)
      console.log('doc.nodeType:', doc?.nodeType)

      console.log('\nStep 4: Extract Card template')
      const { Card } = Templates
      console.log('Card type:', typeof Card)
      console.log('Card:', Card)

      if (Card) {
        console.log('\nStep 5: Create instance')
        const instance = Card({ Title: 'Hello' })
        console.log('instance:', instance)
        console.log('instance.textContent:', instance.textContent)
      }
    } catch (err) {
      console.error('Error:', err)
      console.error('Stack:', err.stack)
    }
  })

  await test('Fetch - step by step', () => {
    console.log('Step 1: Get Fetch')
    // const { Fetch } = View
    const Fetch = View(fetch)
    console.log('Fetch type:', typeof Fetch)
    console.log('Fetch:', Fetch)

    console.log('Step 2: Call Fetch with URL')
    try {
      const Users = Fetch('/users')
      console.log('Users type:', typeof Users)
      console.log('Users:', Users)
    } catch (err) {
      console.error('Error:', err)
    }
  })

  await test('Window - step by step', () => {
    console.log('Step 1: Get Window')
    const { Window } = View
    console.log('Window type:', typeof Window)
    console.log('Window:', Window)

    console.log('Step 2: Call Window() - should return window object')
    try {
      const result = Window()
      console.log('result type:', typeof result)
      console.log('result:', result)
      console.log('result === window:', result === window)

      // If it's a function, it's wrapped - get the actual value
      if (typeof result === 'function') {
        console.log('Result is function, checking if it has VALUE property')
        const actualValue = result.value || result()
        console.log('actualValue:', actualValue)
        console.log('actualValue === window:', actualValue === window)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  })

  await test('Document - step by step', () => {
    console.log('Step 1: Get Document')
    const { Document } = View
    console.log('Document type:', typeof Document)
    console.log('Document:', Document)

    console.log('Step 2: Call Document() - should return document object')
    try {
      const result = Document()
      console.log('result type:', typeof result)
      console.log('result:', result)
      console.log('result === document:', result === document)
      console.log('result.nodeType:', result?.nodeType)

      // If it's a function, it's wrapped - get the actual value
      if (typeof result === 'function') {
        console.log('Result is function, checking if it has VALUE property')
        const actualValue = result.value || result()
        console.log('actualValue:', actualValue)
        console.log('actualValue === document:', actualValue === document)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  })

  await test('Check what View.LocalStorage returns directly', () => {
    console.log('Direct access: View.LocalStorage')
    console.log('type:', typeof View.LocalStorage)
    console.log('value:', View.LocalStorage)

    // Try calling it
    try {
      const result = View.LocalStorage
      console.log('View.LocalStorage() type:', typeof result)
      console.log('View.LocalStorage():', result)
    } catch (err) {
      console.error('Error calling View.LocalStorage():', err)
    }
  })

  await test('Window - correct usage patterns', () => {
    console.log('=== Window API Usage ===')
    const { Window } = View

    console.log('1. Window is a function')
    console.log('typeof Window:', typeof Window)
    assert.truthy(typeof Window === 'function')

    console.log('\n2. Window() returns the actual window object')
    const result = Window()
    console.log('typeof Window():', typeof result)
    console.log('Window() === window:', result === window)
    assert.equal(result, window, 'Window() should return the actual window object')

    console.log('\n3. Window({ props }) binds properties and returns window')
    let resized = false
    const boundWindow = Window({ onresize: () => { resized = true } })
    console.log('Window({...}) === window:', boundWindow === window)
    assert.equal(boundWindow, window, 'Window with bindings should return window')

    window.dispatchEvent(new Event('resize'))
    console.log('Event binding works:', resized)
    assert.truthy(resized, 'Event handler should have fired')
  })

  await test('Document - correct usage patterns', () => {
    console.log('=== Document API Usage ===')
    const { Document } = View

    console.log('1. Document() returns the actual document object')
    assert.equal(Document(), document, 'Document() should return the actual document')

    console.log('\n2. Document({ props }) binds properties and returns document')
    let clicked = false
    const boundDoc = Document({ onclick: () => { clicked = true } })
    assert.equal(boundDoc, document, 'Document with bindings should return document')

    document.dispatchEvent(new Event('click'))
    console.log('Event binding works:', clicked)
    assert.truthy(clicked, 'Event handler should have fired')
  })

  await test('Window binding - should work like View(window)', () => {
    console.log('=== Testing Window() behavior ===')
    const { Window } = View

    console.log('Step 1: Call Window() with no args')
    const wrappedWindow = Window()
    console.log('wrappedWindow type:', typeof wrappedWindow)

    console.log('Step 2: Access .value property')
    console.log('wrappedWindow.value:', wrappedWindow.value)
    console.log('wrappedWindow.value === window:', wrappedWindow.value === window)

    console.log('Step 3: Bind event handler')
    let resized = false
    try {
      Window({ onresize: () => { resized = true } })
      window.dispatchEvent(new Event('resize'))
      console.log('Event binding works:', resized)
    } catch (err) {
      console.error('Error binding:', err)
    }
  })

  await test('Compare old vs new localStorage API', async () => {
    console.log('=== OLD API (should work) ===')
    const storage1 = View(localStorage)
    console.log('View(localStorage) type:', typeof storage1)
    const { OldSettings } = storage1
    console.log('OldSettings type:', typeof OldSettings)
    OldSettings({ test: 'old' })
    await wait(50)
    console.log('OldSettings():', OldSettings())

    console.log('\n=== NEW API (testing) ===')
    try {
      const { LocalStorage } = View
      console.log('LocalStorage type:', typeof LocalStorage)
      const storage2 = LocalStorage
      console.log('LocalStorage() type:', typeof storage2)
      const { NewSettings } = storage2
      console.log('NewSettings type:', typeof NewSettings)
    } catch (err) {
      console.error('Error with new API:', err)
    }
  })

  console.groupEnd()
}