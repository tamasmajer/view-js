# ViewJS

A tiny (3KB) client-side library for building reactive UIs with minimal, concise, declarative code. Built on VanJS. No dependencies. No build tools. Just start coding.

## Overview

### Core Concept

Every building block is a 'View' with a unique name (capitalized), so we can reference them from anywhere.

**Create Views from HTML elements:**
```html
<div View="App"></div>
<template View="Counter">
  <button View="Increment">+</button>
  <span View="Display">0</span>
</template>
```

**Create views from data:**
```javascript
// Data view
const Count = View(0)
Count()      // When we read this View: Returns 0
Count(5)     // When we update this View: Sets to 5, returns 5

// Computed view
const Doubled = View(() => Count() * 2)
Doubled()    // Returns the computed value. Updates itself when Count changes.
```

**Get the elements and build a UI:**
```javascript
const { App, Counter } = View

// App is an element view (updates in place)
App()                    // Returns the App element
App(Counter({            // Binds a new Counter to the App element
  Display: () => Count(),
  Increment: { onclick: () => Count(Count() + 1) }
}))

// Counter is a template view (always creates clones)
Counter()                // Returns template element
Counter({...})           // Creates new clone with bindings
```

When you use a view inside another view, ViewJS tracks the dependency. Update the inner view → outer view updates automatically.

### Working Example

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
    
    App( 
      Counter({
        Display: () => Count(),
        Increase: { onclick: () => Count(Count() + 1) }
      })
    )
  </script>
</body>
</html>
```

### Disclaimer

This is a proof of concept - a personal experiment shared to gauge interest in simpler alternatives to today's frameworks.

### Getting Started

1. **Requirements**: Modern browser with ES6 module support, no build tools required
2. **Import**: `import View from 'https://cdn.jsdelivr.net/gh/tamasmajer/view-js/view.min.js'`
3. **Name your elements**: Add `View="Name"` attributes to HTML elements
4. **Create views**: `const Count = View(0)` creates a callable view
5. **Access element views**: `const { App } = View` to get element views from DOM
6. **Call views**: `Count()` reads, `Count(5)` writes, `App(...)` updates

## Creating Views

Views follow the pattern **View(summary, details)**:
- `View()` returns the summary
- `View(details)` updates the summary or creates something new

The type of view depends on the first argument:

| First Argument | View Type | Example |
|----------------|----------|---------|
| **Value** | Data view | `View(0)`, `View({ name: 'John' })` |
| **Function** | Computed view | `View(() => Count() * 2)` |
| **Array + Function** | Conditional computed | `View([Count], () => expensive())` |
| **localStorage** | Storage view | `View(localStorage)` or `View(localStorage, 'prefix/')` |
| **DOMParser + String** | Parse HTML document | `View(DOMParser, '<html>...</html>')` |
| **DOMParser + View** | Parse from view | `View(DOMParser, htmlView)` |
| **fetch** | Fetch configurator | `View(fetch)` or `View(fetch, config)` |
| **Fetch Configurator + Config** | Remote view | `ApiFetch({ url: '/api/users' })` |
| **Fetch Configurator + Array + Function** | Conditional remote | `ApiFetch([DocId], payload => {...})` |
| **DOM Node** | Element view | `View(window)`, `View(document.body)` |
| **Property Access** | Access views by name | `View.Button`, `View.div` |

### Destructure What You Need

ViewJS provides convenient property access for common patterns:

```javascript
// Access special constructors via capitalized properties
const { Window, Document, LocalStorage, Fetch, DomParser } = View

// Window and Document
Window()              // Returns window object
Document()            // Returns document object
Window({ onresize })  // Bind event handlers
Document({ onclick }) // Bind event handlers

// LocalStorage
const Storage = LocalStorage()     // Get storage proxy
const { Settings } = Storage       // Access storage keys as sub-views
Settings({ theme: 'dark' })        // Auto-saves to localStorage

// With prefix
const Storage = View(localStorage, 'app/')  // Prefix all keys with 'app/'
const { Config } = Storage                  // Saves to 'app/Config'

// Fetch (2-step process)
const { Fetch } = View                       // Step 1: Get fetch configurator
const Users = Fetch({ url: '/api/users' })  // Step 2: Create remote view

// Or create a custom fetch configurator with base config
const ApiFetch = View(fetch, { url: 'https://api.example.com' })
const Users = ApiFetch({ path: '/users' })  // Extends base config

