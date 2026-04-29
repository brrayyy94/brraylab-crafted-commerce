import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.name ?? "");
        setPhone(data?.phone ?? "");
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), phone: phone.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil actualizado");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">Tu perfil</h1>
      <p className="text-sm text-muted-foreground mb-6">Actualiza tus datos de contacto.</p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled className="bg-surface-elevated/50 border-subtle mt-1.5" />
        </div>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-surface-elevated border-subtle mt-1.5" maxLength={80} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-surface-elevated border-subtle mt-1.5" maxLength={20} placeholder="+57 300 000 0000" />
        </div>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
};

export default Profile;
