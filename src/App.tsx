import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Layout } from "@/components/brraylab/Layout";
import { ProtectedRoute } from "@/components/brraylab/ProtectedRoute";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmed from "./pages/OrderConfirmed";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AccountLayout from "./pages/account/AccountLayout";
import Profile from "./pages/account/Profile";
import OrdersStub from "./pages/account/OrdersStub";
import AddressesStub from "./pages/account/AddressesStub";
import AdminStub from "./pages/admin/AdminStub";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "bg-surface border border-subtle text-foreground",
            description: "text-muted-foreground",
            success: "border-success/40",
            error: "border-destructive/40",
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tienda" element={<Shop />} />
                <Route path="/producto/:slug" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orden/:number" element={<OrderConfirmed />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/contacto" element={<Contact />} />

                {/* Auth */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/registro" element={<Register />} />
                <Route path="/auth/recuperar" element={<ForgotPassword />} />
                <Route path="/auth/reset" element={<ResetPassword />} />

                {/* Account (protected) */}
                <Route
                  path="/mi-cuenta"
                  element={
                    <ProtectedRoute>
                      <AccountLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="perfil" replace />} />
                  <Route path="perfil" element={<Profile />} />
                  <Route path="pedidos" element={<OrdersStub />} />
                  <Route path="direcciones" element={<AddressesStub />} />
                </Route>

                {/* Admin (protected + admin only) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminStub />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
