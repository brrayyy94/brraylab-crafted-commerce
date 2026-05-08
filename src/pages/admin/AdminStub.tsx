import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  Check,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json, Tables } from "@/integrations/supabase/types";
import { formatPrice } from "@/data/products";
import { cn } from "@/lib/utils";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type CategoryRow = Tables<"categories">;
type ProductBase = Tables<"products">;
type ProductRow = ProductBase & { categories?: Pick<CategoryRow, "id" | "name" | "slug"> | null };
type OrderAddress = Tables<"order_addresses">;
type OrderItem = Tables<"order_items">;
type OrderRow = Tables<"orders"> & { order_addresses?: OrderAddress[] | OrderAddress | null };
type ProfileRow = Tables<"profiles">;
type ReviewRow = Tables<"reviews"> & {
  products?: { name: string } | null;
  profile?: Pick<ProfileRow, "name" | "email"> | null;
};

type SectionKey = "dashboard" | "productos" | "categorias" | "pedidos" | "clientes" | "resenas" | "mensajes" | "hero";

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  short_desc: string;
  description: string;
  price: string;
  compare_price: string;
  stock: string;
  category_id: string;
  badge: string;
  featured: boolean;
  active: boolean;
  images: string[];
};

const navItems: Array<{ key: SectionKey; to: string; label: string; icon: ComponentType<{ className?: string }> }> = [
  { key: "dashboard", to: "/admin", label: "Dashboard", icon: BarChart3 },
  { key: "productos", to: "/admin/productos", label: "Productos", icon: Boxes },
  { key: "categorias", to: "/admin/categorias", label: "Categorías", icon: Layers },
  { key: "pedidos", to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { key: "clientes", to: "/admin/clientes", label: "Clientes", icon: Users },
  { key: "resenas", to: "/admin/resenas", label: "Reseñas", icon: MessageSquare },
  { key: "mensajes", to: "/admin/mensajes", label: "Mensajes", icon: Mail },
  { key: "hero", to: "/admin/hero", label: "Hero", icon: ImageIcon },
];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-warning/30 bg-warning/15 text-warning",
  processing: "border-info/30 bg-info/15 text-info",
  shipped: "border-primary/30 bg-primary/15 text-primary-glow",
  delivered: "border-success/30 bg-success/15 text-success",
  cancelled: "border-destructive/30 bg-destructive/15 text-destructive",
};

const emptyProductForm: ProductForm = {
  name: "",
  slug: "",
  short_desc: "",
  description: "",
  price: "",
  compare_price: "",
  stock: "0",
  category_id: "none",
  badge: "none",
  featured: false,
  active: true,
  images: [],
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));

const toNumber = (value: unknown) => Number(value ?? 0);

const getOrderAddress = (order: OrderRow): OrderAddress | null => {
  const address = order.order_addresses;
  if (!address) return null;
  return Array.isArray(address) ? address[0] ?? null : address;
};

const imagePathFromPublicUrl = (url: string) => {
  const marker = "/storage/v1/object/public/product-images/";
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
};

const AdminStub = () => {
  const { pathname } = useLocation();
  const section = (pathname.split("/")[2] || "dashboard") as SectionKey;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="lg:pl-[260px]">
        <div className="border-b border-subtle bg-background/95 lg:hidden">
          <div className="flex items-center gap-3 overflow-x-auto px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
                  section === item.key ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 lg:px-10">
          {section === "productos" && <ProductsSection />}
          {section === "categorias" && <CategoriesSection />}
          {section === "pedidos" && <OrdersSection />}
          {section === "clientes" && <CustomersSection />}
          {section === "resenas" && <ReviewsSection />}
          {section === "mensajes" && <MessagesSection />}
          {section === "hero" && <HeroSettingsSection />}
          {(section === "dashboard" || !navItems.some((item) => item.key === section)) && <DashboardSection />}
        </div>
      </main>
    </div>
  );
};

