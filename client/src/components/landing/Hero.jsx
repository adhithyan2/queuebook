import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { HiOutlineArrowRight, HiOutlinePlay } from 'react-icons/hi';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-gradient pt-28 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-sm font-medium text-indigo-600 mb-8 border border-indigo-100"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Join 10,000+ users skipping the queue
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-[700px]"
            >
              Book your
              <br />
              <span className="gradient-text">Appointment.</span>
              <br />
              Skip the <span className="gradient-text">Queue.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg lg:text-xl text-slate-500 max-w-[540px] mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Join the queue remotely from anywhere. Get real-time updates and notifications when it's your turn. No more waiting in line.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Button variant="gradient" size="xl" onClick={() => navigate('/register')} icon={<HiOutlineArrowRight className="w-5 h-5" />}>
                Get Started Free
              </Button>
              <Button variant="secondary" size="xl" icon={<HiOutlinePlay className="w-5 h-5" />}>
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-10 mt-12 justify-center lg:justify-start"
            >
              {[
                { src: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', alt: 'Google', w: 'w-20' },
                { src: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', alt: 'Netflix', w: 'w-16' },
                { src: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', alt: 'Amazon', w: 'w-18' },
              ].map((logo) => (
                <img key={logo.alt} src={logo.src} alt={logo.alt} className={`${logo.w} opacity-30 grayscale hover:opacity-50 transition-all`} />
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-10 bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-transparent rounded-full blur-3xl" />
              <img
                src="/queuebook-logo.png"
                alt="QueueBook"
                className="relative w-full max-w-[400px] h-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
