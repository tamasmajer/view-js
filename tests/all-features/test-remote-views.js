// Test: Remote Views
export default async (View, { test, assert, wait, createMockFetch, installMockFetch }) => {
  console.group('🌐 Remote Views')

  const fetch = createMockFetch(100)
  const Fetch = View(fetch)
  // const restore = installMockFetch(createMockFetch(100))
  // View({ window, fetch: createMockFetch(100) }) // Local fetch mock

  await test('fetch with string url', async () => {
    const Users = Fetch('/users')
    console.log('Users:', Users)
    await wait(150)
    assert.truthy(Users().length > 0)
  })

  await test('fetch with reactive url', async () => {
    const PostId = View(1)
    const Post = Fetch(() => `/posts/${PostId()}`)  // No explicit deps - auto-track
    await wait(150)
    const post1 = Post()
    assert.truthy(post1)
    assert.equal(post1.id, 1)
    PostId(2)
    await wait(150)
    assert.equal(Post().id, 2)
  })

  await test('fetch with config object', async () => {
    const Data = Fetch({ url: '/users' })
    await wait(150)
    assert.truthy(Array.isArray(Data()))
  })

  await test('fetch read-write with payload', async () => {
    const Docs = Fetch(payload => ({ url: '/docs/1', body: payload }))
    await wait(150)
    Docs({ title: 'Updated' })
    await wait(150)
    assert.equal(Docs().body.title, 'Updated')
  })

  await test('fetch with dependencies', async () => {
    const DocId = View(1)
    let fetchCount = 0
    const Doc = Fetch([DocId], payload => {
      console.log('Fetching!!!!')
      fetchCount++
      return { url: `/docs/${DocId()}`, body: payload }
    })
    await wait(150)
    assert.equal(fetchCount, 1)
    DocId(2)
    await wait(150)
    assert.equal(fetchCount, 2)
  })

  await test('extend remote view', async () => {
    const Fetch = View(fetch, { url: 'https://api.example.com' })
    // const Users = View(Api, { path: '/users' })
    // const Fetch = View(fetch, { url: 'https://api.example.com' })
    const Users = Fetch({ path: '/users' })
    await wait(150)
    assert.truthy(Users())
  })

  // restore()
  // View({ window })
  console.groupEnd()
}
