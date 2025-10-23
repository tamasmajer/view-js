/**
 * ViewJS - Think in views. A tiny (<2.5KB) library for building reactive UIs by composing simple HTML containers.
 * github.com/tamasmajer/view-js
 * 
 * Usage: Add View="Name" attributes to HTML elements, then access them via View.Name
 */
// using vanjs-1.5.3.js (adapted)
const globalWindow = typeof window !== 'undefined' ? window : undefined
const ui = ({ window: ourWindow = globalWindow ?? globalThis, attribute: REF = 'View', value: VALUE = 'value', debounce = 10 } = {}) => {
    let ourDocument = ourWindow.document,
        ourFetch = ourWindow === globalWindow ? ourWindow.fetch.bind(ourWindow) : ourWindow.fetch,

        O = Object,
        protoOf = x => O.getPrototypeOf(x ?? 0),
        changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = { isConnected: 1 },
        gcCycleInMs = 1000, statesToGc, propSetterCache = {},
        objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined, arrProto = protoOf([]), strProto = protoOf(''),
        { stringify, parse } = JSON,
        hasUpper = c => c[0] >= 'A' && c[0] <= 'Z',
        hasLower = c => c[0] >= 'a' && c[0] <= 'z',

        // VANJS
        addAndScheduleOnFirst = (set, s, f, waitMs) =>
            (set ?? (setTimeout(f, waitMs), new Set)).add(s),
        runAndCaptureDeps = (f, deps, arg) => {
            let prevDeps = curDeps
            curDeps = deps
            try {
                return f(arg)
            } finally {
                curDeps = prevDeps
            }
        },
        keepConnected = l => l.filter(b => b._dom?.isConnected),
        addStatesToGc = d => statesToGc = addAndScheduleOnFirst(statesToGc, d, () => {
            for (let s of statesToGc)
                s._bindings = keepConnected(s._bindings),
                    s._listeners = keepConnected(s._listeners)
            statesToGc = _undefined
        }, gcCycleInMs),

        stateProto = {
            get val() {
                curDeps?._getters?.add(this)
                return this.rawVal
            },
            get oldVal() {
                curDeps?._getters?.add(this)
                return this._oldVal
            },
            set val(v) {
                curDeps?._setters?.add(this)
                if (v !== this.rawVal) {
                    this.rawVal = v
                    this._bindings.length + this._listeners.length ?
                        (derivedStates?.add(this), changedStates = addAndScheduleOnFirst(changedStates, this, updateDoms)) :
                        this._oldVal = v
                }
            },
            get [VALUE]() { return this.val },
            set [VALUE](v) { this.val = v },
        },
        state = initVal => ({
            __proto__: stateProto,
            rawVal: initVal,
            _oldVal: initVal,
            _bindings: [],
            _listeners: [],
        }),

        // PROXY HELPERS
        functionWithProps = (fn, getHandler) => new Proxy(fn, {
            get: (_, prop) => getHandler(prop),
            apply: (target, _, args) => target(...args)
        }),

        // Viewify: wrap state in callable proxy with property access for sub-views
        wrapState = s => functionWithProps(
            function (v) { return arguments.length === 0 ? s.val : (s.val = v) },
            prop => {
                // Return the state for internal access
                if (prop === '_state') return s

                // Handle sub-property access based on state value type
                const val = s.val

                // For DOM nodes/templates: find sub-element by ref name
                if (val?.nodeType || val?.content) {
                    const sub = findNode(prop, val.content ?? val)
                    // return subEl ? O.assign((...args) => bindTemplate(subEl, args), { [VALUE]: subEl }) : _undefined
                    if (sub) return sub.content ? wrapTemplate(sub) : wrapNode(sub)
                }

                // For localStorage proxy: return sub-key as viewified state
                // if (val?.getItem && val?.setItem) {
                //     // This shouldn't happen - createCache already handles this
                //     return _undefined
                // }

                // // For remote views: don't allow sub-properties
                // if (s._isRemote) return _undefined

                // Default: return undefined for non-existent properties
                return _undefined
            }
        ),

        bind = (f, dom) => {
            let deps = { _getters: new Set, _setters: new Set }, binding = { f }, prevNewDerives = curNewDerives
            curNewDerives = []
            let newDom = runAndCaptureDeps(f, deps, dom)
            if (protoOf(newDom) === arrProto) {
                let children = newDom.map(n => n?.nodeType ? n : new Text(n === false ? '' : n ?? ''))
                newDom = makeFragment()
                if (f.isTopFragment && newDom.tagName === ':') {
                    newDom.isTopFragment = true
                    newDom.toParent = dom.parentNode ?? null
                }
                add(newDom, ...children)
            }
            else newDom = newDom?.nodeType ? newDom : new Text(newDom === false ? '' : newDom ?? '')
            for (let d of deps._getters)
                deps._setters.has(d) || (addStatesToGc(d), d._bindings.push(binding))
            for (let l of curNewDerives) l._dom = newDom
            curNewDerives = prevNewDerives
            return binding._dom = newDom
        },

        derive = (f, s = state(), dom) => {
            let deps = { _getters: new Set, _setters: new Set }, listener = { f, s }
            listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom
            s.val = runAndCaptureDeps(f, deps, s.rawVal)
            for (let d of deps._getters)
                deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener))
            return s
        },

        add = (dom, ...children) => {
            children = children.flat(Infinity)
            const addToParent = dom.toParent
            if (!addToParent && children.length === 1 && children[0]?.toParent === null) {
                children[0].toParent = dom
                return add(children[0], [...children[0].children])
            }
            let to = addToParent ? dom.toParent : dom
            children = addToParent ? [...children, dom] : children
            if (addToParent) to.replaceChildren()
            for (let c of children) {
                let protoOfC = protoOf(c),
                    child = protoOfC === stateProto ? bind(() => c.val) :
                        protoOfC === funcProto ? bind(c) : c
                child != _undefined && to.append(child)
            }
            return dom
        },

        bindProps = (dom, props) => {
            for (let [k, v] of O.entries(props)) {
                let getPropDescriptor = proto => proto ?
                    O.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto)) :
                    _undefined,
                    cacheKey = dom.tagName + "," + k,
                    propSetter = propSetterCache[cacheKey] ??= getPropDescriptor(protoOf(dom))?.set ?? 0,
                    setter = k.startsWith("on") ?
                        (v, oldV) => {
                            let event = k.slice(2)
                            dom.removeEventListener(event, oldV)
                            dom.addEventListener(event, v)
                        } :
                        propSetter ? propSetter.bind(dom) : dom.setAttribute.bind(dom, k),
                    protoOfV = protoOf(v)
                k.startsWith("on") || protoOfV === funcProto && (v = derive(v), protoOfV = stateProto)
                protoOfV === stateProto ? bind(() => (setter(v.val, v._oldVal), dom)) : setter(v)
            }
        },

        tag = (ns, name, ...args) => {
            if (args.length === 1 && protoOf(args[0]) === arrProto) args = args[0]
            let [{ is, ...props }, ...children] = protoOf(args[0]) === objProto ? args : [{}, ...args],
                dom = ns?.nodeType ? ns : ns ? ourDocument.createElementNS(ns, name, { is }) : ourDocument.createElement(name, { is })
            bindProps(dom, props)
            return add(dom, children)
        },

        remove = (dom) => dom.remove(),
        replaceWith = (dom, newDom) => dom.replaceWith(newDom),
        update = (dom, newDom) => newDom ? newDom !== dom && replaceWith(dom, newDom) : remove(dom),
        updateDoms = () => {
            let iter = 0, derivedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
            do {
                derivedStates = new Set
                for (let l of new Set(derivedStatesArray.flatMap(s => s._listeners = keepConnected(s._listeners))))
                    derive(l.f, l.s, l._dom), l._dom = _undefined
            } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length)
            let changedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
            changedStates = _undefined
            for (let b of new Set(changedStatesArray.flatMap(s => s._bindings = keepConnected(s._bindings))))
                update(b._dom, bind(b.f, b._dom)), b._dom = _undefined
            for (let s of changedStatesArray) s._oldVal = s.rawVal
        },

        // TAG DECONSTRUCTION
        useTag = (name) => tag.bind(_undefined, _undefined, name),

        // DOM DECONSTRUCTION
        findNode = (refName, root = ourDocument) => refName === '' || root.matches?.(`[${REF}="${refName}"]`) ? root : (root.content ?? root).querySelector(`[${REF}="${refName}"]`),
        useNode = (name) => ((el = findNode(name)) => el ? O.assign((...args) => bindTemplate(el, args), { [VALUE]: el }) : _undefined)(),

        // TEMPLATE DECONSTRUCTION
        findTemplate = (templateName, root = ourDocument) => {
            for (let t of root.querySelectorAll('template')) {
                if (t.getAttribute(REF) === templateName) return t
                let subTemplate = findNode(templateName, t.content ?? t)
                if (subTemplate) return subTemplate
            }
        },
        useTemplate = (name, root = ourDocument) => ((t = findTemplate(name, root)) => t ? wrapTemplate(t) : _undefined)(),
        wrapTemplate = (template) => functionWithProps(
            (...args) => bindTemplate(template, args),
            prop => prop === VALUE ? template :
                ((sub = findNode(prop, template.content ?? template)) =>
                    sub ? (sub.content ? wrapTemplate(sub) : wrapNode(sub)) : _undefined)()
            // subEl ? O.assign((...args) => bindTemplate(subEl, args), { [VALUE]: subEl }) : _undefined)()
        ),

        // TEMPLATE BINDING
        fixArgs = (args) => protoOf(args[0]) === objProto ? args : [{}, ...args],
        makeFragment = () => ourDocument.createElement(':'),
        fragment = (...children) => add(makeFragment(), ...children),
        setChildren = (dom, ...children) => {
            dom.replaceChildren()
            add(dom, ...children)
        },
        // Remove tag attributes to avoid duplicates
        removeRefs = (element) => {
            element.querySelectorAll?.(`[${REF}]`).forEach(el => el.removeAttribute(REF))
            if (element.hasAttribute?.(REF)) element.removeAttribute(REF)
        },
        bindTemplate = (node, updates) => {
            let { content } = node
            let root =
                content ?
                    (content?.children?.length === 1 ?
                        content.children[0].cloneNode(1) :
                        fragment(...content.cloneNode(1).children)) :
                    node.isConnected ? node :
                        node.cloneNode(1)
            let [selectors, ...children] = fixArgs(updates),
                props = {}
            if (!children.length) for (let [k, v] of O.entries(selectors)) {
                if (hasLower(k)) props[k] = v
                else {
                    let node = findNode(k, root)
                    if (node) bindContent(node, v)
                }
            }
            bindContent(root, [props, ...children])
            if (root !== node) removeRefs(root)
            return root
        },
        bindContent = (node, v) => {
            if (protoOf(v) !== arrProto) v = [v]
            let o = (protoOf(v[0]) === objProto) && v.shift()
            // Unwrap views (callable proxies with _state) to get raw state
            if (v.length === 1 && v[0]?._state) v[0] = v[0]._state
            if (v.length === 1 && protoOf(v[0]) === funcProto) { v[0].isTopFragment = true; v[0] = bind(v[0], makeFragment()); }
            if (o) bindProps(node, o)
            if (v.length) setChildren(node, v)
            return node
        },

        // LOCALSTORAGE WRAPPER
        lsCache = new WeakMap(),
        wrapLocalStorage = (ls, lsStates, prefix) => new Proxy({}, {
            get: (_, key) => {
                const fullKey = prefix + key
                if (!lsStates[fullKey]) {
                    const item = ls.getItem(fullKey)
                    const s = state(item ? parse(item) : _undefined)  // Cache the state
                    lsStates[fullKey] = s
                    derive(() => {
                        const val = s.val  // Read to establish dependency
                        val === _undefined || val === null ? ls.removeItem(fullKey) : ls.setItem(fullKey, stringify(val))
                    })
                }
                return wrapState(lsStates[fullKey])  // Wrap on access (stateless wrapper)
            }
        }),
        makeLocalStorage = (ls, prefix = '') => {
            if (!lsCache.has(ls)) lsCache.set(ls, {})
            return wrapLocalStorage(ls, lsCache.get(ls), prefix)
        },

        // DOM NODE WRAPPER
        wrapNode = node => {
            const fn = (...args) => args.length ? bindContent(node, fixArgs(args)) : node
            return new Proxy(fn, {
                get: (_, prop) => {
                    // if (node === ourWindow) {

                    // }
                    if (prop === VALUE) return node
                    // Find sub-element by view attribute
                    const sub = findNode(prop, node.content ?? node)
                    return sub ? wrapNode(sub) : _undefined
                }
            })
        },

        // FETCH WRAPPER
        createRequest = (fetchFn, defaultConfig = {}) => {
            const requestFn = (c = {}) => {
                c = { ...defaultConfig, ...c }
                let { method, headers, body, query, loading, failed, result, path, url } = c;
                url = (url || '') + (path || '');
                if (query) url += (url.includes('?') ? '&' : '?') + new URLSearchParams(query);
                method ||= body !== undefined ? 'POST' : 'GET';
                headers = { 'Content-Type': 'application/json', ...headers };
                body = protoOf(body) === objProto ? stringify(body) : body;
                loading?.(url);
                return fetchFn(url, { method, headers, body })
                    .then(async response =>
                        response.ok ? await response.text()
                            .then(d => { try { d = parse(d) } catch { }; let d2 = result?.(d); return d2 === _undefined ? d : d2 })
                            : failed?.({ response })
                    )
                    .catch(error => failed?.({ error }))
                    .finally(() => loading?.())
            }
            return requestFn
        },

        // REMOTE VIEW
        // Creates a remote view that fetches data from HTTP endpoints
        // deps: array of dependencies that trigger refetch when changed
        // configFn: string (url) | object (config) | function (returns config)
        // baseRemote: optional remote view to extend (inherits url and headers)
        useFetch = (fetch, deps, configFn, options = {}) => {
            const { baseConfig = {} } = options
            const cache = state(_undefined), request = createRequest(fetch, {})
            cache._isRemote = true
            cache._fetch = fetch
            cache._baseConfig = baseConfig

            const getConfig = payload => {
                console.log('payload', payload)
                let base = protoOf(baseConfig) === funcProto ?
                    baseConfig(payload) : baseConfig
                if (protoOf(base) === strProto) base = { url: base }

                console.log('base', base)
                let config = protoOf(configFn) === strProto ? { url: configFn } :
                    protoOf(configFn) === funcProto ? configFn(payload) : configFn || {}

                console.log('config', config)
                if (protoOf(config) === strProto) config = { url: config }

                return { ...base, ...config, headers: { ...base.headers, ...config.headers } }
            }

            const makeRequest = payload => {
                const config = getConfig(payload)
                console.log({ config })
                request({
                    ...config,
                    body: payload === null || payload === _undefined ? _undefined : config.body,
                    result: data => { cache.val = data; config.result?.(data) }
                })
                return payload
            }

            if (deps) {
                derive(() => { deps.forEach(d => d.val); makeRequest() })
            } else if (protoOf(configFn) === funcProto) {
                derive(() => makeRequest())
            } else {
                makeRequest()
            }

            // Return simple remote view - NO config detection
            return O.assign(function (payload) {
                return arguments.length ? makeRequest(payload) : cache.val
            }, { _state: cache })
        },
        _useFetch = (fetch, deps, configFn, baseRemote) => {
            // Create cache state to store fetched data and request function
            const cache = state(_undefined), request = createRequest(fetch, {})
            cache._isRemote = true  // Mark as remote view for extending detection
            cache._fetch = fetch
            // Store base config for inheritance (from baseRemote or current config if it's an object)
            cache._baseConfig = baseRemote?._state?._baseConfig ||
                (protoOf(configFn) === objProto ? configFn : _undefined)

            // Build final config by merging base config with current config
            const getConfig = payload => {
                // Get base config (from extended remote view if provided)
                const base = baseRemote ?
                    (protoOf(baseRemote._state._baseConfig) === funcProto ?
                        baseRemote._state._baseConfig(payload) :  // Call if function
                        baseRemote._state._baseConfig) : {}       // Use directly if object

                // Get current config (handle string url, function, or object)
                let config = protoOf(configFn) === strProto ? { url: configFn } :
                    protoOf(configFn) === funcProto ? configFn(payload) : configFn || {}

                // If function returned a string, convert to config object
                if (protoOf(config) === strProto) config = { url: config }

                // Merge configs: base properties, then config properties, deep merge headers
                return { ...base, ...config, headers: { ...base.headers, ...config.headers } }
            }

            // Execute the HTTP request with merged config
            const makeRequest = payload => {
                const config = getConfig(payload)
                request({
                    ...config,
                    body: payload === null || payload === _undefined ? _undefined : config.body,
                    result: data => { cache.val = data; config.result?.(data) }  // Update cache and call callback
                })
                return payload
            }

            // Auto-fetch: if deps provided, explicitly track them; otherwise use derive to auto-track
            if (deps) {
                // Explicitly track provided dependencies
                derive(() => { deps.forEach(d => d.val); makeRequest() })
            } else if (protoOf(configFn) === funcProto) {
                // Auto-track dependencies accessed by function
                derive(() => makeRequest())
            } else {
                // Static config: fetch once
                makeRequest()
            }

            // Return callable function: call with payload to POST/refetch, call without to read cache
            return O.assign(function (payload) {
                return arguments.length ? makeRequest(payload) : cache.val
            }, { _state: cache })
        },

        // SIGNAL CREATION
        conditionalState = (states, f) => {
            const stateArray = protoOf(states) === arrProto ? states : [states];
            // let calcState = derive(() => stringify(stateArray.map(s => s._state ? s._state.val : s.val))),
            // let calcState = derive(() => stringify(stateArray.map(s =>
            //     s?._state?.val ?? (s?.val !== _undefined && s?._oldVal !== _undefined ? s.val : s)
            // ))),
            let calcState = derive(() => stringify(stateArray.map(s =>
                s?._state?.val ?? (s?._oldVal !== _undefined ? s.val : s)
            ))),
                currState, currView
            return () => currState === calcState.val ? currView : (currState = calcState.val) && (currView = f())
        },
        awaitResult = (fn) => {
            let result = state(_undefined), timer = null, isFirst = true,
                awaitDebounce = () => {
                    let value = fn()
                    clearTimeout(timer)
                    if (isFirst) {
                        isFirst = false
                        result.val = value?.then ? value : value
                    } else {
                        timer = setTimeout(async () => {
                            result.val = value?.then ? await value : value
                        }, debounce)
                    }
                    return value
                }
            derive(awaitDebounce)
            return result
        },
        makeState = function (v, f) {
            if (f) return awaitResult(conditionalState(v, f))
            if (protoOf(v) === funcProto) return awaitResult(v)
            return state(v)
        },

        // Helper: Create proxy that exposes reactive template properties
        wrapDocument = (docState) => {
            const templateCache = {} // Cache template functions to avoid recreating them

            return new Proxy(wrapState(docState), {
                get: (_, prop) => {
                    // Return cached template function if it exists
                    if (templateCache[prop]) return templateCache[prop]

                    // Create a reactive template state
                    const templateState = state(_undefined)
                    derive(() => {
                        const doc = docState.val
                        const template = doc && (findTemplate(prop, doc) || findNode(prop, doc))
                        templateState.val = template?.content
                            ? wrapTemplate(template)
                            : template ? wrapNode(template) : _undefined
                    })

                    // Create and cache a callable function that uses the current template value
                    const templateFn = functionWithProps(
                        (...args) => templateState.val ? templateState.val(...args) : _undefined,
                        subProp => templateState.val?.[subProp]
                    )

                    templateCache[prop] = templateFn
                    return templateFn
                },
                apply: (target, _, args) => target(...args)
            })
        },

        // Helper: Creates a fetch configurator (not a remote view yet!)
        createFetchConfigurator = (fetch, baseConfig = {}) => {
            return O.assign(function (...args) {
                // Step 2 can be:
                // 1. Fetch(config)                     → static extension
                // 2. Fetch([deps], configFn)           → conditional/reactive
                // 3. Fetch(configFn)                   → reactive (auto-deps)

                const [first, second] = args

                // Pattern: Fetch([deps], configFn)
                if (protoOf(first) === arrProto) {
                    return useFetch(fetch, first, second, { baseConfig })
                }

                // Pattern: Fetch(configFn) - reactive with auto-deps
                // else {
                //     return useFetch(fetch, null, first, { baseConfig })
                // }

                // Pattern: Fetch(config) - static config
                return useFetch(fetch, null, first, { baseConfig })
            }, {
                _isFetchConfigurator: true,
                _fetch: fetch,
                _baseConfig: baseConfig
            })
        },
        // MAIN ACCESS POINT: get → tags/templates, call → signals, constructor → configure 
        mainProxy = new Proxy(makeState, {
            apply: (target, thisArg, args) => {
                let [v, f] = args
                if (v === ourWindow || v?.nodeType) {
                    const rest = args.slice(1)
                    if (rest.length > 0) {
                        bindContent(v, fixArgs(rest))
                        return v
                    }
                    return wrapNode(v)
                }
                if (v?.getItem && v?.setItem) {
                    return makeLocalStorage(v, f)
                }
                if (v?.prototype?.parseFromString || v?.parseFromString) {
                    if (args.length === 1) return ((...args) => mainProxy(v, ...args))
                    const parser = v?.prototype?.parseFromString ? new v() : v
                    const docState = state(_undefined)
                    derive(() => {
                        const html = typeof f === 'function' ? f() : f?._state ? f() : f
                        docState.val = html ? parser.parseFromString(html, 'text/html') : _undefined
                    })
                    return wrapDocument(docState)
                }
                // Handle fetch
                // if (typeof v === 'function' && (v.name === 'fetch' || v.name === 'bound fetch')) {
                //     if (args.length === 1) return ((...args) => mainProxy(v, ...args))
                //     return protoOf(f) === arrProto ? useFetch(v, f, args[2]) : useFetch(v, null, f)
                // }
                if (typeof v === 'function' && (v.name === 'fetch' || v.name === 'bound fetch')) {
                    if (args.length === 1) return createFetchConfigurator(v, {})
                    return createFetchConfigurator(v, f)  // f is the base config
                }

                // Handle extending configurator
                if (v?._isFetchConfigurator) {
                    return useFetch(v._fetch, null, f, { baseConfig: v._baseConfig })
                }
                // Handle extending remote views - View(RemoteView, config)
                if (v?._state?._isRemote) {
                    return useFetch(v._state._fetch, null, f, v)  // Pass base remote view
                }
                return wrapState(target(...args))  // Wrap signalFunction returns
            },
            construct: (target, args) => ui(...args),
            get: (_, name) =>
                name === VALUE ? ((...args) => wrapState(makeState(...args))) :
                    (
                        hasUpper(name) ? useTemplate(name) || useNode(name)
                            || name === 'Window' && ((arg, ...args) => mainProxy(ourWindow, arg ?? {}, ...args))
                            || name === 'Document' && ((arg, ...args) => mainProxy(ourWindow.document, arg ?? {}, ...args))
                            || name === 'LocalStorage' && mainProxy(ourWindow.localStorage) //((...args) => mainProxy(ourWindow.localStorage, ...args))
                            || name === 'Fetch' && createFetchConfigurator(ourFetch, {}) //((...args) => mainProxy(ourFetch, ...args))
                            || name === 'DomParser' && ((...args) => mainProxy(ourWindow.DOMParser, ...args))
                            || (() => { throw new Error(`Template or element with ${REF}="${name}" not found`) })()
                            : useTag(name)
                    )
        }),
        storageListener = e => {
            const lsSignals = lsCache.get(ourWindow.localStorage)
            if (lsSignals?.[e.key]) {
                lsSignals[e.key].val = parse(e.newValue)  // Update state's .val property directly
            }
        }

    // Cross-tab localStorage synchronization
    addEventListener('storage', storageListener)

    return mainProxy
}

export default ui({ attribute: 'View' })
