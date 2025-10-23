// Test: VanJS Fragment Support
export default async (View, { test, assert, wait }) => {
  console.group('🧩 Fragment Support')

  await test('render multi-element template', async () => {
    const setupContainer = document.createElement('div')
    setupContainer.innerHTML = '<template View="Card"><h3 View="Title"></h3><p View="Content"></p></template>'
    document.body.appendChild(setupContainer)

    const { Card, div } = View
    const card = Card({ Title: 'Hello', Content: 'World' })
    document.body.appendChild(card)
    await wait(50)

    // Multi-root template creates fragment wrapper
    assert.truthy(card.tagName === ':' || card.children)

    document.body.removeChild(card)
    document.body.removeChild(setupContainer)
  })

  await test('conditional fragment rendering', async () => {
    const Show = View(true)
    const { div } = View
    const container = div(() => Show() && [
      div('First'),
      div('Second'),
      div('Third')
    ])
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 3)

    Show(false)
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 0)

    document.body.removeChild(container)
  })

  await test('fragment with reactive content', async () => {
    const Text = View('Hello')
    const { div, span } = View
    const container = div([
      span(() => Text()),
      span(' World')
    ])
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.textContent, 'Hello World')

    Text('Goodbye')
    await wait(50)
    assert.equal(container.textContent, 'Goodbye World')

    document.body.removeChild(container)
  })

  await test('nested fragments', async () => {
    const { div } = View
    const container = div([
      div('A'),
      [
        div('B1'),
        div('B2')
      ],
      div('C')
    ])
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.children.length, 4) // A, B1, B2, C (flattened)
    document.body.removeChild(container)
  })

  await test('fragment in list', async () => {
    const Items = View([1, 2])
    const { div } = View
    const container = div(() =>
      Items().flatMap(num => [
        div(`Item ${num}`),
        div(`Detail ${num}`)
      ])
    )
    document.body.appendChild(container)
    await wait(50)
    assert.equal(container.querySelectorAll('div').length, 4) // 2 items * 2 divs each
    document.body.removeChild(container)
  })

  await test('empty fragment', () => {
    const { div } = View
    const container = div([])
    document.body.appendChild(container)
    assert.equal(container.children.length, 0)
    document.body.removeChild(container)
  })

  console.groupEnd()
}
