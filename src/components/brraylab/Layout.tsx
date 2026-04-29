import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MiniCart } from "./MiniCart";
import { WhatsAppFab } from "./WhatsAppFab";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 pt-16">{children}</main>
    <Footer />
    <MiniCart />
    <WhatsAppFab />
  </div>
);
