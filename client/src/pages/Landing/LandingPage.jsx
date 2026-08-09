import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineQueueList,
  HiOutlineMapPin,
  HiOutlineBellAlert,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
  HiOutlineBolt,
  HiOutlineGlobeAlt,
  HiOutlineEnvelope,
} from 'react-icons/hi2';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: HiOutlineMagnifyingGlass, title: 'Find Services', desc: 'Discover nearby businesses and services with real-time availability. No more guessing or waiting.' },
    { icon: HiOutlineQueueList, title: 'Join Queue', desc: 'Join a queue remotely from your phone. Choose your preferred time and get in line instantly.' },
    { icon: HiOutlineMapPin, title: 'Live Tracking', desc: 'Track your position in the queue in real-time. Know exactly when it\'s your turn.' },
    { icon: HiOutlineBellAlert, title: 'Instant Notifications', desc: 'Get push notifications when it\'s almost your turn. Never miss your slot again.' },
  ];

  const steps = [
    { icon: HiOutlineMagnifyingGlass, title: 'Search Business', desc: 'Find the service you need nearby' },
    { icon: HiOutlineCalendarDays, title: 'Book Appointment', desc: 'Pick a date and time that works' },
    { icon: HiOutlineQueueList, title: 'Join Queue', desc: 'Confirm and join the virtual queue' },
    { icon: HiOutlineBellAlert, title: 'Get Notified', desc: 'Arrive exactly when it\'s your turn' },
  ];

  const businessFeatures = [
    { icon: HiOutlineUserGroup, title: 'Manage Customers', desc: 'Handle unlimited customers with smart queue routing and priority management.' },
    { icon: HiOutlineChartBar, title: 'Analytics Dashboard', desc: 'Track wait times, peak hours, and customer flow with real-time insights.' },
    { icon: HiOutlineClock, title: 'Reduce Wait Times', desc: 'Cut average wait times by up to 60% with automated queue management.' },
    { icon: HiOutlineShieldCheck, title: 'Secure & Reliable', desc: 'Enterprise-grade security with 99.9% uptime guarantee.' },
  ];

  const plans = [
    { name: 'Free', price: '0', desc: 'Perfect for small businesses getting started', features: ['Up to 50 customers/month', 'Basic queue management', 'Email notifications', '1 staff member', 'Community support'], cta: 'Get Started Free', popular: false },
    { name: 'Pro', price: '9', desc: 'For growing businesses that need more', features: ['Unlimited customers', 'Advanced queue analytics', 'SMS & push notifications', 'Up to 10 staff members', 'Priority support', 'Custom branding'], cta: 'Start Pro Trial', popular: true },
    { name: 'Enterprise', price: '29', desc: 'For large organizations and chains', features: ['Everything in Pro', 'Unlimited staff members', 'API access', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'], cta: 'Contact Sales', popular: false },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 lg:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <HiOutlineQueueList className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">QueueBook</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-white transition-colors">How it Works</a>
            <a href="#businesses" className="hover:text-zinc-900 dark:hover:text-white transition-colors">For Businesses</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:inline-flex text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-4 py-2">Sign In</button>
            <button onClick={() => navigate('/register')} className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-semibold px-5 py-2.5 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img src="/landing-bg-final.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0524]/80 via-[#0f0524]/70 to-[#0f0524]/90 dark:from-[#09090b]/80 dark:via-[#09090b]/70 dark:to-[#09090b]/90" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 text-center pt-20">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-300 uppercase mb-6">
              <HiOutlineBolt className="w-3.5 h-3.5" /> Smart Queue Management
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
              Skip the Line.<br />
              <span className="bg-gradient-to-r from-[#6366F1] via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Book Ahead.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-xl mx-auto text-lg text-zinc-400 mb-10 leading-relaxed">
              Join queues remotely, track your wait time in real-time, and get notified when it's your turn. No more standing in line.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/register')} className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-semibold px-8 py-3.5 text-base hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-200 w-full sm:w-auto">
                Get Started Free
              </button>
              <a href="#how-it-works" className="rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-300 font-semibold px-8 py-3.5 text-base hover:bg-white/5 transition-all duration-200 w-full sm:w-auto inline-flex items-center justify-center">
                See How It Works
              </a>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-6 h-10 rounded-full border-2 border-zinc-500/40 flex justify-center pt-2">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#6366F1] uppercase mb-3">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">Everything you need</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">A complete queue management solution that works for both customers and businesses.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} variants={scaleIn} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <f.icon className="w-6 h-6 text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#6366F1] uppercase mb-3">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">Four simple steps</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">Get started in minutes. No app download required for your customers.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-indigo-500/20 via-[#6366F1]/40 to-indigo-500/20" />
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="relative text-center">
                <div className="w-24 h-24 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6 relative z-10">
                  <s.icon className="w-8 h-8 text-[#6366F1]" />
                </div>
                <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600 tracking-widest uppercase mb-2 block">Step {i + 1}</span>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* For Businesses */}
      <section id="businesses" className="py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#6366F1] uppercase mb-3">For Businesses</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-bold tracking-tight mb-6">Grow your business with smart queues</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mb-8">
                QueueBook helps you serve more customers, reduce wait times, and gain actionable insights into your operations. Join thousands of businesses already transforming their customer experience.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/register')} className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-semibold px-8 py-3.5 text-base hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-200 w-full sm:w-auto text-center">
                  Start Free Trial
                </button>
                <button className="rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold px-8 py-3.5 text-base hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 w-full sm:w-auto text-center">
                  Book a Demo
                </button>
              </motion.div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid grid-cols-2 gap-4">
              {businessFeatures.map((f, i) => (
                <motion.div key={i} variants={scaleIn} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-lg transition-all duration-300">
                  <f.icon className="w-7 h-7 text-[#6366F1] mb-3" />
                  <h4 className="font-semibold mb-1">{f.title}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest text-[#6366F1] uppercase mb-3">Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">No hidden fees. Cancel anytime. Start free and upgrade as you grow.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={i} variants={scaleIn} className={`rounded-2xl border p-8 flex flex-col ${plan.popular ? 'border-[#6366F1] bg-white dark:bg-zinc-900 shadow-xl shadow-indigo-500/10 relative' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
                {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-xs font-semibold px-4 py-1 flex items-center gap-1"><HiOutlineStar className="w-3 h-3" /> Most Popular</div>}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                      <HiOutlineCheckCircle className="w-4.5 h-4.5 text-[#6366F1] mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/register')} className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${plan.popular ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white hover:shadow-lg hover:shadow-indigo-500/25' : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f0524] text-white pt-20 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <HiOutlineQueueList className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">QueueBook</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">The smart way to manage queues. Skip the line, book ahead.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-zinc-400 mb-4">Subscribe to our newsletter for tips and updates.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#6366F1] transition-colors" />
                <button className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white p-2.5 hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                  <HiOutlineEnvelope className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">&copy; 2026 QueueBook. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
