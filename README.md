# ViewJS

A tiny (<3.3KB) client-side library for building reactive UIs with minimal, concise, declarative code. Built on VanJS. No dependencies. No build tools. Just start coding.

## Quick Start

```html
<!DOCTYPE html>
<html>
<body>
  <div View="App"></div>

  <template View="Counter">
    <span View="Display">0</span>
    <button View="Increase">+</button>
  </template>
  
  <script type="module">
    import View from 'view.js'
    
    const Count = View(0)
    const { App, Counter } = View
    
    App(Counter({
      Display: () => Count(),
      Increase: { onclick: () => Count(Count() + 1) }
    }))
  </script>
</body>
</html>
```

**What's happening:**
1. Add `View="Name"` attributes to HTML elements
2. Create reactive data: `const Count = View(0)`
3. Get elements: `const { App, Counter } = View`
4. Bind them: `Counter({ Display: () => Count() })`

When `Count` changes → `Display` updates automatically.

## Installation

```javascript
import View from 'https://cdn.jsdelivr.net/gh/tamasmajer/view-js/view.min.js'
```

**Requirements:** Modern browser with ES6 modules. No build tools needed.

## Core Concepts

### Views Are Callable

Everything in ViewJS is a "view" - a callable that reads or writes:

```javascript
// Data views
const Count = View(0)
Count()      // Read: returns 0
Count(5)     // Write: sets to 5

// Element views
const { App } = View
App()        // Read: returns DOM element
App(content) // Write: updates element

// Template views
const { Card } = View
Card()             // Creates empty clone
Card({ Title: 'Hello' })  // Creates bound clone
```

### Reactive Updates

Use functions to make things reactive:

```javascript
const Name = View('John')
const Greeting = View(() => `Hello, ${Name()}!`)

Name('Jane')  // Greeting automatically updates to "Hello, Jane!"
```

In templates:
```javascript
const { App } = View
App(() => `Count: ${Count()}`)  // Updates when Count changes
```

### What Can Be Views?

**1. State & Computed Views** (reactive data)
```javascript
const Count = View(0)                    // State
const Double = View(() => Count() * 2)   // Computed
```

**2. DOM Views** (HTML elements via `View` attributes)
```javascript
<div View="App"></div>              // Element (updates in-place)
<template View="Card"></template>   // Template (creates clones)

const { App, Card } = View
```

**3. External Resources** (browser APIs)
```javascript
const Storage = View(localStorage)           // Storage
const ApiFetch = View(fetch, { url: '...' }) // HTTP
const Templates = View(DOMParser, html)      // HTML parsing
```

## Creating Views

| What You Have | How to Create View | Example |
|---------------|-------------------|---------|
| **A value** | `View(value)` | `View(0)`, `View({ name: 'John' })` |
| **A computation** | `View(() => ...)` | `View(() => Count() * 2)` |
| **Conditional computation** | `View([triggers], () => ...)` | `View([Count], () => expensive())` |
| **localStorage** | `View(localStorage)` or with prefix | `View(localStorage, 'app/')` |
| **HTML string** | `View(DOMParser, html)` | `View(DOMParser, '<html>...')` |
| **Remote API** | 2 steps (see below) | `ApiFetch({ path: '/users' })` |
| **DOM node** | `View(node)` | `View(document.body)` |
| **HTML element** | Add `View="Name"` | `<div View="App">` |
| **Template** | Add `View="Name"` | `<template View="Card">` |

### Destructure What You Need

Access browser APIs and create elements by destructuring from View:

```javascript
// Browser APIs (capitalized)
const { Window, Document, LocalStorage, Fetch, DomParser } = View

// HTML elements (lowercase)
const { div, span, button } = View

// Your templates and elements (capitalized, from View attributes)
const { App, Counter, UserCard } = View
```

**Browser API shortcuts:**

```javascript
// Global objects
Window({ onresize: updateLayout })    // Bind to window
Document({ onclick: handleClick })    // Bind to document

// Storage
const { Settings } = LocalStorage          // Auto-synced keys
Settings({ theme: 'dark' })

// Or with prefix
const Storage = View(localStorage, 'app/')
const { Config } = Storage  // Saves to 'app/Config'

// HTML parsing
const Templates = DomParser('<html>...')
const { Card } = Templates

// HTTP (see Remote Views section)
const { Fetch } = View
```

## Data Views

### Basic State

```javascript
const Count = View(0)
const User = View({ name: 'John', age: 25 })

// Read
console.log(Count())     // 0
console.log(User().name) // 'John'

// Write (always replace, never mutate)
Count(10)
User({ ...User(), age: 26 })
```

