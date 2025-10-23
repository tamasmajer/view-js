// Test: Reactive Bindings and Updates
export default async (View, { test, assert, wait }) => {
  console.group('🔄 Reactive Bindings')

  await test('reactive property binding', async () => {
    const IsActive = View(false)
    const { div } = View
    const elem = div({ class: () => IsActive() ? 'active' : 'inactive' })
    document.body.appendChild(elem)
    await wait(50)
    assert.equal(elem.className, 'inactive')
    IsActive(true)
    await wait(50)
    assert.equal(elem.className, 'active')
    document.body.removeChild(elem)
  })

  await test('reactive text content', async () => {
    const Count = View(0)
    const { span } = View
    const elem = span(() => `Count: ${Count()}`)
    document.body.appendChild(elem)
    await wait(50)
    assert.equal(elem.textContent, 'Count: 0')
    Count(5)
    await wait(50)
    assert.equal(elem.textContent, 'Count: 5')
    document.body.removeChild(elem)
  })

  await test('multiple reactive dependencies', async () => {
    const First = View('John')
    const Last = View('Doe')
    const { span } = View
    const elem = span(() => `${First()} ${Last()}`)
    document.body.appendChild(elem)
    await wait(50)
    assert.equal(elem.textContent, 'John Doe')
    First('Jane')
    await wait(50)
    assert.equal(elem.textContent, 'Jane Doe')
    Last('Smith')
    await wait(50)
    assert.equal(elem.textContent, 'Jane Smith')
    document.body.removeChild(elem)
  })

  await test('multiple reactive dependencies', async () => {
    const Show = View(false)
    const { div } = View
    const container = div(() => Show() && div('Visible'))
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.children.length, 0)
    Show(true)
    await wait(50)
    assert.equal(container.children.length, 1)
    document.body.removeChild(container)
  })

  await test('zero value rendering', () => {
    const { div } = View
    const elem = div(0)
    assert.equal(elem.textContent, '0')
  })

  console.groupEnd()
}