const AdminSidebar = () => {
  const { data: counts = { pedidos: 0, resenas: 0, mensajes: 0 } } = useQuery({
    queryKey: ["admin-sidebar-counts"],
    queryFn: async () => {
      const [pedidos, resenas, mensajes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false),
      ]);
      return {
        pedidos: pedidos.count ?? 0,
        resenas: resenas.count ?? 0,
        mensajes: mensajes.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const countFor = (key: SectionKey) =>
    key === "pedidos" ? counts.pedidos : key === "resenas" ? counts.resenas : key === "mensajes" ? counts.mensajes : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-subtle bg-surface lg:flex">
      <div className="border-b border-subtle p-6">
        <Link to="/" className="flex items-center gap-3" aria-label="BrrayLab inicio">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary shadow-purple-soft">
            <span className="font-display text-lg font-black text-primary-foreground">B</span>
          </span>
          <span className="font-display text-xl font-black text-foreground">
            Brray<span className="text-primary-glow">Lab</span>
          </span>
        </Link>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const count = countFor(item.key);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <span className="relative inline-flex">
                <item.icon className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#ef4444] text-white text-[10px] font-bold leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className="flex-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-subtle p-4 text-xs text-muted-foreground">Lovable Cloud conectado</div>
    </aside>
  );
};

const PageHeader = ({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <p className="mb-2 text-xs uppercase tracking-widest text-primary-glow">{eyebrow}</p>
      <h1 className="font-display text-3xl font-black normal-case md:text-5xl">{title}</h1>
    </div>
    {action}
  </div>
);

const MetricCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) => (
  <div className="rounded-md border border-subtle bg-surface p-5">
    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary-glow">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-2xl font-black text-foreground">{value}</p>
  </div>
);

const LoadingPanel = () => (
  <div className="flex min-h-[260px] items-center justify-center rounded-md border border-subtle bg-surface">
    <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
  </div>
);

const DashboardSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayOrders, monthOrders, pending, customers, latest] = await Promise.all([
        supabase.from("orders").select("total").gte("created_at", today.toISOString()).lt("created_at", tomorrow.toISOString()),
        supabase.from("orders").select("total").gte("created_at", monthStart.toISOString()),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id, order_number, user_id, guest_email, status, total, created_at, order_addresses(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (todayOrders.error) throw todayOrders.error;
      if (monthOrders.error) throw monthOrders.error;
      if (pending.error) throw pending.error;
      if (customers.error) throw customers.error;
      if (latest.error) throw latest.error;

      return {
        salesToday: (todayOrders.data ?? []).reduce((sum, order) => sum + toNumber(order.total), 0),
        salesMonth: (monthOrders.data ?? []).reduce((sum, order) => sum + toNumber(order.total), 0),
        pendingCount: pending.count ?? 0,
        customersCount: customers.count ?? 0,
        latestOrders: (latest.data ?? []) as unknown as OrderRow[],
      };
    },
  });

  if (isLoading) return <LoadingPanel />;

  return (
    <section>
      <PageHeader eyebrow="Dashboard" title="Resumen de operación" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas hoy" value={formatPrice(data?.salesToday ?? 0)} icon={BarChart3} />
        <MetricCard label="Ventas del mes" value={formatPrice(data?.salesMonth ?? 0)} icon={ShoppingBag} />
        <MetricCard label="Pedidos pendientes" value={String(data?.pendingCount ?? 0)} icon={Package} />
        <MetricCard label="Clientes totales" value={String(data?.customersCount ?? 0)} icon={Users} />
      </div>
      <DataPanel title="Últimos 10 pedidos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.latestOrders ?? []).map((order) => {
              const address = getOrderAddress(order);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{address?.full_name ?? order.guest_email ?? "Invitado"}</TableCell>
                  <TableCell>{formatPrice(toNumber(order.total))}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatShortDate(order.created_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataPanel>
    </section>
  );
};

const DataPanel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-md border border-subtle bg-surface">
    <div className="border-b border-subtle px-5 py-4">
      <h2 className="font-display text-lg font-bold normal-case">{title}</h2>
    </div>
    <div className="p-2 md:p-4">{children}</div>
  </div>
);

