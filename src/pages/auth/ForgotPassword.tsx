import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ email: z.string().trim().email().max(255) });

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Email inválido");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="container max-w-md py-20">
      <div className="bg-surface border border-subtle rounded-2xl p-8">
        <h1 className="font-display text-3xl font-bold mb-2">Recuperar contraseña</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="text-center py-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <p className="text-foreground mb-2">Revisa tu correo.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Si <span className="text-foreground">{email}</span> está registrado, recibirás un enlace en unos segundos.
            </p>
            <Link to="/auth/login">
              <Button variant="outline" className="bg-surface-elevated border-subtle">
                Volver al login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface-elevated border-subtle mt-1.5"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
            </Button>
            <Link to="/auth/login" className="block text-sm text-muted-foreground hover:text-primary-glow text-center mt-4">
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
