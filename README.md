# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google Drive template import

Copy `.env.example` to `.env` and set the Google Cloud values:

- `VITE_GOOGLE_API_KEY`: an API key restricted to the Drive and Picker APIs and this app's web origins.
- `VITE_GOOGLE_CLIENT_ID`: an OAuth 2.0 web client ID with the app's local and deployed JavaScript origins authorized.
- `VITE_GOOGLE_APP_ID`: the Google Cloud project number used by Google Picker.

Enable the Google Drive API and Google Picker API in that project, then restart Vite after setting `.env`. The Drive Picker requests access only to files the user selects. Public shared-file links require "Anyone with the link" access; Picker can also access private files selected by the signed-in Google account. Supported imports are PDF, PPTX, PNG, JPG, and WebP. Google Slides, Docs, and Drawings are imported as PDFs. Every page of an imported PDF is saved as its own template; PDF artwork is flattened.