// DomParser
const Templates = DomParser('<html>...')  // Parse HTML string
const { Card } = Templates                // Extract templates
```

### View Types

**Stateful views** (can read and write):
- Data views: `Count()` reads, `Count(5)` writes
- Remote views: `Users()` reads cache, `Users(data)` posts
- Storage views: `Storage()` reads object, `Storage.Settings()` reads key
- Element views: `App()` reads element, `App({...})` updates

**Factory views** (only create new instances):
- Template views: `Counter()` creates empty clone, `Counter({...})` creates with bindings
- Tag views: `div()` creates empty div, `div({...})` creates with props

### Sub-views

Views can contain sub-views accessed via properties:
```javascript
const { Template } = View       // Template is a view
Template.Title                  // Title sub-view inside Template
Template.Title()                // Get Title element
Template.Title('Hello')         // Set Title content

const Storage = LocalStorage()
Storage.Settings                // Settings sub-view (localStorage key)
Storage.Settings()              // Get value
Storage.Settings({ theme: 'dark' })  // Set value
```

### Examples

**View your data:**
```javascript
const Counter = View(0)
const User = View({ name: 'John' })
const Doubled = View(() => Counter() * 2)           // Computed (auto-tracked)
const Controlled = View([Counter], () => heavyCalc())  // Only updates when Counter changes
const Precise = View([Counter, User], () => compute()) // Only updates when Counter or User changes
```

**Combine the contents of views:**
```javascript
const FirstName = View('John')
const LastName = View('Doe')
const FullName = View(() => `${FirstName()} ${LastName()}`)

FirstName('Jane')  // FullName automatically updates to "Jane Doe"
```

**Create views from localStorage:**
```javascript
// Direct API
const { Settings } = View(localStorage)           // Auto-sync to localStorage
const { Prefs } = View(localStorage, 'myapp/')    // With namespace prefix

// Simplified API
const { LocalStorage } = View
const Storage = LocalStorage('myapp/')
const { Settings, Prefs } = Storage
```

**Create remote views:**
```javascript
// Using the Fetch configurator (2-step process)
const { Fetch } = View

// Static URL
const Users = Fetch({ url: '/api/users' })

// With base configuration - create a custom fetch configurator
const ApiFetch = View(fetch, { url: 'https://api.example.com' })
const Users = ApiFetch({ path: '/users' })

// Reactive URL (refetches when PostId changes)
const PostId = View(1)
const Post = Fetch(() => ({ url: `/api/posts/${PostId()}` }))

// With explicit conditions
const DocId = View(1)
const Doc = Fetch([DocId], payload => ({
  url: `/api/documents/${DocId()}`,
  body: payload
}))

// Usage
Users()              // GET /api/users (returns cached value)
Users(newUser)       // POST /api/users (with payload)
PostId(2)            // Triggers refetch of Post
Doc()                // GET - refetches when DocId changes
Doc(updates)         // POST with updates
```

**Parse external HTML:**
```javascript
// Direct API
const Templates = View(DOMParser, '<html><template View="Card">...</template></html>')
const { Card } = Templates

// Simplified API
const { DomParser } = View
const Templates = DomParser('<html><template View="Card">...</template></html>')
const { Card } = Templates

// From fetch view
const { Fetch, DomParser } = View
const Html = Fetch({ url: '/templates.html' })
const Templates = DomParser(Html)
const { UserCard, TodoItem } = Templates

// Reactive parsing
const Templates = DomParser(() => dynamicHTML())
```

**Create views from DOM nodes:**
```javascript
// Using the simplified API
const { Window, Document } = View
Window({ onresize: () => updateLayout() })  // Bind event handler
Document({ onclick: handleGlobalClick })

// Direct API
const Body = View(document.body, { class: 'dark-theme' })
Body()  // Returns document.body
Body({ class: 'light-theme' })  // Update class

// Any DOM element
const myElement = document.getElementById('special')
const Special = View(myElement)
Special({ onclick: handler }, 'New content')  // Bind + add children
```

**Find views by name:**
```javascript
const { Counter } = View
Counter({ count: () => Count() })       // Use template

const { MyButton } = View
MyButton().focus()                      // Direct DOM access

const { div, span } = View              // Create elements
```

### Return Values and Access

**Data containers** → Call to get/set
```javascript
const Count = View(0)
Count(5)              // Set value
console.log(Count())  // Get value → 5
```

**Template/Element containers** → Call to get node, call with args to create/update
```javascript
// Get the actual DOM node
const { App } = View
const appNode = App()
appNode.classList.add('ready')

