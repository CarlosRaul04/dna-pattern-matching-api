import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Dna, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="mb-8 inline-block"
        >
          <Dna className="w-24 h-24 text-blue-400 mx-auto" />
        </motion.div>

        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl mb-6 text-white"
        >
          DNA Matcher
        </motion.h1>

        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl mb-4 text-gray-300"
        >
          Sistema Avanzado de Búsqueda de Secuencias de ADN
        </motion.p>

        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto"
        >
          Carga archivos CSV con secuencias genéticas, busca patrones específicos
          y descubre coincidencias de forma rápida y precisa.
        </motion.p>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/search')}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2 text-lg">
              Comenzar Búsqueda
              <ArrowRight className="w-5 h-5" />
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/history')}
            className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all shadow-xl"
          >
            <span className="flex items-center gap-2 text-lg">
              Ver Historial
              <Sparkles className="w-5 h-5" />
            </span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            { title: 'Carga CSV', desc: 'Importa secuencias desde archivos CSV' },
            { title: 'Búsqueda Rápida', desc: 'Encuentra patrones de ADN al instante' },
            { title: 'Historial', desc: 'Consulta búsquedas anteriores guardadas' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all"
            >
              <h3 className="text-xl mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
