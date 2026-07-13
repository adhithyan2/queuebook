import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineCalendar, HiOutlineBell } from 'react-icons/hi';

const steps = [
  {
    icon: HiOutlineSearch,
    title: 'Find a Service',
    description: 'Search for hospitals, salons, clinics and more near you. Browse by category or location.',
    color: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: HiOutlineCalendar,
    title: 'Book & Join Queue',
    description: 'Choose your preferred time slot and join the queue remotely. No physical presence needed.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
  },
  {
    icon: HiOutlineBell,
    title: 'Wait & Relax',
    description: 'Get real-time notifications when it\'s your turn. Arrive just in time — no more waiting in line.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-[650px] mx-auto mb-20"
        >
          <span className="text-sm font-semibold text-indigo-600 tracking-wider uppercase">How it Works</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-5">
            Three simple steps to skip the queue
          </h2>
          <p className="text-lg lg:text-xl text-slate-500 leading-relaxed">
            Join the queue from anywhere and arrive exactly when it's your turn.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-slate-200" />
                )}
                <div className="relative bg-white rounded-[24px] border border-slate-100 p-10 card-shadow card-shadow-hover">
                  <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-6`}>
                    <Icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-indigo-600 mb-3 block">Step {i + 1}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