const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>
    {statusLabels[status]}
  </Badge>
);

const useAdminCategories = () =>
  useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, active").order("name");
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

const useAdminProducts = () =>
  useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, short_desc, description, price, compare_price, stock, category_id, badge, featured, active, images, created_at, updated_at, categories(id, name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProductRow[];
    },
  });

const ProductsSection = () => {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: categories = [] } = useAdminCategories();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyProductForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openNew = () => {
    setForm(emptyProductForm);
    setSlugTouched(false);
    setDrawerOpen(true);
  };

  const openEdit = (product: ProductRow) => {
    const images = Array.isArray(product.images) ? product.images.filter((item): item is string => typeof item === "string") : [];
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      short_desc: product.short_desc ?? "",
      description: product.description ?? "",
      price: String(product.price),
      compare_price: product.compare_price ? String(product.compare_price) : "",
      stock: String(product.stock),
      category_id: product.category_id ?? "none",
      badge: product.badge ?? "none",
      featured: product.featured,
      active: product.active,
      images,
    });
    setSlugTouched(true);
    setDrawerOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("El nombre es obligatorio");
      if (!form.slug.trim()) throw new Error("El slug es obligatorio");
      const stockRaw = (form.stock ?? "").toString().trim();
      if (stockRaw === "") throw new Error("El stock es requerido (mínimo 0)");
      const stockNumber = Number(stockRaw);
      if (!Number.isFinite(stockNumber) || stockNumber < 0 || !Number.isInteger(stockNumber)) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0");
      }
      const priceNumber = Number(form.price);
      if (!Number.isFinite(priceNumber) || priceNumber <= 0) throw new Error("El precio debe ser mayor a cero");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        short_desc: form.short_desc.trim() || null,
        description: form.description.trim() || null,
        price: priceNumber,
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock: stockNumber,
        category_id: form.category_id === "none" ? null : form.category_id,
        badge: form.badge === "none" ? null : form.badge,
        featured: form.featured,
        active: form.active,
        images: form.images as Json,
      };
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Producto guardado");
      setDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Estado actualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("No se pudo actualizar el producto"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Producto eliminado");
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("No se pudo eliminar el producto"),
  });

  const updateForm = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm((current) => {
      if (field === "name" && !slugTouched) {
        return { ...current, name: value as string, slug: slugify(value as string) };
      }
      return { ...current, [field]: value };
    });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const slug = form.slug || slugify(form.name);
    if (!slug) {
      toast.error("Agrega un nombre o slug antes de subir imágenes");
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `products/${slug}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
      toast.success("Imágenes subidas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron subir las imágenes");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    setForm((current) => ({ ...current, images: current.images.filter((image) => image !== url) }));
    const path = imagePathFromPublicUrl(url);
    if (path) await supabase.storage.from("product-images").remove([path]);
  };

  return (
    <section>
      <PageHeader
        eyebrow="Productos"
        title="Catálogo editable"
        action={
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        }
      />
      {isLoading ? (
        <LoadingPanel />
      ) : (
        <DataPanel title="Productos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Precio oferta</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const images = Array.isArray(product.images) ? product.images.filter((item): item is string => typeof item === "string") : [];
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={images[0] ?? "/placeholder.svg"}
                        alt={product.name}
                        className="h-12 w-12 rounded-md bg-surface-elevated object-cover"
                      />
                    </TableCell>
                    <TableCell className="min-w-[220px] font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name ?? "Sin categoría"}</TableCell>
                    <TableCell>{formatPrice(toNumber(product.price))}</TableCell>
                    <TableCell>{product.compare_price ? formatPrice(toNumber(product.compare_price)) : "—"}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Switch checked={product.active} onCheckedChange={(active) => toggleMutation.mutate({ id: product.id, active })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="outline" className="border-subtle bg-surface-elevated" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción elimina {product.name} del catálogo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto border-subtle bg-surface p-0 sm:max-w-2xl">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>{form.id ? "Editar producto" : "Nuevo producto"}</SheetTitle>
              <SheetDescription>Los cambios se guardan directamente en Lovable Cloud.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 grid gap-5">
              <FormField label="Nombre del producto">
                <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="bg-surface-elevated border-subtle" />
              </FormField>
              <FormField label="Slug">
                <Input
                  value={form.slug}
                  onChange={(event) => { setSlugTouched(true); updateForm("slug", slugify(event.target.value)); }}
                  className="bg-surface-elevated border-subtle"
                />
              </FormField>
              <FormField label="Descripción corta (max 150 caracteres)">
                <Input maxLength={150} value={form.short_desc} onChange={(event) => updateForm("short_desc", event.target.value)} className="bg-surface-elevated border-subtle" />
              </FormField>
              <FormField label="Descripción larga">
                <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="min-h-40 bg-surface-elevated border-subtle" />
              </FormField>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Precio">
                  <Input type="number" value={form.price} onChange={(event) => updateForm("price", event.target.value)} className="bg-surface-elevated border-subtle" />
                </FormField>
                <FormField label="Precio tachado / oferta">
                  <Input type="number" value={form.compare_price} onChange={(event) => updateForm("compare_price", event.target.value)} className="bg-surface-elevated border-subtle" />
                </FormField>
                <FormField label="Stock">
                  <Input type="number" min={0} step={1} required value={form.stock} onChange={(event) => updateForm("stock", event.target.value)} className="bg-surface-elevated border-subtle" />
                  {(form.stock ?? "").toString().trim() === "" && (
                    <p className="text-xs text-destructive">El stock es requerido (mínimo 0)</p>
                  )}
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Categoría">
                  <Select value={form.category_id} onValueChange={(value) => updateForm("category_id", value)}>
                    <SelectTrigger className="bg-surface-elevated border-subtle"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Badge">
                  <Select value={form.badge} onValueChange={(value) => updateForm("badge", value)}>
                    <SelectTrigger className="bg-surface-elevated border-subtle"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      <SelectItem value="Nuevo">Nuevo</SelectItem>
                      <SelectItem value="Más vendido">Más vendido</SelectItem>
                      <SelectItem value="Últimas unidades">Últimas unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ToggleRow label="Destacado en inicio" checked={form.featured} onChange={(checked) => updateForm("featured", checked)} />
                <ToggleRow label="Activo" checked={form.active} onChange={(checked) => updateForm("active", checked)} />
              </div>
              <div className="rounded-md border border-subtle bg-background/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Imágenes</Label>
                    <p className="mt-1 text-xs text-muted-foreground">La primera imagen es la principal.</p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Subir
                    <input type="file" multiple accept="image/*" className="sr-only" onChange={(event) => uploadImages(event.target.files)} />
                  </label>
                </div>
                {form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {form.images.map((image, index) => (
                      <div key={image} className="group relative aspect-square overflow-hidden rounded-md border border-subtle bg-surface-elevated">
                        <img src={image} alt={`Imagen ${index + 1}`} className="h-full w-full object-cover" />
                        {index === 0 && <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">Principal</Badge>}
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Eliminar imagen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (form.stock ?? "").toString().trim() === ""} className="h-12 bg-primary hover:bg-primary/90">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar producto
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

const FormField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between rounded-md border border-subtle bg-surface-elevated px-4 py-3">
    <Label>{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const CategoriesSection = () => {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, active, order")
        .order("order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const updateImage = async (category: CategoryRow, file: File) => {
    setUploadingId(category.id);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `categories/${category.slug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("categories")
        .update({ image_url: data.publicUrl })
        .eq("id", category.id);
      if (dbErr) throw dbErr;
      // remove old image if it lived in our bucket
      if (category.image_url) {
        const oldPath = imagePathFromPublicUrl(category.image_url);
        if (oldPath && oldPath !== path) {
          await supabase.storage.from("product-images").remove([oldPath]);
        }
      }
      toast.success("Imagen actualizada");
      await queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <section>
      <PageHeader eyebrow="Categorías" title="Imágenes de categorías" />
      {isLoading ? (
        <LoadingPanel />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-md border border-subtle bg-surface overflow-hidden">
              <div className="aspect-video bg-surface-elevated overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  {uploadingId === cat.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) updateImage(cat, file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

type HeroBgType = "none" | "image" | "video";
type HeroSettingsValue = {
  type: HeroBgType;
  image_url: string | null;
  video_url: string | null;
  overlay_opacity: number;
};

const HeroSettingsSection = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-hero-settings"],
    queryFn: async (): Promise<HeroSettingsValue> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<HeroSettingsValue>;
      return {
        type: (v.type as HeroBgType) ?? "none",
        image_url: v.image_url ?? null,
        video_url: v.video_url ?? null,
        overlay_opacity: typeof v.overlay_opacity === "number" ? v.overlay_opacity : 0.5,
      };
    },
  });

  const [draft, setDraft] = useState<HeroSettingsValue | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  const current: HeroSettingsValue = draft ?? settings ?? { type: "none", image_url: null, video_url: null, overlay_opacity: 0.5 };

  const handleUpload = async (file: File, kind: "image" | "video") => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
      const path = `hero/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setDraft({
        ...current,
        ...(kind === "image" ? { image_url: data.publicUrl } : { video_url: data.publicUrl }),
      });
      toast.success(kind === "video" ? "Video subido" : "Imagen subida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key: "hero", value: current as unknown as Json },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Configuración guardada");
      await queryClient.invalidateQueries({ queryKey: ["admin-hero-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["site-settings", "hero"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    },
  });

  if (isLoading || !draft) return <LoadingPanel />;
  const overlayPct = Math.round(current.overlay_opacity * 100);

  return (
    <section>
      <PageHeader
        eyebrow="Configuración"
        title="Hero del inicio"
        action={
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-md border border-subtle bg-surface p-6">
          <div className="space-y-2">
            <Label>Tipo de fondo</Label>
            <Select value={current.type} onValueChange={(value) => setDraft({ ...current, type: value as HeroBgType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno (fondo sólido)</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {current.type === "image" && (
            <div className="space-y-2">
              <Label>Imagen de fondo</Label>
              {current.image_url && (<img src={current.image_url} alt="" className="h-32 w-full rounded-md object-cover" />)}
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir imagen
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "image"); e.target.value = ""; }} />
              </label>
            </div>
          )}

          {current.type === "video" && (
            <>
              <div className="space-y-2">
                <Label>Video de fondo</Label>
                {current.video_url && (<video src={current.video_url} className="h-32 w-full rounded-md object-cover" muted />)}
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Subir video
                  <input type="file" accept="video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "video"); e.target.value = ""; }} />
                </label>
              </div>
              <div className="space-y-2">
                <Label>Imagen de fallback (móvil)</Label>
                {current.image_url && (<img src={current.image_url} alt="" className="h-24 w-full rounded-md object-cover" />)}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-subtle px-3 text-xs font-medium hover:bg-secondary">
                  <Upload className="h-3 w-3" />
                  Subir fallback
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "image"); e.target.value = ""; }} />
                </label>
              </div>
            </>
          )}

          {current.type !== "none" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opacidad del overlay</Label>
                <span className="text-sm text-muted-foreground">{overlayPct}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={70}
                value={overlayPct}
                onChange={(e) => setDraft({ ...current, overlay_opacity: Number(e.target.value) / 100 })}
                className="w-full accent-primary"
              />
            </div>
          )}
        </div>

        <div className="rounded-md border border-subtle bg-surface overflow-hidden">
          <div className="border-b border-subtle px-5 py-3 text-sm font-medium">Vista previa</div>
          <div className="relative h-[360px] flex items-center justify-center overflow-hidden bg-black">
            {current.type === "video" && current.video_url ? (
              <video src={current.video_url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
            ) : current.type === "image" && current.image_url ? (
              <img src={current.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            {current.type !== "none" && (
              <div className="absolute inset-0 bg-black" style={{ opacity: current.overlay_opacity }} />
            )}
            <div className="relative z-10 text-center text-white px-6">
              <p className="text-xs uppercase tracking-widest text-primary-glow mb-2">Vista previa</p>
              <h3 className="font-display text-3xl font-black">Tecnología a tu nivel</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const OrdersSection = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, user_id, guest_email, status, subtotal, shipping_cost, total, tracking_number, notes, created_at, updated_at, order_addresses(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const address = getOrderAddress(order);
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery = !q || order.order_number.toLowerCase().includes(q) || (address?.email ?? order.guest_email ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, search, status]);

  return (
    <section>
      <PageHeader eyebrow="Pedidos" title="Gestión de pedidos" />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por orden o email…" className="bg-surface pl-10 border-subtle" />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus | "all")}>
          <SelectTrigger className="bg-surface border-subtle"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <LoadingPanel /> : (
        <DataPanel title="Pedidos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const address = getOrderAddress(order);
                return (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelected(order)}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{address?.full_name ?? (order.user_id ? "Cliente" : "Invitado")}</TableCell>
                    <TableCell>{address?.email ?? order.guest_email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatShortDate(order.created_at)}</TableCell>
                    <TableCell>{formatPrice(toNumber(order.total))}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataPanel>
      )}
      <OrderDetailModal order={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} />
    </section>
  );
};

const OrderDetailModal = ({ order, open, onOpenChange }: { order: OrderRow | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setTracking(order.tracking_number ?? "");
  }, [order]);

  const details = useQuery({
    queryKey: ["admin-order-details", order?.id],
    enabled: !!order?.id && open,
    queryFn: async () => {
      const [{ data: items, error: itemsError }, { data: address, error: addressError }] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order!.id),
        supabase.from("order_addresses").select("*").eq("order_id", order!.id).maybeSingle(),
      ]);
      if (itemsError) throw itemsError;
      if (addressError) throw addressError;
      return { items: (items ?? []) as OrderItem[], address: address as OrderAddress | null };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;
      const { error } = await supabase.from("orders").update({ status, tracking_number: tracking.trim() || null }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Pedido actualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo actualizar el pedido"),
  });

  const address = details.data?.address ?? (order ? getOrderAddress(order) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto border-subtle bg-surface">
        <DialogHeader>
          <DialogTitle>Pedido {order?.order_number}</DialogTitle>
          <DialogDescription>Detalle de productos, envío y estado del pedido.</DialogDescription>
        </DialogHeader>
        {details.isLoading ? <LoadingPanel /> : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <h3 className="font-display font-bold normal-case">Productos comprados</h3>
              <div className="divide-y divide-subtle rounded-md border border-subtle bg-background/40">
                {(details.data?.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <img src={item.image_url ?? "/placeholder.svg"} alt={item.name} className="h-14 w-14 rounded-md bg-surface-elevated object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Cantidad: {item.quantity} · Unitario: {formatPrice(toNumber(item.price))}</p>
                    </div>
                    <p className="font-medium">{formatPrice(toNumber(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-md border border-subtle bg-background/40 p-4 text-sm">
                <h3 className="mb-3 font-display font-bold normal-case">Datos de envío</h3>
                <div className="space-y-1 text-muted-foreground">
                  <p><span className="text-foreground">Nombre:</span> {address?.full_name ?? "—"}</p>
                  <p><span className="text-foreground">Teléfono:</span> {address?.phone ?? "—"}</p>
                  <p><span className="text-foreground">Email:</span> {address?.email ?? order?.guest_email ?? "—"}</p>
                  <p><span className="text-foreground">Departamento:</span> {address?.department ?? "—"}</p>
                  <p><span className="text-foreground">Ciudad:</span> {address?.city ?? "—"}</p>
                  <p><span className="text-foreground">Dirección:</span> {address?.address ?? "—"}</p>
                  <p><span className="text-foreground">Notas:</span> {address?.notes ?? order?.notes ?? "—"}</p>
                </div>
              </div>
              <FormField label="Estado">
                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                  <SelectTrigger className="bg-surface-elevated border-subtle"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Número de seguimiento">
                <Input value={tracking} onChange={(event) => setTracking(event.target.value)} className="bg-surface-elevated border-subtle" />
              </FormField>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-subtle bg-surface-elevated">Cerrar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CustomersSection = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total"),
      ]);
      if (profiles.error) throw profiles.error;
      if (orders.error) throw orders.error;
      const orderStats = new Map<string, { count: number; spent: number }>();
      (orders.data ?? []).forEach((order) => {
        if (!order.user_id) return;
        const current = orderStats.get(order.user_id) ?? { count: 0, spent: 0 };
        current.count += 1;
        current.spent += toNumber(order.total);
        orderStats.set(order.user_id, current);
      });
      return { profiles: (profiles.data ?? []) as ProfileRow[], orderStats };
    },
  });

  const customers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.profiles ?? []).filter((profile) =>
      !q || (profile.name ?? "").toLowerCase().includes(q) || profile.email.toLowerCase().includes(q),
    );
  }, [data?.profiles, search]);

  return (
    <section>
      <PageHeader eyebrow="Clientes" title="Clientes registrados" />
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o email…" className="bg-surface pl-10 border-subtle" />
      </div>
      {isLoading ? <LoadingPanel /> : (
        <DataPanel title="Clientes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total gastado</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((profile) => {
                const stats = data?.orderStats.get(profile.id) ?? { count: 0, spent: 0 };
                return (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name || "—"}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.phone || "—"}</TableCell>
                    <TableCell>{stats.count}</TableCell>
                    <TableCell>{formatPrice(stats.spent)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatShortDate(profile.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataPanel>
      )}
    </section>
  );
};

const ReviewsSection = () => {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, product_id, user_id, rating, comment, approved, order_id, created_at, products(name)")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ReviewRow[];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      if (userIds.length === 0) return rows;
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      return rows.map((row) => ({ ...row, profile: profileMap.get(row.user_id) ?? null }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reseña aprobada");
      await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reseña rechazada");
      await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  return (
    <section>
      <PageHeader eyebrow="Reseñas" title="Pendientes de aprobación" />
      {isLoading ? <LoadingPanel /> : (
        <DataPanel title="Reseñas pendientes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay reseñas pendientes.</TableCell>
                </TableRow>
              )}
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.products?.name ?? "Producto"}</TableCell>
                  <TableCell>{review.profile?.name ?? review.profile?.email ?? "Usuario"}</TableCell>
                  <TableCell>
                    <span className="inline-flex gap-0.5 text-primary-glow">
                      {Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md text-muted-foreground">{review.comment ?? "—"}</TableCell>
                  <TableCell>{formatShortDate(review.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate(review.id)} className="bg-success text-success-foreground hover:bg-success/90">
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(review.id)} className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20">
                        Rechazar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}
    </section>
  );
};

type ContactMessage = Tables<"contact_messages">;

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const MessagesSection = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactMessage[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-messages-unread"] });
    },
  });

  const openMessage = (m: ContactMessage) => {
    setSelected(m);
    if (!m.read) markRead.mutate(m.id);
  };

  return (
    <section>
      <PageHeader eyebrow="Mensajes" title="Bandeja de contacto" />
      {isLoading ? <LoadingPanel /> : (
        <DataPanel title={`Mensajes (${messages.length})`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aún no hay mensajes recibidos.
                  </TableCell>
                </TableRow>
              )}
              {messages.map((m) => (
                <TableRow
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={cn("cursor-pointer", !m.read && "bg-primary/5")}
                >
                  <TableCell>
                    {m.read ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MailOpen className="h-3.5 w-3.5" /> Leído
                      </span>
                    ) : (
                      <Badge className="bg-primary-glow text-accent-foreground">Nuevo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{m.message}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.email}{selected?.phone ? ` · ${selected.phone}` : ""} · {selected ? formatDateTime(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-subtle bg-surface-elevated p-4 text-sm whitespace-pre-wrap">
            {selected?.message}
          </div>
          <DialogFooter>
            <a
              href={selected ? `mailto:${selected.email}` : undefined}
              className="inline-flex h-10 items-center px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
            >
              Responder por email
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminStub;
