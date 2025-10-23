// Test: List Rendering and Array Operations
export default async (View, { test, assert, wait }) => {
  console.group('📝 Lists and Arrays')

  await test('render empty list', () => {
    const Items = View([])
    const { div } = View
    const container = div(() =>
      Items().length === 0 ? div('Empty') : Items().map(i => div(i))
    )
    document.body.appendChild(container)
    assert.equal(container.textContent, 'Empty')
    document.body.removeChild(container)
  })

  await test('add items to list', async () => {
    const Items = View(['A'])
    const { div } = View
    const container = div(() => Items().map(item => div(item)))
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 1)
    Items(['A', 'B'])  // Reactive re-render with new array
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 2)  // Should now have 2 total
    document.body.removeChild(container)
  })

  await test('remove items from list', async () => {
    const Items = View(['A', 'B', 'C'])
    const { div } = View
    const container = div(() => Items().map(item => div(item)))
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 3)
    Items(['A', 'C'])  // Update to filtered array
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 2)  // Should now have 2 total
    document.body.removeChild(container)
  })

  await test('update list item', async () => {
    const Items = View([{ id: 1, name: 'A' }])
    const { div } = View
    const container = div(() => Items().map(item => div(item.name)))
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.children[0].textContent, 'A')
    Items([{ id: 1, name: 'Updated' }])
    await wait(50)
    assert.equal(container.children[0].textContent, 'Updated')
    document.body.removeChild(container)
  })

  await test('render list with keys', async () => {
    const Items = View([
      { id: 1, text: 'First' },
      { id: 2, text: 'Second' }
    ])
    const { div } = View
    const container = div(() =>
      Items().map(item => div({ 'data-id': item.id }, item.text))
    )
    document.body.appendChild(container)
    await wait(50)
    const items = container.querySelectorAll('[data-id]')
    assert.equal(items.length, 2)
    assert.equal(items[0].getAttribute('data-id'), '1')
    document.body.removeChild(container)
  })

  await test('nested list rendering', async () => {
    const Groups = View([
      { name: 'Group 1', items: ['A', 'B'] },
      { name: 'Group 2', items: ['C', 'D'] }
    ])
    const { div } = View
    const container = div(() =>
      Groups().map(group =>
        div(
          div(group.name),
          ...group.items.map(item => div(item))
        )
      )
    )
    document.body.appendChild(container)
    await wait(50)
    // Should have: 2 group wrappers + 2 name divs + 4 item divs = 8 total
    const allDivs = container.querySelectorAll('div')
    assert.truthy(allDivs.length >= 6) // At least 2 groups * 3 divs each
    document.body.removeChild(container)
  })

  await test('list with template instances', async () => {
    const setupContainer = document.createElement('div')
    setupContainer.innerHTML = '<template View="Item"><span View="Text"></span></template>'
    document.body.appendChild(setupContainer)

    const Items = View(['A', 'B', 'C'])
    const { Item, div } = View
    const container = div(() => Items().map(text => Item({ Text: text })))
    document.body.appendChild(container)
    await wait(50)
    const spans = container.querySelectorAll('span')
    assert.equal(spans.length, 3)

    document.body.removeChild(container)
    document.body.removeChild(setupContainer)
  })

  console.groupEnd()
}
