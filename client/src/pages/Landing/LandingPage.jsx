import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineQueueList,
} from 'react-icons/hi2';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const letterContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
};

const letterChild = {
  hidden: { opacity: 0, y: 40, rotateX: -90 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function TypewriterLine({ text, delay = 0 }) {
  return (
    <motion.span
      className="inline-block"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: delay } },
      }}
      initial="hidden"
      animate="visible"
    >
      {text.split('').map((char, i) => (
        <motion.span key={i} className="inline-block" variants={letterChild} style={{ perspective: 400 }}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const scroll = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: HiOutlineMagnifyingGlass,
      title: 'Find Services',
      desc: 'Discover nearby hospitals, salons, restaurants and offices with instant search.',
    },
    {
      icon: HiOutlineCalendarDays,
      title: 'Join Queue',
      desc: 'Book appointments and join the queue remotely from anywhere.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Live Tracking',
      desc: 'Track your queue position in real time with instant updates.',
    },
    {
      icon: HiOutlineBellAlert,
      title: 'Instant Notifications',
      desc: 'Get alerts when your turn is approaching. Never miss your spot.',
    },
  ];

  const steps = [
    { num: '01', icon: HiOutlineMagnifyingGlass, title: 'Search Business', desc: 'Find the service you need nearby' },
    { num: '02', icon: HiOutlineCalendarDays, title: 'Book Appointment', desc: 'Pick a convenient time slot' },
    { num: '03', icon: HiOutlineQueueList, title: 'Join Queue', desc: 'Get your token number instantly' },
    { num: '04', icon: HiOutlineBellAlert, title: 'Get Notified', desc: 'We alert you when it\'s your turn' },
  ];

  const businessFeatures = [
    { icon: HiOutlineQueueList, title: 'Smart Queue Management', desc: 'Automatically manage customer flow with real-time queue controls.' },
    { icon: HiOutlineUserGroup, title: 'Customer Insights', desc: 'Understand peak hours, wait times, and customer patterns.' },
    { icon: HiOutlineClock, title: 'Reduce Wait Times', desc: 'Optimize service flow and keep customers happy.' },
    { icon: HiOutlineShieldCheck, title: 'Reliable & Secure', desc: 'Enterprise-grade security for your business data.' },
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      desc: 'Perfect for small businesses getting started',
      features: ['1 Business Profile', 'Basic Queue Management', 'Up to 50 daily tokens', 'Email Support'],
      cta: 'Get Started Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '9',
      desc: 'For growing businesses that need more',
      features: ['Unlimited Business Profiles', 'Advanced Analytics', 'Unlimited daily tokens', 'Priority Support', 'Custom Branding', 'SMS Notifications'],
      cta: 'Start Pro Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: '29',
      desc: 'For large organizations with custom needs',
      features: ['Everything in Pro', 'Multi-location Support', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-[72px]">
            <span className="text-2xl font-extrabold text-white tracking-tight">QueueBook</span>
            <div className="hidden lg:flex items-center gap-10">
              <button onClick={() => scroll('features')} className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</button>
              <button onClick={() => scroll('how-it-works')} className="text-sm font-medium text-white/70 hover:text-white transition-colors">How it Works</button>
              <button onClick={() => scroll('businesses')} className="text-sm font-medium text-white/70 hover:text-white transition-colors">For Businesses</button>
              <button onClick={() => scroll('pricing')} className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</button>
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
                className="px-5 py-2 text-sm font-semibold text-white bg-[#6C4CF1] hover:bg-[#5B3DD4] rounded-xl shadow-lg shadow-[#6C4CF1]/30 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/landing-bg-final.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, #6C4CF1 0%, transparent 50%), radial-gradient(circle at 75% 20%, #9b6dff 0%, transparent 40%)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 w-full flex justify-center">
          <div className="max-w-2xl text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider text-white bg-[#6C4CF1]/80 border border-[#6C4CF1]/60 rounded-full mb-8 shadow-lg shadow-[#6C4CF1]/40">
                SMART QUEUE MANAGEMENT
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.15] mb-8"
            >
              <TypewriterLine text="Skip the Line." delay={0} /><br />
              <span className="bg-gradient-to-r from-[#d4b8ff] to-[#8B5CF6] bg-clip-text text-transparent drop-shadow-lg">
                <TypewriterLine text="Book Ahead." delay={0.8} />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg text-white leading-loose mb-12 max-w-lg mx-auto font-medium"
            >
              Join the queue remotely, get real-time updates, and never wait in line again.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 text-sm font-bold text-white bg-[#6C4CF1] hover:bg-[#5B3DD4] rounded-2xl shadow-xl shadow-[#6C4CF1]/50 transition-all hover:scale-[1.02] animate-[glow_2s_ease-in-out_infinite_alternate]"
              >
                Get Started
              </button>
              <button
                onClick={() => scroll('how-it-works')}
                className="px-8 py-3.5 text-sm font-semibold text-white border-2 border-white/40 hover:border-white/70 hover:bg-white/10 rounded-2xl transition-all"
              >
                Learn More
              </button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="mt-8 text-sm text-white/70"
            >
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#b89cff] hover:text-white font-medium transition-colors underline underline-offset-2">
                Sign In
              </button>
            </motion.p>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-2.5 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 lg:py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-[#6C4CF1] bg-[#6C4CF1]/10 rounded-full mb-4">
              FEATURES
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Queue management made simple for both customers and businesses.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-7 lg:p-8 rounded-[20px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_40px_rgba(108,76,241,0.08)] hover:shadow-[0_8px_60px_rgba(108,76,241,0.15)] transition-all duration-300"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#6C4CF1]/5 flex items-center justify-center mb-5 group-hover:from-[#6C4CF1]/20 group-hover:to-[#6C4CF1]/10 transition-all">
                  <f.icon className="w-6 h-6 text-[#6C4CF1]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-[#6C4CF1] bg-[#6C4CF1]/10 rounded-full mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Get started in seconds
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Four simple steps to skip the line.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-14 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-[2px] bg-gradient-to-r from-[#6C4CF1]/20 via-[#6C4CF1]/40 to-[#6C4CF1]/20" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 w-28 h-28 rounded-[20px] bg-white shadow-lg shadow-[#6C4CF1]/10 flex flex-col items-center justify-center mb-6 border border-[#6C4CF1]/10 group-hover:shadow-[#6C4CF1]/20 transition-shadow">
                    <step.icon className="w-7 h-7 text-[#6C4CF1] mb-1" />
                    <span className="text-xs font-bold text-[#6C4CF1]/60">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Businesses ─── */}
      <section id="businesses" className="py-24 lg:py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-[#6C4CF1] bg-[#6C4CF1]/10 rounded-full mb-4">
                FOR BUSINESSES
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Grow your business<br />
                <span className="text-[#6C4CF1]">with smarter queues</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                Manage customer flow, reduce wait times, and gain valuable insights — all from one dashboard.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 text-sm font-semibold text-white bg-[#6C4CF1] hover:bg-[#5B3DD4] rounded-2xl shadow-xl shadow-[#6C4CF1]/30 transition-all hover:scale-[1.02]"
              >
                Start Free Today
              </button>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {businessFeatures.map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-6 rounded-[20px] bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#6C4CF1]/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-[#6C4CF1]" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-[#6C4CF1] bg-[#6C4CF1]/10 rounded-full mb-4">
              PRICING
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Start free. Upgrade when you're ready.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className={`relative p-8 rounded-[20px] transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-[#6C4CF1] text-white shadow-2xl shadow-[#6C4CF1]/30 scale-[1.03]'
                    : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-[#6C4CF1] bg-white rounded-full shadow-md">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>{plan.desc}</p>
                <div className="mb-6">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>${plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/60' : 'text-gray-400'}`}>/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-[#6C4CF1]'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-[#6C4CF1] hover:bg-white/90 shadow-lg'
                      : 'bg-[#6C4CF1] text-white hover:bg-[#5B3DD4] shadow-md shadow-[#6C4CF1]/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0f0524] text-gray-400 py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <span className="text-2xl font-extrabold text-white tracking-tight">QueueBook</span>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
                Skip the line. Book ahead. Queue management made simple for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scroll('features')} className="text-sm text-gray-500 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scroll('pricing')} className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scroll('businesses')} className="text-sm text-gray-500 hover:text-white transition-colors">For Businesses</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-gray-500">hello@queuebook.com</span></li>
                <li><span className="text-gray-500">Support Center</span></li>
                <li><span className="text-gray-500">Partner with us</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-gray-500">Privacy Policy</span></li>
                <li><span className="text-gray-500">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} QueueBook. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
