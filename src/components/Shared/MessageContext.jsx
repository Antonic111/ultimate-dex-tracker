import { createContext, useContext, useState } from "react";

const MessageContext = createContext();
export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const showMessage = (text, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();

    const isDuplicate = messages.some(
      (msg) => msg.text === text && msg.type === type
    );
    if (isDuplicate) return;

    const newMessage = { id, text, type, leaving: false };
    setMessages((prev) => [...prev, newMessage]);

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
    }, 300); // match the CSS animation duration
  };

  const dismissMessage = (id) => {
    startExit(id);
  };

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      <div className="toast-wrapper">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`toast-message ${msg.type} ${msg.leaving ? "toast-exit" : ""}`}
            onClick={() => dismissMessage(msg.id)}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  );
};
