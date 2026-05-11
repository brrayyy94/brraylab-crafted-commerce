import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type ReviewWithProfile = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: { name: string | null; email: string } | null;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(iso));

export const ProductReviews = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: eligibleOrderId } = useQuery({
    queryKey: ["review-eligibility", productId, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string | null> => {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, user_id, status)")
        .eq("product_id", productId)
        .eq("orders.user_id", user!.id)
        .eq("orders.status", "delivered")
        .limit(1);
      return items?.[0]?.order_id ?? null;
    },
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async (): Promise<ReviewWithProfile[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id")
        .eq("product_id", productId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (!ids.length) return rows;
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });

  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Inicia sesión");
      if (!eligibleOrderId) throw new Error("Solo puedes reseñar productos que hayas comprado y recibido.");
      if (comment.trim().length < 10) throw new Error("El comentario debe tener al menos 10 caracteres");
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        order_id: eligibleOrderId,
        rating,
        comment: comment.trim(),
        approved: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tu reseña será publicada después de revisión");
      setComment("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      {/* Lista */}
      <div className="space-y-4 max-w-3xl">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando reseñas…</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">Sé el primero en opinar.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-xl bg-surface border border-subtle p-5">
              <header className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-sm">{r.profile?.name || r.profile?.email?.split("@")[0] || "Cliente BrrayLab"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex gap-0.5 text-primary-glow">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </header>
              {r.comment && <p className="text-sm text-foreground/85 leading-relaxed">{r.comment}</p>}
            </article>
          ))
        )}
      </div>

      {/* Formulario */}
      <div className="mt-10 max-w-3xl">
        <h3 className="font-display font-bold text-lg mb-4">Deja tu reseña</h3>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth/login" className="text-primary-glow hover:underline">Inicia sesión</Link> para dejar una reseña.
          </p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
            className="rounded-xl bg-surface border border-subtle p-5 space-y-4"
          >
            <div>
              <label className="text-sm font-medium block mb-2">Calificación</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    aria-label={`${n} estrellas`}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        (hover || rating) >= n ? "text-primary-glow fill-current" : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Comentario</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                minLength={10}
                maxLength={1000}
                placeholder="Comparte tu experiencia con este producto…"
                className="w-full px-3 py-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 10 caracteres.</p>
            </div>
            <button
              type="submit"
              disabled={submit.isPending}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple disabled:opacity-50"
            >
              {submit.isPending ? "Enviando…" : "Enviar reseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
