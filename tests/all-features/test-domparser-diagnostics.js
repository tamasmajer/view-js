// Test: DomParser Diagnostic
export default async (View, { test, assert }) => {
  console.group('🔬 DomParser Diagnostic')
  const DomParser = View(DOMParser)

  await test('Check DOMParser structure', () => {
    console.log('window.DOMParser:', window.DOMParser)
    console.log('typeof window.DOMParser:', typeof window.DOMParser)
    console.log('DOMParser.prototype:', DOMParser.prototype)
    console.log('DOMParser.prototype.parseFromString:', DOMParser.prototype.parseFromString)
    console.log('typeof DOMParser.prototype.parseFromString:', typeof DOMParser.prototype.parseFromString)

    console.log('\nCreating instance:')
    const parser = new DOMParser()
    console.log('parser:', parser)
    console.log('parser.parseFromString:', parser.parseFromString)
    console.log('typeof parser.parseFromString:', typeof parser.parseFromString)
  })

  await test('Check what mainProxy receives with logging', () => {
    console.log('\n=== Add logging to see what apply receives ===')

    // Temporarily patch mainProxy to log
    // const originalApply = View.constructor.prototype.apply

    // const { DomParser } = View
    console.log('DomParser function:', DomParser.toString())
    console.log('ctx.DOMParser:', window.DOMParser)
    console.log('ctx.DOMParser.prototype:', window.DOMParser.prototype)
    console.log('ctx.DOMParser.prototype.parseFromString:', window.DOMParser.prototype.parseFromString)
    console.log('Has parseFromString:', !!window.DOMParser.prototype.parseFromString)

    try {
      const html = '<html><body><template View="Test">test</template></body></html>'
      console.log('\nCalling DomParser(html)...')
      console.log('This will call: mainProxy(ctx.DOMParser, html)')
      console.log('v should be:', window.DOMParser)
      console.log('f should be:', html.substring(0, 30) + '...')
      console.log('v?.prototype?.parseFromString:', window.DOMParser?.prototype?.parseFromString)
      console.log('Condition should match:', !!(window.DOMParser?.prototype?.parseFromString || window.DOMParser?.parseFromString))

      const result = DomParser(html)
      console.log('\nSuccess! Result:', result)
    } catch (err) {
      console.error('\nError:', err.message)
      console.error('This means the DOMParser check did NOT match')
      console.error('It fell through to: return wrapState(target(...args))')
      console.error('Which calls makeState(DOMParser, html)')
      console.error('makeState treats it as conditionalState')
    }
  })

  await test('Try View(DOMParser, html) directly', () => {
    console.log('\n=== Direct View(DOMParser, html) ===')

    try {
      const html = '<html><body><template View="Test">test</template></body></html>'
      const result = View(DOMParser, html)
      console.log('Result type:', typeof result)
      console.log('Result:', result)

      if (typeof result === 'function') {
        const doc = result()
        console.log('doc:', doc)
      }
    } catch (err) {
      console.error('Error:', err.message)
      console.error('Stack:', err.stack)
    }
  })

  console.groupEnd()
}