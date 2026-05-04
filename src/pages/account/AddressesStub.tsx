import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type AddressRow = Tables<"addresses">;

const COLOMBIA_DEPTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca",
  "Cesar","Chocó","Córdoba","Cundinamarca","Bogotá D.C.","Guainía","Guaviare","Huila","La Guajira","Magdalena",
  "Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander",
  "Sucre","Tolima","Valle del Cauca","Vaupés","Vichada",
];

const schema = z.object({
  full_name: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(7).max(20),
  department: z.string().min(2),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

type Form = z.infer<typeof schema> & { id?: string; is_default: boolean };

const empty: Form = {
  full_name: "", phone: "", department: "", city: "", address: "", notes: "", is_default: false,
};

const Addresses = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["my-addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses").select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AddressRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!user) throw new Error("No autenticado");
      const payload = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        department: form.department,
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes?.trim() || null,
        is_default: form.is_default,
      };
      // Si is_default, desmarcar las otras
      if (form.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      if (form.id) {
        const { error } = await supabase.from("addresses").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Dirección guardada");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["my-addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => { toast.success("Dirección eliminada"); await qc.invalidateQueries({ queryKey: ["my-addresses"] }); },
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => { toast.success("Predeterminada actualizada"); await qc.invalidateQueries({ queryKey: ["my-addresses"] }); },
  });

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (a: AddressRow) => {
    setForm({
      id: a.id, full_name: a.full_name, phone: a.phone, department: a.department,
      city: a.city, address: a.address, notes: a.notes ?? "", is_default: a.is_default,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Mis direcciones</h1>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> Nueva</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />)}</div>
      ) : addresses.length === 0 ? (
        <div className="bg-surface border border-subtle rounded-2xl p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <MapPin className="h-6 w-6 text-primary-glow" />
          </div>
          <p className="text-sm text-muted-foreground">Aún no tienes direcciones guardadas.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <div key={a.id} className="bg-surface border border-subtle rounded-2xl p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.phone}</p>
                </div>
                {a.is_default && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-current" /> Predet.
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{a.address}</p>
              <p className="text-sm text-muted-foreground">{a.city}, {a.department}</p>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-subtle">
                <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="border-subtle"><Pencil className="h-3 w-3" /> Editar</Button>
                {!a.is_default && (
                  <Button size="sm" variant="outline" onClick={() => setDefault.mutate(a.id)} className="border-subtle"><Star className="h-3 w-3" /> Predet.</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => remove.mutate(a.id)} className="border-subtle text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface border-subtle max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar dirección" : "Nueva dirección"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-surface-elevated border-subtle mt-1" /></div>
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-surface-elevated border-subtle mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Departamento</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="bg-surface-elevated border-subtle mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{COLOMBIA_DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-surface-elevated border-subtle mt-1" /></div>
            </div>
            <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-surface-elevated border-subtle mt-1" /></div>
            <div><Label>Notas (opcional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-surface-elevated border-subtle mt-1" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Marcar como predeterminada
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-subtle">Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary hover:bg-primary/90">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Addresses;
