# PropNest Frontend

PropNest is a responsive MERN rental platform frontend with a public landing page, API-backed authentication, role-based dashboards, Cloudinary property photographs, and role-aware PropNest AI assistants.

## Run locally

```bash
npm install
npm run dev
```

Set `VITE_API_URL` to the backend API base URL when it is not `http://localhost:5000/api`. Set `VITE_SOCKET_URL` when Socket.IO is hosted on a different origin; locally it defaults to `http://localhost:5000`.

## Implemented flows

- Public landing page with discovery, trust, owner, and onboarding sections.
- Login and signup with tenant/property-owner roles, inline validation, and API error states.
- Protected router entry to tenant, property-owner, and admin workspaces.
- Tenant property search, filters, approved listing details, rental requests, and AI assistant.
- Owner listing CRUD, five-image Cloudinary upload, drag-and-drop selection, previews, and image deletion.
- Admin property moderation, uploaded-photo inspection, user list, platform summaries, and AI assistant.

Property images shown in authenticated discovery and moderation views come from the property record returned by the backend. The local fallback is used only when a record has no uploaded image.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
