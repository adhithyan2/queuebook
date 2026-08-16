import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMicrophone,
  HiOutlineQueueList, HiOutlineCalendarDays, HiOutlineMapPin,
  HiOutlineMagnifyingGlass, HiOutlineBookOpen, HiOutlineClock,
  HiOutlineShieldExclamation, HiOutlinePaperAirplane,
} from 'react-icons/hi2';
import { HiOutlineX, HiOutlineSpeakerphone } from 'react-icons/hi';
import { queueAPI, customerAPI } from '../../services/api';

const ACCENT = '#6D5EF7';

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function supportsSpeechSynthesis() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function extractService(statement) {
  const text = statement
    .replace(/please|i want|i'd like|to|a |an |the|for|of|me|my|now|today|book|compare|services|service/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text.split(' ').filter(Boolean);
  return words.slice(0, 3).join(' ');
}

function parseIntent(statement) {
  const text = statement.toLowerCase();
  if (/(stop|cancel)\b/.test(text)) return { type: 'stop' };
  if (/(my queue|queue status|how long|my position|people ahead|token|my turn|when is my)/.test(text)) return { type: 'queue' };
  if (/(next appointment|appointment|booking status|my booking)/.test(text)) return { type: 'appointment' };
  if (/(compare|best option|compare services)/.test(text)) {
    const service = extractService(text.replace(/compare|best option|services|service/g, ' '));
    return { type: 'compare', service };
  }
  if (/(book|book appointment|book a)/.test(text)) {
    const service = extractService(text.replace(/book|appointment|booking/g, ' '));
    return { type: 'book', service };
  }
  if (/(nearby|explore|find services|what's around|where can i get|around me)/.test(text)) return { type: 'nearby' };
  if (/(best time|when should i go|when to go|least busy|quietest)/.test(text)) return { type: 'best-time' };
  if (/(pay|payment|upi|pay for)/.test(text)) return { type: 'unsupported-payment' };
  if (/(whatsapp|sms|text me|call me|phone call)/.test(text)) return { type: 'unsupported-contact' };
  if (/(leave queue|remove from queue|cancel queue|cancel my appointment|delete)/.test(text)) return { type: 'unsupported-action' };
  if (/(rate|review)/.test(text)) return { type: 'unsupported-review' };
  if (/(help|commands|what can you do|what do you do)/.test(text)) return { type: 'help' };
  return { type: 'unknown' };
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState('');
  const [supportsVoice, setSupportsVoice] = useState(true);
  const [messages, setMessages] = useState([]);
  const recognitionRef = useRef(null);
  const finalRef = useRef('');

  const pushMessage = useCallback((role, text) => {
    setMessages((prev) => [...prev.slice(-19), { role, text }]);
  }, []);

  const speak = useCallback((text) => {
    pushMessage('assistant', text);
    if (!supportsSpeechSynthesis()) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-IN';
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    } catch {}
  }, [pushMessage]);

  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSupportsVoice(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalRef.current += transcript;
        else interim += transcript;
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        pushMessage('assistant', `I couldn't hear you clearly (${event.error}). Please try again or type your request.`);
      }
    };
    recognition.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      finalRef.current = '';
      if (text) handleCommand(text, true);
    };
    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      pushMessage('assistant', 'Voice input is not supported in this browser. You can type your request below instead.');
      return;
    }
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    finalRef.current = '';
    pushMessage('assistant', 'Listening… say something like "check my queue status" or "book a haircut".');
    try {
      recognition.start();
      setListening(true);
    } catch {
      pushMessage('assistant', 'Could not start the microphone. Make sure it is allowed in your browser.');
    }
  };

  const runQueue = async () => {
    try {
      const res = await queueAPI.getMyQueue();
      const queues = (res.data && res.data.queues) || [];
      const active = queues.find((q) => ['waiting', 'called'].includes(q.status));
      if (!active) {
        speak("You are not in any queue right now. Say \"book a haircut\" or \"find nearby services\" to get started.");
        return;
      }
      const { business } = active;
      const businessName = business?.name || 'the business';
      if (active.status === 'called') {
        speak(`Your turn is being served at ${businessName}. Please head to the service desk.`);
        return;
      }
      const ahead = active.peopleAhead ?? Math.max(0, (active.position || 1) - 1);
      speak(`You are number ${active.position} at ${businessName}, with ${ahead} people ahead and about ${active.estimatedWaitTime || ahead * 5} minutes of estimated wait.`);
    } catch {
      speak('Sorry, I could not fetch your queue status. Please try again.');
    }
  };

  const runAppointment = async () => {
    try {
      const res = await customerAPI.getDashboard();
      const upcoming = res.data && res.data.upcomingAppointment;
      if (!upcoming) {
        speak('You have no upcoming appointment. Say "find nearby services" to see what is available.');
        return;
      }
      const businessName = upcoming.business?.name || 'the business';
      const service = upcoming.service || 'your appointment';
      const slot = upcoming.timeSlot || 'the scheduled time';
      speak(`Your next ${service} at ${businessName} is at ${slot}. View it on your dashboard for details.`);
    } catch {
      speak('Sorry, I could not fetch your appointment. Please try again.');
    }
  };

  const runNearby = () => {
    speak('Opening nearby services with live queues, wait times and the best option for you.');
    navigate('/customer/nearby');
  };

  const runCompare = (service) => {
    if (!service) {
      speak('Which service would you like to compare? For example, say "compare haircut".');
      return;
    }
    speak(`Comparing ${service} across nearby businesses to find the best option for you.`);
    navigate(`/customer/explore?service=${encodeURIComponent(service)}`);
  };

  const runBook = (service) => {
    if (!service) {
      speak('Which service would you like to book? For example, say "book a haircut".');
      return;
    }
    speak(`Showing options for ${service}. Pick a business and confirm your appointment there.`);
    navigate(`/customer/explore?service=${encodeURIComponent(service)}`);
  };

  const runBestTime = () => {
    speak('Smart timing recommendations are available on your dashboard. Opening it for you.');
    navigate('/customer/dashboard');
  };

  const showHelp = () => {
    speak('You can ask me to check your queue status, show your next appointment, find nearby services, compare services, book an appointment, or find the best time to visit. Payments and messaging by voice are not supported yet.');
  };

  const handleCommand = (raw, fromVoice = false) => {
    if (fromVoice) pushMessage('user', raw);
    const intent = parseIntent(raw);
    switch (intent.type) {
      case 'queue': runQueue(); break;
      case 'appointment': runAppointment(); break;
      case 'nearby': runNearby(); break;
      case 'compare': runCompare(intent.service); break;
      case 'book': runBook(intent.service); break;
      case 'best-time': runBestTime(); break;
      case 'help': showHelp(); break;
      case 'unsupported-payment':
        speak("I can't handle payments by voice yet. Open your appointment and use the Pay button to complete payment securely.");
        break;
      case 'unsupported-contact':
        speak("Sending SMS or WhatsApp messages by voice isn't supported yet. You can update your phone number in your profile for those updates.");
        break;
      case 'unsupported-action':
        speak("I can't perform that action by voice because it can't be undone. Please do it from the app so you can confirm each step.");
        break;
      case 'unsupported-review':
        speak("Leaving a review by voice isn't supported yet. Please visit the business page to submit your rating.");
        break;
      case 'stop': break;
      default:
        speak("I didn't understand that. Try \"check my queue status\", \"find nearby services\", \"compare haircut\", or say \"help\" to see what I can do.");
    }
  };

  const handleTypedSubmit = (e) => {
    e.preventDefault();
    const value = typing.trim();
    if (!value) return;
    setTyping('');
    handleCommand(value, true);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Voice assistant"
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full text-white shadow-[0_10px_30px_rgba(109,94,247,0.4)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
      >
        {open ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMicrophone className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="fixed bottom-24 right-6 z-[90] w-[min(92vw,380px)] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-[0_20px_60px_rgba(15,23,42,0.25)] overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}>
                <HiOutlineSpeakerphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Voice Assistant</p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {supportsVoice ? 'Tap the mic and speak' : 'Type a command below'}
                </p>
              </div>
              <button onClick={() => setListening(false)} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium">
                Close
              </button>
            </div>

            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-zinc-50/60 dark:bg-zinc-950/40">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-zinc-400">Try saying</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {['check my queue status', 'next appointment', 'find nearby services', 'compare haircut', 'best time to visit'].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleCommand(chip, true)}
                        className="px-2.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300 hover:border-[#6D5EF7]/50 hover:text-[#6D5EF7] transition-colors"
                      >
                        “{chip}”
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-[#6D5EF7]/10 text-zinc-800 dark:text-zinc-200'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
              {supportsVoice ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleListening}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                      listening ? 'bg-red-500 animate-pulse' : ''
                    }`}
                    style={listening ? undefined : { background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                  >
                    <HiOutlineMicrophone className="w-4 h-4" />
                    {listening ? 'Listening… tap to stop' : 'Start voice command'}
                  </button>
                </div>
              ) : null}
              <form onSubmit={handleTypedSubmit} className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <HiOutlinePaperAirplane className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={typing}
                    onChange={(e) => setTyping(e.target.value)}
                    placeholder="Type a command…"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/40 focus:border-[#6D5EF7]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 rounded-xl text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                >
                  Send
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineQueueList className="w-3 h-3" /> queue status
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineCalendarDays className="w-3 h-3" /> appointment
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineMapPin className="w-3 h-3" /> nearby
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineMagnifyingGlass className="w-3 h-3" /> compare
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineBookOpen className="w-3 h-3" /> book
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineClock className="w-3 h-3" /> best time
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <HiOutlineShieldExclamation className="w-3 h-3" /> no payments by voice
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
