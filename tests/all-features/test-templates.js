// Test: Templates and Elements
export default async (View, { test, assert }) => {
  console.group('📄 Templates & Elements')

  // Setup test HTML
  const testContainer = document.createElement('div')
  testContainer.innerHTML = `
    <div View="TestElement">Original</div>
    <template View="TestTemplate">
      <div View="Title">Title</div>
      <span View="Content">Content</span>
    </template>
  `
  document.body.appendChild(testContainer)

  await test('access element view', () => {
    const { TestElement } = View
    assert.truthy(TestElement)
    assert.equal(TestElement().textContent, 'Original')
  })

  await test('update element view', () => {
    const { TestElement } = View
    TestElement('Updated')
    assert.equal(TestElement().textContent, 'Updated')
  })

  await test('template creates clone', () => {
    const { TestTemplate } = View
    const instance = TestTemplate({ Title: 'Hello', Content: 'World' })
    assert.truthy(instance)
    // Check it's a DOM element
    assert.truthy(instance.nodeType)
  })

  await test('template sub-elements', () => {
    const { TestTemplate } = View
    assert.truthy(TestTemplate.Title)
    assert.truthy(TestTemplate.Content)
  })

  await test('create tag elements', () => {
    const { div, span } = View
    const elem = div({ class: 'test' }, 'Hello')
    assert.equal(elem.tagName, 'DIV')
    assert.equal(elem.className, 'test')
  })

  document.body.removeChild(testContainer)
  console.groupEnd()
}
