// Test: DOM Node Views
export default async (View, { test, assert }) => {
  console.group('🧠 DOM Node Views')

  await test('view window', () => {
    const View2 = new View({ window })
    console.log('View2:', View2, View === View2)
    const { Window } = View2
    console.log('Window type:', Window())
    assert.equal(Window(), window)
  })

  await test('view with immediate binding', () => {
    const div = document.createElement('div')
    const Div = View(div)
    assert.equal(Div(), div)
    const div2 = View(div, { class: 'test' })
    assert.equal(div2, div)
    assert.equal(div.className, 'test')
  })

  await test('view update', () => {
    const div = document.createElement('div')
    const Div = View(div)
    Div({ class: 'updated', id: 'test-id' })
    assert.equal(div.className, 'updated')
    assert.equal(div.id, 'test-id')
  })

  console.groupEnd()
}
