import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-indigo-700 items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 text-center max-w-md">
          <img src="/login-logo.jpg" alt="QueueBook" className="w-[280px] max-w-full h-auto mx-auto mb-8" />
          <p className="text-white/90 text-center max-w-[380px] mx-auto font-medium leading-relaxed">
            <span className="block text-xl font-bold mb-2">Book your appointment. Skip the queue.</span>
            <span className="block text-sm text-white/70">Join the queue remotely and we'll notify you when it's your turn.</span>
          </p>
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { val: '10K+', label: 'Users' },
              { val: '500+', label: 'Businesses' },
              { val: '4.9', label: 'Rating' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-3">
                <p className="text-lg font-bold text-white">{s.val}</p>
                <p className="text-[10px] text-indigo-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="w-full max-w-[420px]">
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
