import { QueryClient } from "@tanstack/react-query";
import { createRouter, createRoute } from "@tanstack/react-router";
import { Home } from "./routes/index";
import { CartPage } from "./routes/cart";
import { CheckoutPage } from "./routes/checkout";
import { LoginPage } from "./routes/login";
import { RegisterPage } from "./routes/register";
import { ForgotPasswordPage } from "./routes/forgot-password";
import { ResetPasswordPage } from "./routes/reset-password";
import { OrdersPage } from "./routes/orders";
import { ProductDetailPage } from "./routes/product-detail";
import { ProfilePage } from "./routes/profile";
import { LegalPage } from "./routes/legal";
import { AdminLayout } from "./routes/admin-layout";
import { AdminDashboard } from "./routes/admin-dashboard";
import { AdminOrdersPage } from "./routes/admin-orders";
import { AdminProductsPage } from "./routes/admin-products";
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

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: () => <LegalPage defaultTab="terms" />,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: () => <LegalPage defaultTab="privacy" />,
});

const returnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/returns",
  component: () => <LegalPage defaultTab="returns" />,
});

const shippingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shipping",
  component: () => <LegalPage defaultTab="shipping" />,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  component: ProductDetailPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin",
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin",
  component: AdminDashboard,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/orders",
  component: AdminOrdersPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/products",
  component: AdminProductsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  cartRoute,
  checkoutRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  termsRoute,
  privacyRoute,
  returnsRoute,
  shippingRoute,
  ordersRoute,
  productDetailRoute,
  profileRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminOrdersRoute,
    adminProductsRoute,
  ]),
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
