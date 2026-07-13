import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineBellAlert,
} from 'react-icons/hi2';

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: HiOutlineMagnifyingGlass,
      title: 'Find Services',
      desc: 'Discover hospitals, salons, restaurants and government services near you.',
    },
    {
      icon: HiOutlineCalendarDays,
      title: 'Join Queue',
      desc: 'Book your appointment and join the queue remotely.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Live Tracking',
      desc: 'Track your queue number in real time.',
    },
    {
      icon: HiOutlineBellAlert,
      title: 'Instant Notifications',
      desc: 'Receive alerts when your turn is approaching.',
    },
  ];

  const steps = [
    { num: '01', title: 'Search Business', desc: 'Find the service you need' },
    { num: '02', title: 'Book Appointment', desc: 'Pick a convenient time slot' },
    { num: '03', title: 'Join Queue', desc: 'Get your token number' },
    { num: '04', title: 'Get Notified', desc: 'We alert you when it\'s your turn' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-12">
          <div className="flex items-center justify-between h-[72px]">
            <span className="text-xl font-bold text-white tracking-tight">QueueBook</span>
            <div className="hidden md:flex items-center gap-10">
              <button onClick={scrollToFeatures} className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</button>
              <button onClick={scrollToHowItWorks} className="text-sm font-medium text-white/70 hover:text-white transition-colors">How it Works</button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm font-medium text-white/90 hover:text-white border border-white/30 hover:border-white/50 rounded-xl transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.85]"
          style={{ backgroundImage: 'url(/queuelogo.png)' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(20,10,40,0.55)' }} />
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Queue management made simple for both customers and businesses.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-6 lg:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Get started in four simple steps.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 w-24 h-24 rounded-2xl bg-white shadow-lg shadow-indigo-100 flex items-center justify-center mb-6 border border-gray-100">
                    <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <span className="text-xl font-bold text-white tracking-tight">QueueBook</span>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
                Skip the line. Book ahead. Queue management made simple.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/login')} className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</button></li>
                <li><button onClick={() => navigate('/register')} className="text-sm text-gray-400 hover:text-white transition-colors">Get Started</button></li>
                <li><button onClick={scrollToFeatures} className="text-sm text-gray-400 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={scrollToHowItWorks} className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>hello@queuebook.com</li>
                <li>Support Center</li>
                <li>Partner with us</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} QueueBook. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
