import { Link } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Support: ['Help Center', 'Contact', 'Privacy', 'Terms'],
  Social: ['Twitter', 'LinkedIn', 'GitHub', 'YouTube'],
};

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <HiOutlinePlus className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">QueueBook</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px]">
              Book your appointment. Skip the queue. Join remotely and get notified when it's your turn.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 mt-16 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} QueueBook. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