// Create a new instance from template
const { Counter } = View
const counter = Counter({ Display: () => Count() })
document.body.append(counter)

// Update element in place
App(Counter({ Display: () => Count() }))
App([])  // Clear children
```

**localStorage views** → Destructure containers
```javascript
const { LocalStorage } = View
const Storage = LocalStorage('app/')
const { Settings } = Storage
Settings({ darkMode: true })  // Auto-saves
console.log(Settings())       // Get value
```

**Remote views** → Call to make requests
```javascript
const { Fetch } = View
const ApiFetch = Fetch({ url: '/api' })
// Remote views are created in step 2
```

## Features

- [Data Views](#data-views)
- [Elements with View Attributes](#elements-with-view-attributes)
- [Elements without View Attributes](#elements-without-view-attributes)
- [Creating Elements with Tags](#creating-elements-with-tags)
- [List Handling](#list-handling)
- [External Templates](#external-templates)
- [Remote Views](#remote-views)
- [Local View from/to Remote View](#local-view-fromto-remote-view)
- [Best Practices](#best-practices)
- [VanJS Enhancements](#vanjs-enhancements)

### Data Views

View your data to make it reactive.

**Basic usage:**
```javascript
const Counter = View(0)
const User = View({ name: 'John', age: 25 })

// Access/modify by calling
Counter(10)
User({ ...User(), age: 26 })  // Always replace, never mutate
```

**Computed values:**
```javascript
const Price = View(100)
const Quantity = View(2)
const Total = View(() => Price() * Quantity())

Price(150)  // Total automatically becomes 300
```

**Performance optimization:**
```javascript
const Result = View([Dep1, Dep2], () => compute())  // Only updates when specified conditions change
```

**Persistent views:**
```javascript
// Direct API
const { Settings } = View(localStorage)
const { UserPrefs } = View(localStorage, 'myapp/')

// Simplified API
const { LocalStorage } = View
const Storage = LocalStorage('myapp/')
const { Settings, UserPrefs } = Storage

Settings({ darkMode: true })  // Auto-saves
```

### Elements with View Attributes

**Template behavior:**
- `<template View="Name">` → `View.Name()` returns the template element itself
- `<template View="Name">` → `View.Name({})` clones and binds the template
- `<div View="Name">` → `View.Name()` returns the div element
- `<div View="Name">` → `View.Name({})` updates element in-place

**Naming convention:**
Use uppercase names: `View="Counter"` not `View="counter"`

**Element access:**
```javascript
const { MyButton } = View
const button = MyButton()  // Get the DOM element
button.focus()
```

**Template binding patterns:**
```javascript
const { Counter, UserCard } = View
Counter({
  Display: 'text only',                           // Content only
  Button: { onclick: handler },                   // Properties only
  Link: [{ href: '/page', class: 'active' }, 'Visit']  // Properties + content
})

// Mixed format: combine element properties with descendant updates
UserCard({
  class: 'active',              // lowercase = element property  
  UserName: User().name,        // Uppercase = descendant view content
  EditBtn: { onclick: edit }    // Uppercase = descendant view properties
})
```

**Element operations:**
```javascript
// Get the DOM node
const { Element } = View
const node = Element()

// Properties only (keeps existing children)
Element({ onclick: handler, class: 'active' })

// Properties + replace all children
Element([{ onclick: handler }, 'new content'])

// Clear all children
Element([])

// Update descendants by view names (Uppercase)
Element({ 
  Child1: 'new text', 
  Child2: { class: 'highlight' } 
})

// Mixed format: element properties + descendant view updates (case sensitive)
Element({ 
  class: 'container',           // lowercase = element attribute
  Title: 'New title',           // Uppercase = descendant view update
  Button: { onclick: handler }  // Uppercase = descendant view update
})
```

### Elements without View Attributes

Bind properties and events to existing DOM nodes.

**Direct node binding:**
```javascript
// Using simplified API
const { Window, Document } = View
Window({ 
  onresize: () => updateLayout(),
  onbeforeunload: (e) => e.preventDefault()
})
Document({ onclick: handleGlobalClick })

// Direct API
View(window, { onresize: () => updateLayout() })
View(document, { onclick: handleGlobalClick })
View(document.body, { onkeydown: (e) => {
  if (e.key === 'Escape') closeModal()
}})

