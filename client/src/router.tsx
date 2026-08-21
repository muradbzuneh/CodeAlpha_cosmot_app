import { QueryClient } from "@tanstack/react-query";
import { createRouter, createRoute } from "@tanstack/react-router";
import { Home } from "./routes/index";
import { CartPage } from "./routes/cart";
import { CheckoutPage } from "./routes/checkout";
import { LoginPage } from "./routes/login";
import { RegisterPage } from "./routes/register";
import { Route as rootRoute } from "./routes/__root";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  cartRoute,
  checkoutRoute,
  loginRoute,
  registerRoute,
]);

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
