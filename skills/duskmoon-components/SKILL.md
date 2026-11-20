---
name: duskmoon-components
description: Integrate the native Duskmoon React component package in React or Next.js apps, including package styles, public subpath imports, props, and Dm workflow components.
---

# Duskmoon React Components

Use `@duskmoon-dev/components` with React 19, compatible `react-dom`, and the matching Web version of `@duskmoon-dev/core`. Import `@duskmoon-dev/components/styles.css` once in the app entry or Next.js App Router layout. Follow the app's server/client boundary for components that use state or browser APIs.

```tsx
import { Button } from "@duskmoon-dev/components/button";

export function SaveButton() {
  return <Button color="primary" appearance="filled" size="md">Save</Button>;
}
```

Prefer public subpath imports for feature code. The root export can mix multiple components and infrastructure helpers. Read the actual TypeScript props, including the package's compatibility helpers initially inspired by other libraries.

- Use `Button`, `Input`, `Table`, `Select`, and `Tabs` for native React building blocks.
- Use `DmLayout`, `DmSearch`, `DmTable`, and `DmProTable` for composed application workflows. For example, `@duskmoon-dev/components/dm-table` exports `DmTable` and `DmTableColumnsType`.
- Use `@duskmoon-dev/components/json-schema-form` for the schema-driven form and `@duskmoon-dev/components/chat` for composed chat. Configure optional rich-composer peers only for the rich entry the app uses.
- Use `@duskmoon-dev/components/theme`, `/classes`, and `/utils` for exported infrastructure helpers.

```tsx
import { Input } from "@duskmoon-dev/components/input";

export function SearchField() {
  return <Input.Search allowClear placeholder="Search records" onSearch={console.log} />;
}
```

Check the installed package's `exports` and TypeScript declarations for the version your app uses. See the [Web docs](https://duskmoon-dev.github.io/duskmoon-web/) for examples.