### Computed Views

Auto-update when their dependencies change:

```javascript
const Price = View(100)
const Quantity = View(2)
const Total = View(() => Price() * Quantity())

Price(150)  // Total automatically becomes 300
```

### Conditional Updates

Control when computations run by specifying conditions:

```javascript
// Only recomputes when Count changes, ignoring other dependencies
const Controlled = View([Count], () => {
  const value = Count()
  const other = SomeOtherView()  // Changes here won't trigger recompute
  return expensiveCalc(value)
})
```

**Why?** Prevents unnecessary updates and enables precise control over re-renders.

### Persistent State

Auto-sync with localStorage:

```javascript
const { Settings } = View(localStorage)
Settings({ theme: 'dark', lang: 'en' })  // Auto-saves

// With prefix for organization
const { Config } = View(localStorage, 'myapp/')  // Saves to 'myapp/Config'
```

## Templates and Elements

### HTML First

Define structure in HTML, bind behavior in JavaScript:

```html
<div View="App"></div>

<template View="Counter">
  <button View="DecBtn">-</button>
  <span View="Display">0</span>
  <button View="IncBtn">+</button>
</template>
```

```javascript
const Count = View(0)
const { App, Counter } = View

App(Counter({
  Display: () => Count(),
  IncBtn: { onclick: () => Count(Count() + 1) },
  DecBtn: { onclick: () => Count(Count() - 1) }
}))
```

### Binding Patterns

```javascript
const { Card } = View

// Content only
Card({ Title: 'Hello World' })

// Properties only
Card({ Button: { onclick: handler } })

// Both
Card({ Button: [{ onclick: handler, class: 'primary' }, 'Click Me'] })

// Mixed: lowercase = element props, Uppercase = descendants
Card({
  class: 'featured',           // Card element class
  Title: 'Featured Post',      // Descendant element content
  LikeBtn: { onclick: like }   // Descendant element props
})
```

### Accessing DOM Elements

Template/element views can be called to get the actual DOM node:

```javascript
const { MyButton } = View
const button = MyButton()  // Returns HTMLButtonElement
button.focus()
button.classList.add('highlighted')
```

### Creating Elements Programmatically

```javascript
const { div, span, button, h1 } = View

const widget = div({ class: 'widget' },
  h1('Title'),
  span(() => Count()),  // Reactive
  button({ onclick: increment }, 'Increment')
)

document.body.append(widget)
```

## Lists

**Rule: Always replace, never mutate**

```javascript
const Items = View([])

// ✅ Correct
Items([...Items(), newItem])
Items(Items().filter(item => item.id !== id))

// ❌ Wrong
Items().push(newItem)
Items()[0] = newValue
```

**Rendering:**

```javascript
const { TodoList, TodoItem, div } = View

TodoList(() => 
  Todos().length === 0 
    ? div({ class: 'empty' }, 'No todos yet')
    : Todos().map(todo => TodoItem({ Text: todo.text }))
)
```

## External Templates

Load HTML templates from external files:

```javascript
const { Fetch, DomParser } = View

// Load templates
const Html = Fetch({ url: '/templates.html' })
const Templates = DomParser(Html)

// Use them
const { UserCard, TodoItem } = Templates
App(UserCard({ Name: 'John' }))
```

**With loading states:**

```javascript
const Ready = View(() => !!Templates())

App(() => 
  Ready() 
    ? UserCard({ Name: 'John' })
    : div('Loading...')
)
```

**Multiple sources:**

```javascript
const UI = DomParser(Fetch({ url: '/ui.html' }))
const Forms = DomParser(Fetch({ url: '/forms.html' }))

const { Button } = UI
const { Input } = Forms
```

## Remote Views

Remote views use a **2-step process**:

### Step 1: Get/Create Configurator

```javascript
// From View (empty config)
const { Fetch } = View

// Or create custom configurator with base config
const ApiFetch = View(fetch, { 
  url: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' }
})
```

### Step 2: Create Remote View

```javascript
// Static
const Users = Fetch({ url: '/api/users' })
const Users = ApiFetch({ path: '/users' })

// Reactive (refetches when PostId changes)
const PostId = View(1)
const Post = Fetch(() => ({ url: `/api/posts/${PostId()}` }))

// Conditional (only refetches when DocId changes)
const DocId = View(1)
const Doc = Fetch([DocId], payload => ({
  url: `/api/documents/${DocId()}`,
  body: payload
}))
```

### Usage

