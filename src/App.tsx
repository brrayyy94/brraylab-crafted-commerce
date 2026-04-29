import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { Layout } from "@/components/brraylab/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

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
      <CartProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tienda" element={<Shop />} />
              <Route path="/producto/:slug" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/nosotros" element={<About />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
