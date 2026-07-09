# OpenBG

A free, open source, single-page web app to remove image backgrounds — entirely
in the browser. No servers, no uploads: your images never leave your device.

Built with [TanStack Start](https://tanstack.com/start), React, Tailwind CSS,
and [`@imgly/background-removal`](https://github.com/imgly/background-removal-js)
(runs an ONNX model client-side via WebAssembly / WebGPU).

## Features

- Upload via click or drag & drop
- One-click background removal, running fully on the frontend
- Download the result as a transparent PNG
- Clean, responsive black-and-white UI

## Development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Production

```bash
npm run build
npm run start
```
