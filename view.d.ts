// Base types
type Value<T> = T;
type Getter<T> = () => T;

// Reactive types
type Derived<T> = {
  (): T;
}

type State<T> = {
  (): T;
  (value: T): T;
}

type Reactive<T> = Derived<T> | State<T>;

// Content types
type Content<T> = Value<T> | Getter<T> | Reactive<T>;
type EventHandler = (event: Event) => void;

// Configuration types
type Props = {
  [key: string]: Content<any> | EventHandler;
}

type Binding =
  | Content<any>
  | Array<Content<any>>
  | Props
  | [Props, ...Array<Content<any>>];

type Bindings = {
  [key: string]: Binding;
}

// DOM Element types
type TagFn = {
  (): HTMLElement;
  (props: Props): HTMLElement;
  (...children: Array<Content<any>>): HTMLElement;
  (props: Props, ...children: Array<Content<any>>): HTMLElement;
}

type TemplateFn = {
  (): Element;
  (bindings: Bindings): Element;
  [ViewName: string]: TemplateFn;
}

type ElementRef = {
  (): Element;
  (bindings: Bindings): Element;
  (...children: Array<Content<any>>): Element;
  (props: Props, ...children: Array<Content<any>>): Element;
}

type WindowRef = {
  (): Window;
  (props: Props): Window;
}

type DocumentRef = {
  (): Document;
  (props: Props): Document;
}

// Storage types
type StorageFn = {
  [key: string]: State<any>;
}

// HTTP/Remote types
type FetchConfig = {
  url?: Content<string>;
  path?: Content<string>;
  query?: Record<string, Content<any>>;
  body?: Content<any>;
  method?: Content<string>;
  headers?: Record<string, Content<string>>;
  loading?: (url?: string) => void;
  failed?: (info: { response?: Response; error?: Error }) => void;
  result?: (data: any) => any;
}

type FetchFn = {
  (): Remote;
  (config: FetchConfig | (() => FetchConfig)): Remote;
  (triggers: Array<Reactive<any>>, config: FetchConfig | (() => FetchConfig)): Remote;
}

type Remote = State<any>

// Document/Parser types
type DocumentContext = Derived<Document | undefined> & {
  [ViewName: string]: TemplateFn;
}

type ParserFn = {
  (html: Content<string>): DocumentContext;
}

// Main ViewJS constructor
interface View {
  <T>(value: T): State<T>;
  <T>(fn: () => T): Derived<T>;
  <T>(triggers: Array<Reactive<any>>, fn: () => T): Derived<T>;

  [tagName: string]: TagFn;
  [ViewName: string]: TemplateFn | ElementRef;

  Window: WindowRef;
  Document: DocumentRef;
  Fetch: FetchFn;
  DomParser: ParserFn;
  LocalStorage: StorageFn;

  (window: Browser.Window): WindowRef;
  (document: Document): DocumentRef;
  (node: Node): ElementRef;

  (fetchFn: Browser.Fetch, config?: FetchConfig): FetchFn;
  (parser: Browser.DOMParserConstructor | Browser.DOMParser): ParserFn;
  (storage: Browser.Storage, prefix?: string): StorageFn;

  (config: {
    window: Browser.Window;
    attribute?: string;
  }): View;
}

// Browser types
namespace Browser {
  export interface Storage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    readonly length: number;
    key(index: number): string | null;
  }

  export interface Fetch {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }

  export interface DOMParser {
    parseFromString(str: string, type: string): Document;
  }

  export interface DOMParserConstructor {
    prototype: {
      parseFromString(str: string, type: string): Document;
    };
    new(): DOMParser;
  }

  export interface Window {
    document: Document;
    fetch?: Fetch;
    localStorage?: Storage;
    DOMParser?: DOMParserConstructor;
  }
}

declare const Reactive: View;
export default Reactive;