```javascript
// GET (read cache)
const data = Users()

// POST (send data)
Users(newUser)

// Trigger refetch
PostId(2)  // Post refetches automatically
DocId(5)   // Doc refetches automatically
```

### With Callbacks

```javascript
const Users = Fetch({
  url: '/api/users',
  loading: url => IsLoading(!!url),
  failed: ({ response, error }) => {
    if (response) console.log('HTTP error:', response.status)
    else console.log('Network error:', error)
  },
  result: data => console.log('Success:', data)
})
```

### Configuration

**Query parameters:**
```javascript
const Page = View(1)
const Users = Fetch([Page], payload => ({
  url: '/api/users',
  query: { page: Page(), limit: 20 },
  body: payload
}))
```

**Merging configs:**
```javascript
const ApiFetch = View(fetch, {
  url: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' }
})

// Inherits url and headers
const Users = ApiFetch({ path: '/users' })
```

## Common Patterns

### Edit Remote Data

```javascript
const { Fetch } = View
const DocId = View(1)

// Remote state (refetches when DocId changes)
const ServerDoc = Fetch([DocId], payload => ({
  url: `/api/docs/${DocId()}`,
  body: payload
}))

// Local editing state
const LocalDoc = View({})

// Initialize local from remote
View(() => {
  if (ServerDoc() && !LocalDoc().id) {
    LocalDoc({ ...ServerDoc() })
  }
})

// Save changes
const save = () => ServerDoc(LocalDoc())

// Edit UI binds to LocalDoc
const { Editor } = View
Editor({
  Title: { 
    value: () => LocalDoc().title,
    oninput: e => LocalDoc({ ...LocalDoc(), title: e.target.value })
  },
  SaveBtn: { onclick: save }
})
```

### Tab Interface

Use conditional updates to prevent unnecessary re-renders:

```javascript
const ActiveTab = View('users')

const TabContent = View([ActiveTab], () => 
  ActiveTab() === 'users' ? UserList({ users: AllUsers() }) :
  ActiveTab() === 'settings' ? SettingsPanel({ config: AppConfig() }) :
  div('Select a tab')
)

// Only re-renders when ActiveTab changes
// Won't re-render when AllUsers or AppConfig change
```

### Form Handling

```javascript
const form = {
  email: View(''),
  password: View(''),
  isValid: View(() => form.email().includes('@') && form.password().length >= 8)
}

const { Form } = View
Form({
  EmailInput: { 
    value: () => form.email(), 
    oninput: e => form.email(e.target.value) 
  },
  PasswordInput: { 
    value: () => form.password(), 
    oninput: e => form.password(e.target.value) 
  },
  SubmitBtn: { 
    disabled: () => !form.isValid(),
    onclick: () => submitForm(form)
  }
})
```

## Best Practices

1. **Uppercase naming**: `View="Counter"` not `View="counter"` in HTML
2. **PascalCase in JS**: `const Counter = View(0)` not `const counter = View(0)`
3. **Always replace state**: Use spread/filter/map, never mutate
4. **Destructure views**: `const { App, Counter } = View`
5. **Templates first**: HTML for structure, JS for behavior
6. **Lowercase = props, Uppercase = descendants**: `{ class: 'active', Title: 'Hello' }`
7. **Conditional updates**: Use `View([triggers], fn)` for precise control
8. **localStorage prefixes**: `View(localStorage, 'prefix/')` to organize data
9. **2-step fetch**: Configure → Create remote view

## VanJS Enhancements

ViewJS is built on VanJS 1.5.3 with these enhancements:

### Fragment Support

Return arrays from reactive functions:

```javascript
const { div } = View
const Items = View(['A', 'B', 'C'])

// Returns array of elements
div(() => Items().map(item => div(item)))
```

Multi-root templates automatically become fragments.

### Conditional Rendering

Use `&&` operator for concise conditionals:

```javascript
const { div, span } = View

// These work
() => User() && `Welcome, ${User().name}!`
() => HasError() && div({ class: 'error' }, 'Error!')
() => Count() > 0 && span(`${Count()} items`)

// Filters out: false, null, undefined
// Preserves: 0, '', and all other values
```

### Event Binding

Bind to any DOM node:

```javascript
const { Window, Document } = View

Window({ onresize: updateLayout })
Document({ onkeydown: e => e.key === 'Escape' && closeModal() })

// Or any element
View(document.body, { onclick: handleClick })
```

## Advanced Topics

### Sub-views

Access nested views via properties:

