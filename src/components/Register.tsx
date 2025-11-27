import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { UserPlus, Mail, Lock, IdCard, Phone, User, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { registerUser } from "../services/authApi";

interface RegisterProps {
  theme: "light" | "dark";
}

export default function Register({ theme }: RegisterProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    numero: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => ({
    cardBase: theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-gray-200",
    textMuted: theme === "dark" ? "text-gray-400" : "text-gray-600",
    textMain: theme === "dark" ? "text-white" : "text-gray-900",
    input: theme === "dark"
      ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
  }), [theme]);

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      await registerUser(form);
      toast.success("Usuario registrado. Inicia sesión para continuar.");
      navigate("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar";
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
        className={`relative w-full max-w-3xl p-8 rounded-3xl backdrop-blur-xl border shadow-2xl ${styles.cardBase}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400">Crear cuenta</p>
            <h1 className={`text-3xl font-semibold ${styles.textMain}`}>Registro de usuario</h1>
            <p className={styles.textMuted}>Completa los datos para habilitar tu acceso.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-blue-300 hover:text-blue-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a login
          </Link>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <FormField
            label="Nombre"
            placeholder="Ana"
            value={form.nombre}
            onChange={handleChange("nombre")}
            icon={<User className="w-5 h-5" />}
            styles={styles}
          />
          <FormField
            label="Apellido"
            placeholder="García"
            value={form.apellido}
            onChange={handleChange("apellido")}
            icon={<User className="w-5 h-5" />}
            styles={styles}
          />
          <FormField
            label="DNI"
            placeholder="12345678"
            value={form.dni}
            onChange={handleChange("dni")}
            icon={<IdCard className="w-5 h-5" />}
            styles={styles}
          />
          <FormField
            label="Número"
            placeholder="+51 999 999 999"
            value={form.numero}
            onChange={handleChange("numero")}
            icon={<Phone className="w-5 h-5" />}
            styles={styles}
          />
          <FormField
            label="Correo"
            placeholder="tu.correo@ejemplo.com"
            value={form.email}
            onChange={handleChange("email")}
            type="email"
            icon={<Mail className="w-5 h-5" />}
            styles={styles}
          />
          <FormField
            label="Contraseña"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange("password")}
            type="password"
            icon={<Lock className="w-5 h-5" />}
            styles={styles}
          />

          <div className="md:col-span-2">
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
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
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              )}
            </motion.button>
            <p className={`mt-3 text-center text-sm ${styles.textMuted}`}>
              Al registrarte aceptas los términos de uso del servicio de ADN Matcher.
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon: React.ReactNode;
  styles: {
    input: string;
    textMain: string;
  };
}

function FormField({ label, placeholder, value, onChange, type = "text", icon, styles }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${styles.textMain}`}>{label}</label>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles.input}`}>
        <span className="text-blue-300">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent focus:outline-none"
          required
        />
      </div>
    </div>
  );
}