// Bind to any DOM element
const myDiv = document.getElementById('myDiv')
View(myDiv, {
  onclick: handleClick,
  class: () => IsActive() ? 'active' : ''
})
```

### Creating Elements with Tags

Build UI elements programmatically.

**Element destructuring:**
```javascript
const { div, span, button, h1 } = View

const widget = div({ class: 'widget' },
  h1('Title'),
  span(() => Counter()),
  button({ onclick: () => Counter(Counter() + 1) }, 'Increment')
)
```

**Content format:**
All content compiles to `[{ props }, ...children]`.
- `h1('text')` → `[{}, 'text']`
- `h1({ class: 'title' })` → `[{ class: 'title' }]`
- `h1({ class: 'title' }, 'text')` → `[{ class: 'title' }, 'text']`

**Reactive content:**
Elements update automatically when reactive dependencies change.
```javascript
span(() => Counter())  // Updates automatically
div({ 
  class: () => Counter() % 2 ? 'odd' : 'even' 
}, () => `Count: ${Counter()}`)
```

### List Handling

**Always replace, never mutate:**
```javascript
// ✅ Correct
Items([...Items(), newItem])
Items(Items().filter(item => item.id !== targetId))

// ❌ Wrong
Items().push(newItem)
Items()[0] = newValue
```

**Rendering lists:**
Map arrays to DOM elements with empty state handling.
```javascript
const { TodoList, TodoItem, div } = View

TodoList(() => 
  Todos().length === 0 
    ? div({ class: 'empty' }, 'No todos yet!')
    : Todos().map(todo => 
        TodoItem({ 
          Text: todo.text,
          Delete: { onclick: () => removeTodo(todo.id) }
        })
      )
)
```

### External Templates

Load and use templates from external HTML files or dynamic sources.

**Parse HTML documents:**
```javascript
// Using simplified API
const { DomParser, Fetch } = View

// Static HTML
const Templates = DomParser('<html><template View="Card">...</template></html>')
const { Card } = Templates
Card({ Title: 'Hello' })

// From fetch view
const Html = Fetch({ url: '/templates.html' })
const Templates = DomParser(Html)
const { UserCard, TodoItem } = Templates

// Reactive parsing
const Templates = DomParser(() => dynamicHTML())
```

**Multiple template sources:**
```javascript
const { DomParser, Fetch } = View
const Components = DomParser(Fetch({ url: '/components.html' }))
const Layouts = DomParser(Fetch({ url: '/layouts.html' }))

const { Button, Card } = Components
const { Header, Footer } = Layouts
```

**With loading states:**
```javascript
const { DomParser, Fetch, div } = View
const Html = Fetch({ url: '/templates.html' })
const Templates = DomParser(Html)
const IsReady = View(() => !!Templates())

const { App } = View
App(() => 
  IsReady() 
    ? Templates.UserCard({ Name: 'John' })
    : div('Loading templates...')
)
```

**Dynamic template switching:**
```javascript
const { DomParser, Fetch } = View
const Theme = View('light')
const ThemeHTML = View(() => 
  Theme() === 'dark' 
    ? Fetch({ url: '/themes/dark.html' })() 
    : Fetch({ url: '/themes/light.html' })()
)
const Templates = DomParser(ThemeHTML)

// Templates automatically update when theme changes
const { Button } = Templates
```

**Document parsing handles:**
- Malformed HTML (returns document with error nodes)
- Empty strings (returns empty document)
- Null/undefined (returns undefined)
- Reactive updates when source changes

### Remote Views

Remote views use a **2-step process**: first create a fetch configurator, then create the actual remote view.

**Step 1: Get or create a fetch configurator**
```javascript
// From View (empty config)
const { Fetch } = View

// Or create a custom fetch configurator with base configuration
const ApiFetch = View(fetch, { url: 'https://api.example.com' })
```

**Step 2: Create remote views**
```javascript
// Static configuration
const Users = Fetch({ url: '/api/users' })
const Users = ApiFetch({ path: '/users' })  // Extends base config

// Reactive URL (refetches when condition changes)
const PostId = View(1)
const Post = Fetch(() => ({ url: `/api/posts/${PostId()}` }))

// With explicit conditions
const DocId = View(456)
const Doc = Fetch([DocId], payload => ({
  url: `/api/documents/${DocId()}`,
  body: payload
}))

