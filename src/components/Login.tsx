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
    cardBase: theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/95 border-gray-200",
    textMuted: theme === "dark" ? "text-gray-400" : "text-gray-600",
    textMain: theme === "dark" ? "text-white" : "text-gray-900",
    input: theme === "dark"
      ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus-within:border-blue-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus-within:border-blue-500",
  }), [theme]);

  const accent = theme === "dark" ? "text-blue-300" : "text-blue-600";
  const accentLink = theme === "dark" ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-700";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!correo || !password) {
      toast.error("Completa correo y contraseña");
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
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesión";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(147,51,234,0.25),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.2),transparent_30%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative w-full max-w-sm mx-auto p-6 sm:p-8 rounded-2xl backdrop-blur-xl border shadow-2xl ${styles.cardBase}`}
      >
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <p className={`text-xs uppercase tracking-[0.35em] ${accent}`}>Acceso seguro</p>
            <h1 className={`text-4xl font-semibold ${styles.textMain}`}>Iniciar sesión</h1>
            <p className={`text-sm ${styles.textMuted}`}>Ingresa tus datos para continuar con tus búsquedas de ADN.</p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${styles.textMain}`}>Correo electrónico</label>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${styles.input}`}>
                <Mail className={accent} />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full bg-transparent focus:outline-none text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${styles.textMain}`}>Contraseña</label>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${styles.input}`}>
                <Lock className={theme === "dark" ? "text-purple-300" : "text-purple-600"} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent focus:outline-none text-sm"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-semibold transition-all ${loading
                ? "bg-gray-500/40 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:from-blue-600 hover:to-purple-700"}`}
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              <p className={`text-sm ${styles.textMuted}`}>¿No tienes cuenta?</p>
              <Link
                to="/register"
                className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${accentLink}`}
              >
                Crear cuenta
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
