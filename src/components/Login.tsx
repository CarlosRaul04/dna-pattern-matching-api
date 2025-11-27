import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, LogIn, Mail, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login } from "../services/authApi";

interface LoginProps {
  theme: "light" | "dark";
}

export default function Login({ theme }: LoginProps) {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const cardBase = theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-gray-200";
  const textMuted = theme === "dark" ? "text-gray-400" : "text-gray-600";
  const textMain = theme === "dark" ? "text-white" : "text-gray-900";
  const inputStyles = theme === "dark"
    ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";

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
      toast.success(`Bienvenido ${response.usuario.nombre}`);
      navigate("/search");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-80px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"}`}>
            <ShieldCheck className={`w-6 h-6 ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`} />
          </div>
          <div>
            <h1 className={`text-4xl ${textMain}`}>Iniciar sesion</h1>
            <p className={textMuted}>Autenticate para usar el panel y los endpoints protegidos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${cardBase}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-500/10"}`}>
                <Sparkles className={theme === "dark" ? "text-purple-300" : "text-purple-600"} />
              </div>
              <div>
                <p className={`text-lg font-medium ${textMain}`}>Experiencia unificada</p>
                <p className={textMuted}>Mantuvimos los gradientes, bordes suaves y micro-animaciones del resto del sitio.</p>
              </div>
            </div>

            <ul className={`space-y-3 ${textMuted}`}>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
                <span>El token se guarda en localStorage para reutilizarlo en llamados protegidos.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                <span>Campos validados y estados de carga para evitar dobles envios.</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
                <span>Compatibilidad con el endpoint actual que espera <code>correo</code> en el body.</span>
              </li>
            </ul>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSubmit}
            className={`p-6 rounded-2xl backdrop-blur-xl border shadow-2xl space-y-6 ${cardBase}`}
          >
            <div>
              <label className={`block mb-2 text-sm font-medium ${textMain}`}>Correo</label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${inputStyles}`}>
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

            <div>
              <label className={`block mb-2 text-sm font-medium ${textMain}`}>Contrasena</label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${inputStyles}`}>
                <Lock className={theme === "dark" ? "text-purple-300" : "text-purple-600"} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
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
              className={`w-full px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-lg font-medium transition-all ${
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

            <p className={`text-sm text-center ${textMuted}`}>
              Primera vez? Registra un usuario desde la API y luego vuelve para iniciar sesion.
            </p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