// Usage
Users()         // GET - returns cached value
Users(newUser)  // POST - updates cache
PostId(2)       // Triggers Post refetch
Doc()           // GET - refetches when DocId changes
Doc(updates)    // POST with updates
```

**With callbacks:**
```javascript
const Users = Fetch({
  url: '/api/users',
  loading: url => IsLoading(!!url),      // Called before/after request
  failed: ({ response, error }) => {      // Error handling
    if (response) console.log('HTTP error:', response.status)
    else console.log('Network error:', error)
  },
  result: data => console.log('Success:', data)  // Success callback
})
```

**Query parameters:**
```javascript
const Page = View(1)
const Filter = View('')

const Users = Fetch([Page, Filter], payload => ({
  url: '/api/users',
  query: { page: Page(), filter: Filter() },  // ?page=1&filter=
  body: payload
}))
```

**Configuration merging:**
```javascript
const Token = View('abc123')

const ApiFetch = View(fetch, {
  url: 'https://api.example.com',
  headers: { Authorization: `Bearer ${Token()}` }
})

const Users = ApiFetch({ path: '/users' })  // Inherits url and headers
```

### Local View from/to Remote View

**Remote to Local**
Auto-refetch and display remote data reactively.
```javascript
const { Fetch } = View
const DocId = View(1)

// Refetches when DocId changes
const ServerDoc = Fetch([DocId], payload => ({
  url: `/api/posts/${DocId()}`,
  body: payload
}))

// Usage in templates - displays cached value
const { PostView } = View
PostView({
  Title: () => ServerDoc()?.title || 'Loading...',
  Content: () => ServerDoc()?.content || ''
})

// Change document - automatically refetches
DocId(2)
```

**Editable Remote Doc**
Separate remote and local state for editing workflows.
```javascript
const { Fetch } = View
const DocId = View(456)
const UserId = View(123)

// Remote view - refetches when DocId changes
const ServerDoc = Fetch([DocId], payload => ({
  url: `/api/documents/${DocId()}`,
  body: payload && { ...payload, userId: UserId() },
  loading: url => IsLoading(!!url)
}))

// Local editing state
const LocalDoc = View({})

// Initialize local from remote when document loads
View(() => {
  if (ServerDoc() && !LocalDoc().id) {
    LocalDoc({ ...ServerDoc() })
  }
})

// Save local changes to remote
const save = () => {
  ServerDoc(LocalDoc())  // POST with LocalDoc as payload
  ShowSaved(true)
}

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

### Customizing the Library

The library exports with a default attribute name of `View`. You can import it with any name you prefer:

```javascript
import View from 'view.js'   // Standard - use View
import V from 'view.js'       // Short form - use V
import ui from 'view.js'      // Alternative - use ui
```

For custom attribute names or configuration:
```javascript
import ViewJS from 'view.js'
const view = ViewJS({ 
  attribute: 'ref',  // Use ref="Name" in HTML instead of View="Name"
  window: customWindow,  // Custom window object
  debounce: 10  // Debounce time in ms
})
```

### Best Practices

1. **Uppercase naming**: Use `PascalCase` for views: `const Counter = View(0)`
2. **Destructure element/template views**: Use `const { App, Counter } = View`
3. **Call views to read/write**: `Counter()` to read, `Counter(5)` to write
4. **Template-first**: Write HTML templates with CSS, bind with minimal JavaScript
5. **Prefer templates**: HTML templates are more maintainable than programmatic DOM creation
6. **Always replace state**: Use spread/filter/map - never mutate arrays/objects
7. **Uppercase View attributes in HTML**: `View="UserCard"` required (not `View="userCard"`)
8. **Uppercase view references in JS**: `Title: 'text'` for descendant views, `class: 'active'` for attributes
9. **Lowercase tags**: `div`, `span` (factories, not unique elements)
9. **Explicit dependencies**: Use `View([deps], fn)` to control when computations rerun
10. **localStorage prefixes**: Use prefix argument to organize keys: `View(localStorage, 'prefix/')`
11. **2-step fetch pattern**: Always configure fetch in step 1, create remote view in step 2
12. **Destructure from View**: Use `const { div, span } = View` instead of `View.div`, `View.span`

### VanJS Enhancements

ViewJS is built on VanJS 1.5.3 and includes several enhancements that make reactive development more powerful:

**Fragment Support**
Reactive functions can return arrays of elements, enabling dynamic component composition:

```javascript
const { div, Container } = View
const renderItems = () => Items().map(item => 
  div({ class: 'item' }, item.name)
)

Container(renderItems)  // Automatically handles array of elements
```

