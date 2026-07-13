import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10 text-center max-w-md">
          <img
            src="/login-logo.png"
            alt="QueueBook"
            className="w-[320px] max-w-full h-auto mx-auto"
            style={{ marginTop: '40px', marginBottom: '32px' }}
          />
          <p className="text-white text-center max-w-[420px] mx-auto" style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 500, lineHeight: 1.7 }}>
            <span className="block text-2xl">Book your appointment. Skip the queue.</span>
            <span className="block text-lg mt-2">Join the queue remotely and we'll notify you when it's your turn.</span>
          </p>
          <div className="grid grid-cols-3 gap-6" style={{ marginTop: '48px' }}>
            {['10K+', '500+', '4.9'].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <p className="text-xl font-bold text-white">{stat}</p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {i === 0 ? 'Users' : i === 1 ? 'Businesses' : 'Rating'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
