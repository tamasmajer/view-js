// Test: Tag Creation and Composition
export default async (View, { test, assert }) => {
  console.group('🏷️ Tags and Composition')

  await test('create basic tags', () => {
    const { div, span, button, input } = View
    assert.equal(div().tagName, 'DIV')
    assert.equal(span().tagName, 'SPAN')
    assert.equal(button().tagName, 'BUTTON')
    assert.equal(input().tagName, 'INPUT')
  })

  await test('tags with properties', () => {
    const { div } = View
    const elem = div({ class: 'test', id: 'myDiv' })
    assert.equal(elem.className, 'test')
    assert.equal(elem.id, 'myDiv')
  })

  await test('tags with children', () => {
    const { div, span } = View
    const elem = div(span('Child 1'), span('Child 2'))
    assert.equal(elem.children.length, 2)
    assert.equal(elem.children[0].textContent, 'Child 1')
  })

  await test('nested tag composition', () => {
    const { div, p, span } = View
    const elem = div(
      p('Paragraph'),
      div(span('Nested'))
    )
    assert.equal(elem.children.length, 2)
    assert.equal(elem.children[0].tagName, 'P')
    assert.equal(elem.children[1].tagName, 'DIV')
  })

  await test('tags with mixed content', () => {
    const { div } = View
    const elem = div({ class: 'container' }, 'Text', div('Child'))
    assert.equal(elem.className, 'container')
    assert.truthy(elem.textContent.includes('Text'))
    assert.equal(elem.children.length, 1)
  })

  await test('array of children', () => {
    const { div } = View
    const items = ['A', 'B', 'C']
    const elem = div(items.map(item => div(item)))
    assert.equal(elem.children.length, 3)
  })

  await test('custom element properties', () => {
    const { input } = View
    const field = input({ type: 'text', placeholder: 'Enter text' })
    assert.equal(field.type, 'text')
    assert.equal(field.placeholder, 'Enter text')
  })

  console.groupEnd()
}