```javascript
// Template sub-views
const { Card } = View
Card.Title('Hello')      // Update Title inside Card

// Storage sub-views
LocalStorage.Settings({ theme: 'dark' })
LocalStorage.User({ name: 'John' })
```

### Customization

Import with any name:

```javascript
import View from 'view.js'   // Standard
import V from 'view.js'       // Short
import ui from 'view.js'      // Alternative
```

Custom attribute name:

```javascript
import ViewJS from 'view.js'
const view = ViewJS({ attribute: 'ref' })  // Use ref="Name" instead of View="Name"
```

### Performance

Control when computations run:

```javascript
// Auto-tracked (runs on any dependency change)
const Auto = View(() => compute(A(), B(), C()))

// Controlled (only runs when A or B change, ignores C)
const Controlled = View([A, B], () => compute(A(), B(), C()))
```

## API Reference

### View()

```javascript
View(value)              // Create state
View(() => expr)         // Create computed
View([triggers], fn)     // Create conditional computed
View(localStorage)       // Create storage proxy
View(DOMParser, html)    // Parse HTML
View(fetch, config)      // Create fetch configurator
View(node, props)        // Bind to DOM node
```

### Simplified API

```javascript
const { 
  Window,      // window object
  Document,    // document object
  LocalStorage,// localStorage proxy
  Fetch,       // fetch configurator
  DomParser    // HTML parser
} = View
```

### Template Binding

```javascript
Template({
  Child: 'content',                    // Set content
  Child: { prop: value },              // Set properties
  Child: [{ prop: value }, 'content']  // Set both
})
```

### Remote View Config

```javascript
{
  url: '/api/users',           // Base URL
  path: '/append',             // Path to append
  query: { key: 'value' },     // Query parameters
  body: data,                  // Request body (auto-POST)
  method: 'GET',               // HTTP method
  headers: { 'X-Custom': 'value' },
  loading: url => ...,         // Loading callback
  failed: ({ response, error }) => ...,
  result: data => ...          // Success callback
}
```

## Examples

### Counter

```html
<template View="Counter">
  <button View="Dec">-</button>
  <span View="Count">0</span>
  <button View="Inc">+</button>
</template>

<script type="module">
import View from 'view.js'

const Count = View(0)
const { App, Counter } = View

App(Counter({
  Count: () => Count(),
  Inc: { onclick: () => Count(Count() + 1) },
  Dec: { onclick: () => Count(Count() - 1) }
}))
</script>
```

### Todo List

```html
<template View="TodoApp">
  <input View="Input" placeholder="Add todo..." />
  <button View="AddBtn">Add</button>
  <div View="List"></div>
</template>

<script type="module">
import View from 'view.js'

const Todos = View([])
const Input = View('')

const { App, TodoApp, div } = View

App(TodoApp({
  Input: { 
    value: () => Input(),
    oninput: e => Input(e.target.value)
  },
  AddBtn: { 
    onclick: () => {
      if (Input().trim()) {
        Todos([...Todos(), { id: Date.now(), text: Input() }])
        Input('')
      }
    }
  },
  List: () => Todos().map(todo => 
    div({ class: 'todo' }, todo.text)
  )
}))
</script>
```

### API Data

```javascript
import View from 'view.js'

const { Fetch } = View
const PostId = View(1)

// Refetches when PostId changes
const Post = Fetch([PostId], () => ({
  url: `https://jsonplaceholder.typicode.com/posts/${PostId()}`
}))

const { App, div, h1, p, button } = View

App(div(
  () => Post() ? div(
    h1(() => Post().title),
    p(() => Post().body)
  ) : div('Loading...'),
  button({ onclick: () => PostId(PostId() + 1) }, 'Next Post')
))
```

## Troubleshooting

**View not updating?**
- Use functions for reactive content: `() => Count()` not `Count()`
- Check View attribute is uppercase: `View="Counter"` not `View="counter"`

**Template not found?**
- Element must exist before accessing: `const { App } = View`
- Template must be `<template View="Name">`

**State not persisting?**
- localStorage views auto-save, but check browser storage limits
- Use prefix to avoid key conflicts: `View(localStorage, 'myapp/')`

**Remote view not refetching?**
- For reactive: use function `() => ({ url: ... })`
- For conditional: use array `[trigger], payload => ({ url: ... })`

## Learn More

- **GitHub**: [github.com/tamasmajer/view-js](https://github.com/tamasmajer/view-js)
- **Built on**: [VanJS 1.5.3](https://vanjs.org/)
- **Size**: <3.3KB minified + gzipped
- **License**: MIT

This is a proof of concept exploring simpler alternatives to modern frameworks. Feedback welcome!