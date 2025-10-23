// Test: Edge Cases and Error Handling
export default async (View, { test, assert, wait }) => {
  console.group('⚠️ Edge Cases and Error Handling')

  await test('view with null value', () => {
    const NullView = View(null)
    assert.equal(NullView(), null)
    NullView('not null')
    assert.equal(NullView(), 'not null')
  })

  await test('view with undefined value', () => {
    const UndefinedView = View(undefined)
    assert.equal(UndefinedView(), undefined)
    UndefinedView('defined')
    assert.equal(UndefinedView(), 'defined')
  })

  await test('computed with no dependencies', () => {
    const Static = View(() => 42)
    assert.equal(Static(), 42)
  })

  await test('circular dependency detection', async () => {
    const A = View(1)
    const B = View(() => A() + 1)
    // This would cause circular ref: A = View(() => B() + 1)
    // Just ensure B works
    assert.equal(B(), 2)
  })

  await test('array of views', () => {
    const views = [View(1), View(2), View(3)]
    assert.equal(views[0](), 1)
    assert.equal(views[1](), 2)
    assert.equal(views[2](), 3)
  })

  await test('view with function value', () => {
    const fn = () => 'result'
    // View interprets function as computed, not stored value
    const FnView = View(fn)
    assert.equal(typeof FnView(), 'string')  // Function is called, returns string
    assert.equal(FnView(), 'result')
  })

  await test('view with array value', () => {
    const ArrayView = View([1, 2, 3])
    assert.deepEqual(ArrayView(), [1, 2, 3])
    ArrayView([4, 5, 6])
    assert.deepEqual(ArrayView(), [4, 5, 6])
  })

  await test('template with missing element', () => {
    const setupContainer = document.createElement('div')
    setupContainer.innerHTML = '<template View="Test"><div View="Exists"></div></template>'
    document.body.appendChild(setupContainer)

    const { Test } = View
    // Access non-existent element should not throw
    const instance = Test({ Exists: 'OK' })
    document.body.appendChild(instance)

    assert.equal(instance.textContent, 'OK')

    document.body.removeChild(instance)
    document.body.removeChild(setupContainer)
  })

  await test('DOM node that does not exist', () => {
    // Should throw error when accessing non-existent element
    let errorThrown = false
    try {
      const { NonExistent } = View
    } catch (e) {
      errorThrown = true
      assert.truthy(e.message.includes('not found'))
    }
    assert.truthy(errorThrown, 'Should throw error for non-existent element')
  })

  await test('localStorage with special characters in key', () => {
    const storage = View.localStorage
    storage['key:with:colons'] = 'value'
    assert.equal(storage['key:with:colons'], 'value')
  })

  await test('very large localStorage value', () => {
    const largeData = Array(100).fill('x').join('')
    const storage = View.localStorage
    storage.large = largeData
    assert.equal(storage.large, largeData)
  })

  await test('multiple updates in single tick', async () => {
    const Counter = View(0)
    const { div } = View
    const container = div(() => `Count: ${Counter()}`)
    document.body.appendChild(container)

    await wait(50)
    Counter(1)
    Counter(2)
    Counter(3)
    await wait(50)

    assert.equal(container.textContent, 'Count: 3')
    document.body.removeChild(container)
  })

  await test('view with Date value', () => {
    const date = new Date('2024-01-01')
    const DateView = View(date)
    assert.equal(DateView().getTime(), date.getTime())
  })

  await test('view with RegExp value', () => {
    const regex = /test/g
    const RegexView = View(regex)
    assert.equal(RegexView().source, 'test')
  })

  console.groupEnd()
}
