import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCalendar, HiOutlineArrowRight } from 'react-icons/hi';

const todayAppointments = 2;

export default function WelcomeBanner() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="relative overflow-hidden rounded-[20px] gradient-primary min-h-[240px] flex items-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 w-full p-12">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-indigo-200 text-sm font-medium mb-2">
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl lg:text-4xl font-bold text-white mb-3"
          >
            {name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-100 text-base max-w-lg"
          >
            You have <span className="font-semibold text-white">{todayAppointments} appointment{todayAppointments !== 1 ? 's' : ''}</span> scheduled today.
            Check your schedule and manage your queue.
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-7 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all whitespace-nowrap shadow-lg shadow-indigo-900/20"
        >
          <HiOutlineCalendar className="w-5 h-5" />
          Book Appointment
          <HiOutlineArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
