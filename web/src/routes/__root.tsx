import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AuthContextInterface } from '../auth/authContext';

interface MyRouterContext {
    auth: AuthContextInterface;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: RootComponent
})

function RootComponent() {
    return (
        <>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    );
}