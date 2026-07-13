import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { HiOutlineArrowRight } from 'react-icons/hi';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[32px] gradient-primary p-16 lg:p-20 text-center"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5">
              Ready to skip the queue?
            </h2>
            <p className="text-indigo-100 text-lg lg:text-xl max-w-[600px] mx-auto mb-10 leading-relaxed">
              Join thousands of users who are saving time every day. Start for free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="xl"
                className="!bg-white !text-indigo-600 hover:!bg-indigo-50"
                icon={<HiOutlineArrowRight className="w-5 h-5" />}
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="!text-white hover:!bg-white/10"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
