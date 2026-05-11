import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(7, "Teléfono inválido").max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectTo = redirectParam ?? "/mi-cuenta";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone ?? "",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Revisa tu email para confirmar tu cuenta");
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectTo,
    });
    if (result.error) {
      setOauthLoading(false);
      toast.error("No se pudo registrar con Google");
      return;
    }
    if (result.redirected) return;
    navigate(redirectTo, { replace: true });
  };

  if (submitted) {
    return (
      <div className="container max-w-md py-20">
        <div className="bg-surface border border-subtle rounded-2xl p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Confirma tu email</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Te enviamos un enlace de confirmación a <span className="text-foreground">{form.email}</span>. Haz clic en
            el enlace para activar tu cuenta.
          </p>
          <Link to="/auth/login">
            <Button variant="outline" className="bg-surface-elevated border-subtle">
              Ir al login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-20">
      <div className="bg-surface border border-subtle rounded-2xl p-8 shadow-elevated">
        <h1 className="font-display text-3xl font-bold mb-2">Crear cuenta</h1>
        <p className="text-muted-foreground text-sm mb-8">Únete a la familia BrrayLab.</p>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-surface-elevated border-subtle hover:bg-surface mb-4"
          onClick={handleGoogle}
          disabled={oauthLoading}
        >
          {oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrarse con Google"}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-subtle" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-3 text-muted-foreground">o con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-surface-elevated border-subtle mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-surface-elevated border-subtle mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-surface-elevated border-subtle mt-1.5"
              placeholder="+57 300 000 0000"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-surface-elevated border-subtle mt-1.5"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres.</p>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth/login" className="text-primary-glow hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
