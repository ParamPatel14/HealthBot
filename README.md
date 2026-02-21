# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Running the Application Locally
1. **Backend:** `cd backend && python main.py`
2. **Frontend:** `npm run dev`

## Doctor Test Accounts
The database automatically seeds 6 doctors you can use to test the Doctor Review Portal. When logging in, select the **"Doctor"** toggle.

**Global Password for all doctors:** `doctor123`

| Specialization | Doctor Name | Email Login |
| --- | --- | --- |
| Cardiology | Dr. Sarah Chen | `sarah.chen@hal.health` |
| Dermatology | Dr. James Patel | `james.patel@hal.health` |
| Orthopedics | Dr. Maria Gonzalez | `maria.gonzalez@hal.health` |
| Neurology | Dr. Ahmed Khan | `ahmed.khan@hal.health` |
| Pulmonology | Dr. David Lee | `david.lee@hal.health` |
| General | Dr. Emily Woods | `emily.woods@hal.health` |
