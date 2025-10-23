// Test: Data Views
export default async (View, { test, assert, wait }) => {
  console.group('📦 Data Views')

  await test('basic state', () => {
    const Count = View(0)
    assert.equal(Count(), 0)
    Count(5)
    assert.equal(Count(), 5)
  })

  await test('object state', () => {
    const User = View({ name: 'John', age: 25 })
    assert.equal(User().name, 'John')
    User({ name: 'Jane', age: 26 })
    assert.equal(User().name, 'Jane')
  })

  await test('computed state', async () => {
    const A = View(2)
    const B = View(3)
    const Sum = View(() => A() + B())
    assert.equal(Sum(), 5)
    A(10)
    await wait(50)
    assert.equal(Sum(), 13)
  })

  await test('optimized computed', async () => {
    const X = View(5)
    const Y = View(10)
    let calls = 0
    const Result = View([X], () => { calls++; return X() * 2 })
    Result() // Initial call
    const initialCalls = calls
    Y(20) // Shouldn't trigger recompute
    await wait(50)
    assert.equal(calls, initialCalls)
    X(7) // Should trigger
    await wait(50)
    assert.equal(calls, initialCalls + 1)
  })

  console.groupEnd()
}
