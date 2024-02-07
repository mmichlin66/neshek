# Neshek: Schema driven data access, API and UI framework

[![npm version](https://badge.fury.io/js/neshek.svg)](https://badge.fury.io/js/neshek)

Neshek is a schema driven data access, API and UI framework.

* [Motivation](#motivation)
* [Features](#features)
* [Usage](#usage)
* [Quick Start](#quick-start)

## Motivation

## Features

## Usage
To install the Neshek library for development use the following NPM command:

```shell
npm i neshek
```

Neshek library comes in two variants:

- `neshek.js` - the minified build of the library, which should be used to build production versions of applications. This build creates very short but meaningless names for CSS classes and other named entities.
- `neshek.dev.js` - the debug build of the library, which should be used during application development. This build creates names for CSS classes and other named entities, which are easily traceable to the source code. This build also prints helpful diagnostic messages.

Neshek contains many exported types and functions; therefore, it is recommended to import the entire module under a single name:

```tsx
import * as css from "neshek"
```

Neshek provides [Guide](https://www.neshek.com/guide/introduction.html) and [Reference](https://www.neshek.com/typedoc.html) documents for developers. Both documents undergo constant improvements. Neshek also provides a [Playground](https://www.neshek.com/demo/neshek/playground.html), where you can write TypeScript code using Neshek features and immediately see the results.

## Quick Start