Fragment support also works with conditional rendering:
```javascript
const { div, App } = View
const conditionalContent = () => [
  IsLoading() && div('Loading...'),
  HasError() && div({ class: 'error' }, Error()),
  Data() && div('Content loaded')
].filter(Boolean)

App(conditionalContent)
```

Templates with multiple root elements are automatically wrapped in document fragments. When a parent container only contains fragment children, the fragments unfold directly into the parent, preserving flexbox and grid layouts that require direct parent-child relationships.

**Explicit Updates**
Control when expensive computations run by explicitly declaring conditions, perfect for tab interfaces and performance optimization:

```javascript
const { UserList, SettingsPanel, div, App } = View

// Tab switching: only update when ActiveTab changes, not when content changes
const TabContent = View([ActiveTab], () => 
  ActiveTab() === 'users' ? 
    UserList({ users: AllUsers() }) :  // Won't re-render when AllUsers changes
  ActiveTab() === 'settings' ?
    SettingsPanel({ config: AppConfig() }) :  // Won't re-render when AppConfig changes
    div('Select a tab')
)

App(TabContent)
```

Without explicit conditions, this would re-render whenever `AllUsers` or `AppConfig` changes, even when those tabs aren't visible. With explicit conditions, it only re-renders when `ActiveTab` changes.

You can also force updates for stateless calls:
```javascript
// Force update on user action, regardless of other dependencies
const RefreshData = View([ForceUpdate], () => {
  // This runs when ForceUpdate changes, ignoring other state changes
  return fetchAndRenderExpensiveData()
})

// Trigger refresh manually
const handleRefresh = () => ForceUpdate(Date.now())
```

This prevents unnecessary re-renders and ensures proper cleanup of event listeners and DOM references in complex component hierarchies.

**Shorter Conditional Syntax**
ViewJS enables shorter conditional rendering by supporting the `&&` operator. It automatically filters out `false`, `null`, or `undefined` values but preserves the number zero. To handle zero values, use explicit comparisons like `value !== 0`:

```javascript
const { div, span } = View

// Concise conditional syntax - no ternary needed
const message = () => User() && `Welcome, ${User().name}!`
const errorDisplay = () => HasError() && div({ class: 'error' }, 'Something went wrong')
const count = () => Items().length > 0 && span(`${Items().length} items`)

// Instead of verbose ternaries
const message = () => User() ? `Welcome, ${User().name}!` : null
const errorDisplay = () => HasError() ? div({ class: 'error' }, 'Something went wrong') : null
const count = () => Items().length > 0 ? span(`${Items().length} items`) : null
```

Smart value handling preserves meaningful content while filtering out display issues:

```javascript
// These become empty strings
div(null)           // Empty div
span(undefined)     // Empty span  
p(false && 'text')  // Empty paragraph

// These preserve the actual value (numbers and strings are kept)
h1(0)              // Shows "0"
span('')           // Shows empty string
div(-1)            // Shows "-1"
```

This makes conditional rendering more concise while preventing `null`, `undefined`, or `false` from appearing as unwanted text in your UI.

**HTML-First Development**
Write component structure in HTML templates, then bind behavior with minimal JavaScript:

```html
<!-- Define structure in HTML -->
<template View="TodoApp">
  <div class="todo-container">
    <input View="NewTodo" placeholder="Add todo..." />
    <button View="AddBtn" class="btn-primary">Add</button>
    <div View="TodoList" class="todo-list"></div>
    <div View="Summary" class="summary"></div>
  </div>
</template>

<script type="module">
  import View from 'view.js'
  
  const Todos = View([])
  const NewTodo = View('')
  
  // Bind behavior to HTML structure
  const { App, TodoApp, div } = View
  App(
    TodoApp({
      NewTodo: { 
        oninput: e => NewTodo(e.target.value),
        value: () => NewTodo()
      },
      AddBtn: { 
        onclick: () => {
          if (NewTodo().trim()) {
            Todos([...Todos(), { id: Date.now(), text: NewTodo() }])
            NewTodo('')
          }
        }
      },
      TodoList: () => Todos().map(todo => 
        div({ class: 'todo-item' }, todo.text)
      ),
      Summary: () => `${Todos().length} todos`
    })
  )
</script>
```

This approach separates concerns cleanly: HTML handles structure and styling, JavaScript handles behavior and state management.