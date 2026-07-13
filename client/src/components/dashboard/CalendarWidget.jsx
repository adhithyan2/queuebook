import { useState } from 'react';
import { motion } from 'framer-motion';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(month, year) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarWidget() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState(today.getDate());
  const [slot, setSlot] = useState(null);

  const days = getDaysInMonth(month, year);
  const firstDay = getFirstDay(month, year);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else { setMonth(month - 1); }
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else { setMonth(month + 1); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-900">Schedule</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-semibold text-slate-700 w-24 text-center">{monthNames[month]} {year}</span>
          <button onClick={next} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selected;
          return (
            <button
              key={day}
              onClick={() => setSelected(day)}
              className={`text-center text-sm py-2 rounded-xl transition-all ${
                isSelected ? 'bg-indigo-600 text-white font-semibold shadow-sm' :
                isToday ? 'text-indigo-600 font-semibold' :
                'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <h4 className="text-sm font-semibold text-slate-700 mb-4">Available Slots</h4>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {timeSlots.map((t) => (
          <button
            key={t}
            onClick={() => setSlot(t)}
            className={`py-2 text-xs font-medium rounded-xl border transition-all ${
              slot === t ? 'bg-indigo-50 border-indigo-500 text-indigo-600' :
              'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
        Book Appointment
      </button>
    </div>
  );
}
