import { NavLink, Outlet } from "react-router-dom";
import { LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const links = [
  { to: "/mi-cuenta/perfil", label: "Perfil", icon: UserIcon },
  { to: "/mi-cuenta/pedidos", label: "Pedidos", icon: Package },
  { to: "/mi-cuenta/direcciones", label: "Direcciones", icon: MapPin },
];

const AccountLayout = () => {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="container py-12 md:py-16">
      <div className="grid md:grid-cols-[260px,1fr] gap-8">
        <aside className="bg-surface border border-subtle rounded-2xl p-5 h-fit">
          <div className="pb-4 mb-4 border-b border-subtle">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cuenta</p>
            <p className="font-medium truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
          <nav className="flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary-glow"
                      : "text-foreground/80 hover:bg-surface-elevated"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-surface-elevated mt-2 border-t border-subtle pt-3"
              >
                <span className="text-primary-glow">→</span> Panel admin
              </NavLink>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-surface-elevated mt-2 border-t border-subtle pt-3"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default AccountLayout;
