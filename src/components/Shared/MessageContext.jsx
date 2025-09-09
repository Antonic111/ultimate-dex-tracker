import { createContext, useContext, useState } from "react";
import { SquareCheck, SquareX, TriangleAlert, Info, Trash2, Heart, HeartCrack, Camera, Link, Send, Lock } from "lucide-react";

const MessageContext = createContext();
export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const showMessage = (text, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();

    const newMessage = { id, text, type, leaving: false, showing: true };
    setMessages((prev) => [...prev, newMessage]);

    // Start show animation
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, showing: false } : msg
        )
      );
    }, 100);

    setTimeout(() => startExit(id), duration);
  };

  const startExit = (id) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, leaving: true } : msg
      )
    );

    // Wait for animation to complete before removing
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 300); // match the Tailwind transition duration
  };

  const dismissMessage = (id) => {
    startExit(id);
  };

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
       <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[99999] flex flex-col gap-3 pointer-events-none max-w-[90vw]">
         {messages.map((msg) => (
           <div
             key={msg.id}
             className={`
               pointer-events-auto cursor-pointer px-3 py-2 md:px-5 md:py-3 rounded-lg text-white text-sm md:text-base font-medium shadow-lg
               w-full max-w-[90vw] md:w-auto md:max-w-md
               transition-all duration-500 ease-out transform
               ${msg.showing 
                 ? 'opacity-0 translate-y-8 scale-95' 
                 : msg.leaving 
                   ? 'opacity-0 translate-y-2 scale-95' 
                   : 'opacity-100 translate-y-0 scale-100'
               }
               ${msg.type === 'success' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600' : ''}
               ${msg.type === 'error' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' : ''}
               ${msg.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' : ''}
               ${msg.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600' : ''}
             `}
             onClick={() => dismissMessage(msg.id)}
           >
            <div className="flex items-center gap-3">
              {/* Success Icon */}
              {msg.type === 'success' && (
                <SquareCheck className="w-5 h-5 flex-shrink-0" />
              )}
              
              {/* Error Icon */}
              {msg.type === 'error' && (
                <SquareX className="w-7 h-7 flex-shrink-0" />
              )}
              
              {/* Warning Icon */}
              {msg.type === 'warning' && (
                <TriangleAlert className="w-7 h-7 flex-shrink-0" />
              )}
              
              {/* Info Icon */}
              {msg.type === 'info' && (
                <Info className="w-7 h-7 flex-shrink-0" />
              )}
              
              <span>{msg.text}</span>
            </div>
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  );
};
