// Test: Sub-views
export default async (View, { test, assert, wait, createMockLocalStorage }) => {
  console.group('📦 Sub-views')

  await test('state with DOM sub-views', async () => {
    const container = document.createElement('div')
    container.innerHTML = '<span View="Name">Test</span>'
    document.body.appendChild(container)
    const Container = View(container)
    // Sub-property access returns callable for sub-element
    assert.truthy(Container.Name)
    document.body.removeChild(container)
  })

  await test('localStorage sub-views', () => {
    const mockLS = createMockLocalStorage()
    const Storage = View(mockLS)
    Storage.Settings({ theme: 'dark' })
    Storage.User({ name: 'John' })
    assert.equal(Storage.Settings().theme, 'dark')
    assert.equal(Storage.User().name, 'John')
  })

  await test('template sub-views', () => {
    const template = document.createElement('template')
    template.setAttribute('View', 'TestTemp')
    template.innerHTML = '<div View="Child">Test</div>'
    document.body.appendChild(template)

    const { TestTemp } = View
    assert.truthy(TestTemp.Child)

    document.body.removeChild(template)
  })

  console.groupEnd()
}
