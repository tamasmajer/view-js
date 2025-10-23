// Test: Event Handlers
export default async (View, { test, assert, wait }) => {
  console.group('⚡ Event Handlers')

  await test('click event handler', async () => {
    let clicked = false
    const { button } = View
    const btn = button({ onclick: () => { clicked = true } }, 'Click me')
    document.body.appendChild(btn)
    btn.click()
    await wait(10)
    assert.truthy(clicked)
    document.body.removeChild(btn)
  })

  await test('multiple event handlers', async () => {
    let clicks = 0
    let hovers = 0
    const { div } = View
    const elem = div({
      onclick: () => clicks++,
      onmouseenter: () => hovers++
    })
    document.body.appendChild(elem)
    elem.click()
    elem.dispatchEvent(new Event('mouseenter'))
    await wait(10)
    assert.equal(clicks, 1)
    assert.equal(hovers, 1)
    document.body.removeChild(elem)
  })

  await test('input event handler', async () => {
    const Text = View('')
    const { input } = View
    const field = input({
      oninput: e => Text(e.target.value),
      value: () => Text()
    })
    document.body.appendChild(field)
    field.value = 'hello'
    field.dispatchEvent(new Event('input'))
    await wait(50)
    assert.equal(Text(), 'hello')
    document.body.removeChild(field)
  })

  console.groupEnd()
}
