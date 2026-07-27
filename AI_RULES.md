# AI Development Rules

This document outlines the technology stack and provides clear rules for which libraries to use for specific functionalities within this application.

## Tech Stack

This project is built with a modern, type-safe, and efficient technology stack:

-   **Framework:** React with Vite for a fast development experience.
-   **Language:** TypeScript for static typing and improved code quality.
-   **Styling:** Tailwind CSS for a utility-first styling approach.
-   **UI Components:** shadcn/ui, a collection of beautifully designed, accessible, and composable React components.
-   **Routing:** React Router (`react-router-dom`) for client-side navigation.
-   **Forms:** React Hook Form for performant and flexible form state management.
-   **Schema Validation:** Zod for powerful and type-safe data validation.
-   **Data Fetching & Caching:** TanStack Query (`@tanstack/react-query`) for managing server state.
-   **Icons:** Lucide React for a comprehensive and consistent set of icons.

## Library Usage Rules

To maintain consistency and code quality, please adhere to the following rules:

-   **UI Components:**
    -   **ALWAYS** use components from the `shadcn/ui` library (`@/components/ui/*`) for all standard UI elements (buttons, inputs, cards, dialogs, etc.).
    -   If a required component does not exist in `shadcn/ui`, create a new reusable component in `src/components/` following the same composition and styling principles.

-   **Styling:**
    -   **ALWAYS** use Tailwind CSS utility classes for styling.
    -   Avoid writing custom CSS in `.css` files. Global styles are defined in `src/index.css` and should only be modified for base theme variables (colors, fonts, etc.).

-   **Routing:**
    -   Use `react-router-dom` for all routing and navigation needs.
    -   All routes **MUST** be defined in `src/App.tsx`.

-   **Forms:**
    -   **ALWAYS** use `react-hook-form` to manage form state, validation, and submissions.
    -   Use the provided `Form` components from `shadcn/ui` which are built on top of `react-hook-form`.

-   **Data Validation:**
    -   **ALWAYS** use `zod` to define schemas for form validation and API data structures.
    -   Use `@hookform/resolvers` to connect your Zod schemas with `react-hook-form`.

-   **Icons:**
    -   **ONLY** use icons from the `lucide-react` library to ensure visual consistency.

-   **Notifications:**
    -   Use the custom `useToast` hook (`@/hooks/use-toast.ts`) for standard toast notifications.
    -   Use `sonner` for more complex or differently styled notifications, which is also integrated in `App.tsx`.

-   **State Management:**
    -   For server state (data fetched from an API), **ALWAYS** use `@tanstack/react-query`.
    -   For simple, local component state, use React's built-in `useState` and `useReducer` hooks. Avoid introducing complex global state management libraries like Redux or Zustand unless absolutely necessary.