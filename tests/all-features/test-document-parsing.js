// Test: Document Parsing
export default async (View, { test, assert, wait }) => {
  console.group('📄 Document Parsing')

  await test('parse static HTML string', () => {
    const html = '<html><body><template View="Card"><div View="Title">Test</div></template></body></html>'
    const Doc = View(DOMParser, html)
    assert.truthy(Doc().nodeType === 9) // Document node
    const { Card } = Doc
    assert.truthy(Card)
  })

  await test('parse and use template', () => {
    const html = '<html><body><template View="UserCard"><h2 View="Name">Name</h2></template></body></html>'
    const Doc = View(DOMParser, html)
    const { UserCard } = Doc
    const instance = UserCard({ Name: 'John Doe' })
    assert.truthy(instance.textContent.includes('John Doe'))
  })

  await test('parse from html string', async () => {
    const Html = View('<html><body><template View="Item"><span View="Text">Text</span></template></body></html>')
    const Doc = View(DOMParser, Html)
    await wait(50)
    const { Item } = Doc
    assert.truthy(Item)
    const instance = Item({ Text: 'Hello' })
    assert.truthy(instance.textContent.includes('Hello'))
  })

  await test('parse from reactive function', async () => {
    const Source = View('<html><body><template View="Card"><div View="Content">A</div></template></body></html>')
    const Doc = View(DOMParser, () => Source())
    await wait(50)
    const { Card } = Doc
    let instance = Card({ Content: 'First' })
    assert.truthy(instance.textContent.includes('First'))
  })

  await test('parse from fetch view', async () => {
    // Mock fetch that returns HTML
    function fetch() {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><body><template View="Remote"><p View="Text">Remote</p></template></body></html>')
      })
    }
    const Fetch = View(fetch)
    // const originalFetch = window.fetch
    // View({ window, fetch: mockFetch }) // Local fetch mock
    // window.fetch = mockFetch

    const Html = Fetch('/templates.html')
    const Doc = View(DOMParser, Html)

    await wait(150)
    const { Remote } = Doc
    assert.truthy(Remote)
    const instance = Remote({ Text: 'Loaded' })
    assert.truthy(instance.textContent.includes('Loaded'))

    // View({ window })
    // window.fetch = originalFetch
  })

  await test('multiple templates in one document', () => {
    const html = `
      <html><body>
        <template View="Card"><div View="Title">Title</div></template>
        <template View="List"><ul View="Items"></ul></template>
        <template View="Form"><input View="Field" /></template>
      </body></html>
    `
    const Doc = View(DOMParser, html)
    const { Card, List, Form } = Doc
    assert.truthy(Card)
    assert.truthy(List)
    assert.truthy(Form)
  })

  await test('reactive update when source changes', async () => {
    const Html = View('<html><body><template View="Dynamic"><span View="Val">1</span></template></body></html>')
    const Doc = View(DOMParser, () => Html())

    await wait(50)
    let { Dynamic } = Doc
    let instance1 = Dynamic({ Val: 'A' })
    assert.truthy(instance1.textContent.includes('A'))

    Html('<html><body><template View="Dynamic"><span View="Val">2</span></template></body></html>')
    await wait(50)

    // Get fresh reference after update
    const Doc2 = View(DOMParser, () => Html())
    await wait(50)
    const { Dynamic: Dynamic2 } = Doc2
    let instance2 = Dynamic2({ Val: 'B' })
    assert.truthy(instance2.textContent.includes('B'))
  })

  await test('handle malformed HTML gracefully', () => {
    const html = '<<invalid><template View="Test">Content</template>'
    const Doc = View(DOMParser, html)
    assert.truthy(Doc().nodeType === 9) // Still returns document
  })

  await test('handle empty string', () => {
    const Doc = View(DOMParser, '')
    assert.equal(Doc(), undefined)
  })

  await test('handle undefined/null', () => {
    const Doc = View(DOMParser, null)
    assert.equal(Doc(), undefined)
  })

  await test('nested templates', () => {
    const html = `
    <html><body>
      <template View="Outer">
        <div View="Container">
          <span View="Text">Text</span>
        </div>
      </template>
    </body></html>
  `
    const Doc = View(DOMParser, html)
    const { Outer } = Doc
    assert.truthy(Outer)
    const { Text } = Outer
    assert.truthy(Text)
    const instance = Text('hello')
    assert.truthy(instance.textContent.includes('hello'))
  })

  console.groupEnd()
}