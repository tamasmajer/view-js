// Test: LocalStorage Views
export default async (View, { test, assert, createMockLocalStorage, wait }) => {
  console.group('💾 LocalStorage Views')

  const mockLS = createMockLocalStorage()

  await test('localStorage view', async () => {
    const { Settings } = View(mockLS)
    Settings({ theme: 'dark', lang: 'en' })

    // Read from cache - instant
    const stored = Settings()
    assert.equal(stored.theme, 'dark')

    // Wait for localStorage sync
    await wait(50)
    assert.truthy(mockLS.getItem('Settings'))
  })

  await test('localStorage with prefix', async () => {
    const { Config } = View(mockLS, 'app/')
    Config({ version: 1 })
    await wait(10)  // Wait for derive to sync
    assert.truthy(mockLS.getItem('app/Config'))
    const stored = JSON.parse(mockLS.getItem('app/Config'))
    assert.equal(stored.version, 1)
  })

  await test('localStorage sub-keys', () => {
    const Storage = View(mockLS)
    Storage.User({ id: 123, name: 'Test' })
    Storage.Prefs({ notifications: true })
    assert.equal(Storage.User().id, 123)
    assert.equal(Storage.Prefs().notifications, true)
  })

  console.groupEnd()
}
