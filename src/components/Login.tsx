import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, LogIn, Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { login } from "../services/authApi";

interface LoginProps {
  theme: "light" | "dark";
  onAuthSuccess?: () => void;
}

export default function Login({ theme, onAuthSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => ({
    cardBase: theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-gray-200",
    textMuted: theme === "dark" ? "text-gray-400" : "text-gray-600",
    textMain: theme === "dark" ? "text-white" : "text-gray-900",
    input: theme === "dark"
      ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
  }), [theme]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!correo || !password) {
      toast.error("Completa correo y contrasena");
      return;
    }

    try {
      setLoading(true);
      const response = await login({ correo, password });
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.usuario));
      onAuthSuccess?.();
      toast.success(`Bienvenido ${response.usuario.nombre}`);
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(147,51,234,0.25),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.2),transparent_30%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-lg p-8 rounded-3xl backdrop-blur-xl border shadow-2xl ${styles.cardBase}`}
      >
        <div className="text-center mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">Acceso seguro</p>
          <h1 className={`text-4xl font-semibold ${styles.textMain}`}>Iniciar sesión</h1>
          <p className={styles.textMuted}>Entra para continuar con tus búsquedas de ADN.</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${styles.textMain}`}>Correo</label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles.input}`}>
              <Mail className={theme === "dark" ? "text-blue-300" : "text-blue-600"} />
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                className="w-full bg-transparent focus:outline-none"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${styles.textMain}`}>Contraseña</label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles.input}`}>
              <Lock className={theme === "dark" ? "text-purple-300" : "text-purple-600"} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent focus:outline-none"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-lg font-semibold transition-all ${
              loading
                ? "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-between pt-2">
            <p className={`text-sm ${styles.textMuted}`}>¿No tienes cuenta?</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
            >
              Crear cuenta
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
