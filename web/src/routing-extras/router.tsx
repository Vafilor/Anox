import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from '../routeTree.gen'
import NotFound from './not-found';

// Create a new router instance
export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
    context: {
        // auth will initially be undefined
        // We'll be passing down the auth state from within a React component
        auth: undefined!,
    }
});
