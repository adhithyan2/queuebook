import { motion } from 'framer-motion';
import { HiOutlineStar } from 'react-icons/hi';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Patient',
    avatar: 'SJ',
    content: 'QueueBook has completely changed how I visit my doctor. I join the queue from home and arrive exactly when it\'s my turn. No more waiting for hours in the lobby.',
    rating: 5,
  },
  {
    name: 'Marcus Chen',
    role: 'Salon Owner',
    avatar: 'MC',
    content: 'As a business owner, QueueBook has streamlined my entire operation. My customers love the convenience, and I can manage my queue efficiently. Game changer!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Frequent User',
    avatar: 'ER',
    content: 'I use QueueBook for everything from dental appointments to restaurant waitlists. It saves me hours every week. The real-time notifications are incredibly accurate.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-[650px] mx-auto mb-20"
        >
          <span className="text-sm font-semibold text-indigo-600 tracking-wider uppercase">Testimonials</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-5">
            Loved by thousands of users
          </h2>
          <p className="text-lg lg:text-xl text-slate-500 leading-relaxed">
            Here's what our users say about QueueBook.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[24px] border border-slate-100 p-10 card-shadow card-shadow-hover"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <HiOutlineStar key={j} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-8 text-[15px]">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
