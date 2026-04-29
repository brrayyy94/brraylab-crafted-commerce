import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-handles the recovery hash; we just check we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Wait briefly for hash processing
        const t = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setReady(true);
            else toast.error("El enlace de recuperación no es válido o expiró");
          });
        }, 500);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Mínimo 8 caracteres");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    navigate("/mi-cuenta", { replace: true });
  };

  return (
    <div className="container max-w-md py-20">
      <div className="bg-surface border border-subtle rounded-2xl p-8">
        <h1 className="font-display text-3xl font-bold mb-2">Nueva contraseña</h1>
        <p className="text-muted-foreground text-sm mb-8">Define una contraseña fuerte para tu cuenta.</p>

        {!ready ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pw">Contraseña</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface-elevated border-subtle mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="pw2">Confirmar contraseña</Label>
              <Input
                id="pw2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-surface-elevated border-subtle mt-1.5"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
