import { createContext, useContext, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SquareCheck,
  SquareX,
  TriangleAlert,
  Info,
  Trash2,
  Heart,
  HeartCrack,
  Camera,
  Link,
  Send,
  Lock,
  Sparkles,
  PartyPopper,
  Flag,
  Star,
  Flame,
  Crown,
  Check
} from "lucide-react";

const MessageContext = createContext();
export const useMessage = () => useContext(MessageContext);

const EMOJI_SVG_MAP = [
  { emoji: "✨", icon: <Sparkles className="w-4 h-4 text-amber-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "🎉", icon: <PartyPopper className="w-4 h-4 text-yellow-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "🚩", icon: <Flag className="w-4 h-4 text-amber-400 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "⭐", icon: <Star className="w-4 h-4 text-amber-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "🌟", icon: <Star className="w-4 h-4 text-amber-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "❤️", icon: <Heart className="w-4 h-4 text-rose-400 inline-block align-middle mx-1 shrink-0" fill="currentColor" /> },
  { emoji: "💖", icon: <Heart className="w-4 h-4 text-pink-400 inline-block align-middle mx-1 shrink-0" fill="currentColor" /> },
  { emoji: "💔", icon: <HeartCrack className="w-4 h-4 text-rose-400 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "🔥", icon: <Flame className="w-4 h-4 text-amber-500 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "👑", icon: <Crown className="w-4 h-4 text-amber-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "🔒", icon: <Lock className="w-4 h-4 text-gray-300 inline-block align-middle mx-1 shrink-0" /> },
  { emoji: "✅", icon: <Check className="w-4 h-4 text-emerald-300 inline-block align-middle mx-1 shrink-0" strokeWidth={3} /> },
  { emoji: "✔️", icon: <Check className="w-4 h-4 text-emerald-300 inline-block align-middle mx-1 shrink-0" strokeWidth={3} /> },
  { emoji: "⚠️", icon: <TriangleAlert className="w-4 h-4 text-amber-300 inline-block align-middle mx-1 shrink-0" /> }
];

function renderToastContent(text) {
  if (typeof text !== "string") return text;

  const pattern = /(✨|🎉|🚩|⭐|🌟|❤️|💖|💔|🔥|👑|🔒|✅|✔️|⚠️)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const match = EMOJI_SVG_MAP.find(m => m.emoji === part);
    if (match) {
      return <span key={index} className="inline-flex items-center align-middle">{match.icon}</span>;
    }
    return part;
  });
}

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const dismissMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const showMessage = (text, type = "info", duration = 4000) => {
    if (!text) return;

    setMessages((prev) => {
      // Deduplicate: prevent showing identical active toast messages
      const isDuplicate = prev.some(
        (msg) => msg.text === text && msg.type === type
      );
      if (isDuplicate) return prev;

      const id = Date.now() + Math.random();
      const newMessage = { id, text, type };

      setTimeout(() => dismissMessage(id), duration);

      return [...prev, newMessage];
    });
  };

  useLayoutEffect(() => {
    const handleGlobalToast = (e) => {
      const { text, type, duration } = e.detail;
      showMessage(text, type, duration);
    };

    window.addEventListener("GLOBAL_TOAST", handleGlobalToast);
    return () => window.removeEventListener("GLOBAL_TOAST", handleGlobalToast);
  }, []);

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className="fixed bottom-4 inset-x-0 mx-auto z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-max max-w-[90vw]">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`
                pointer-events-auto cursor-pointer px-4 py-2.5 md:px-5 md:py-3 rounded-lg text-white text-sm md:text-base font-medium shadow-xl
                w-full max-w-[90vw] md:w-auto md:max-w-md
                ${msg.type === 'success' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600' : ''}
                ${msg.type === 'error' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' : ''}
                ${msg.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' : ''}
                ${msg.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600' : ''}
              `}
              onClick={() => dismissMessage(msg.id)}
            >
              <div className="flex items-center gap-3">
                {msg.type === 'success' && <SquareCheck className="w-5 h-5 flex-shrink-0" />}
                {msg.type === 'error' && <SquareX className="w-6 h-6 flex-shrink-0" />}
                {msg.type === 'warning' && <TriangleAlert className="w-6 h-6 flex-shrink-0" />}
                {msg.type === 'info' && <Info className="w-6 h-6 flex-shrink-0" />}
                <span>{renderToastContent(msg.text)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </MessageContext.Provider>
  );
};
