import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineChartBar, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineDeviceMobile } from 'react-icons/hi';

const features = [
  { icon: HiOutlineClock, title: 'Real-time Queue Tracking', description: 'Track your position in the queue live. Know exactly when it\'s your turn with up-to-the-second updates.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: HiOutlineLocationMarker, title: 'Find Nearby Services', description: 'Discover hospitals, salons, clinics and more near your location with live wait times and ratings.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: HiOutlineChartBar, title: 'Business Analytics', description: 'Powerful analytics dashboard for businesses. Track queue performance, wait times, and customer flow.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: HiOutlineShieldCheck, title: 'Secure & Reliable', description: 'Enterprise-grade security with JWT authentication. Your data is encrypted and protected at all times.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: HiOutlineUserGroup, title: 'Multi-business Support', description: 'Manage multiple business locations from a single dashboard. Perfect for chains and franchises.', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: HiOutlineDeviceMobile, title: 'Mobile-first Experience', description: 'Fully responsive design that works beautifully on desktop, tablet, and mobile devices.', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-[650px] mx-auto mb-20"
        >
          <span className="text-sm font-semibold text-indigo-600 tracking-wider uppercase">Features</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-5">
            Everything you need to manage queues
          </h2>
          <p className="text-lg lg:text-xl text-slate-500 leading-relaxed">
            Powerful features designed for both customers and businesses.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[24px] border border-slate-100 p-10 card-shadow card-shadow-hover"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
