"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  MessageCircle,
  X,
  Send,
  User,
  Users,
  Smile,
  Heart,
} from "lucide-react";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import Swal from "sweetalert2";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";

const SOCKET_URL = "http://localhost:3001"; // Ajustar para prod

interface ChatMessage {
  id: number;
  username: string;
  text: string;
  timestamp: string;
  deviceId?: string;
  reactions?: { [key: string]: string[] };
}

// Generate consistent color from username
const getUserColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 70%)`; // Bright & Vibrant for dark backgrounds
};

export default function ChatSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Setup: Get/Generate Username & Device ID
  useEffect(() => {
    // Init Audio
    audioRef.current = new Audio("/notification.mp3");

    // Handle Username
    let storedName = localStorage.getItem("zim_chat_username");
    if (!storedName) {
      const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: " ",
        style: "capital",
      });
      storedName = `Oyente ${randomName}`;
      localStorage.setItem("zim_chat_username", storedName);
    }
    setUsername(storedName);

    // Handle Device ID (for tab deduplication)
    let storedDeviceId = localStorage.getItem("zim_device_id");
    if (!storedDeviceId) {
      storedDeviceId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem("zim_device_id", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // Socket Connection
  useEffect(() => {
    if (!username || !deviceId) return;

    // Prevent multiple connections or reconnections on username change
    // This guard ensures the socket is only initialized once per deviceId/username pair
    // and prevents re-initialization if username changes later (which is handled by 'change_username' event)
    if (socketRef.current) return;

    socketRef.current = io(SOCKET_URL);

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      // Send both username and unique device ID
      socket.emit("join", { username, deviceId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      socketRef.current = null; // Clear ref on disconnect
    });

    socket.on("receive_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg].slice(-20));
      if (msg.deviceId !== deviceId) {
        audioRef.current
          ?.play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    });

    socket.on("chat_history", (history: ChatMessage[]) => {
      // Replay messages one by one for effect
      history.forEach((msg, index) => {
        setTimeout(() => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg].slice(-20);
          });
        }, index * 400 + 100); // 400ms stagger
      });
    });

    socket.on("refresh_history", (history: ChatMessage[]) => {
      // Instant update for renames
      setMessages(history);
    });

    socket.on("update_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("message_updated", (updatedMsg: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
      );
    });

    socket.on("user_typing", ({ username, deviceId: incomingDeviceId }) => {
      if (incomingDeviceId !== deviceId) {
        setTypingUsers((prev) => {
          if (!prev.includes(username)) return [...prev, username];
          return prev;
        });

        // Auto-remove after 3 seconds (simple debounce on receiver side)
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }, 3000);
      }
    });

    return () => {
      // Only disconnect on unmount
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]); // Removed username to prevent reconnect loop on rename

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      username,
      text: inputMessage,
    });
    setInputMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (socketRef.current) {
      socketRef.current.emit("typing", username);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stop_typing");
      }, 2000);
    }
  };

  const handleMessageReact = (msgId: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit("react_message", {
      messageId: msgId,
      reaction: "❤️",
      deviceId,
    });
  };

  const handleNameChange = async () => {
    const { value: newName } = await Swal.fire({
      title: "Cambiar Nombre",
      input: "text",
      inputValue: username,
      inputLabel: "Elige tu apodo para el chat",
      inputPlaceholder: "Escribe tu nombre...",
      confirmButtonText: "Guardar",
      confirmButtonColor: "#F59E0B", // zim-orange
      background: "#fff",
      customClass: {
        popup: "rounded-2xl font-display",
        title: "text-zim-blue font-bold",
      },
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      cancelButtonColor: "#9CA3AF",
    });

    if (newName && newName.trim() !== "") {
      console.log("Setting new username in state/localstorage:", newName);
      setUsername(newName);
      localStorage.setItem("zim_chat_username", newName);

      if (socketRef.current) {
        console.log("Emitting change_username event to server:", newName);
        socketRef.current.emit("change_username", newName);
      } else {
        console.error("Socket not connected! Cannot emit change_username");
      }
    }
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close picker when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onEmojiClick = (emojiData: any) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    // Don't close picker immediately to allow multiple emojis
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Floating Header (User Count) */}
      <div className="absolute top-0 right-4 z-10 p-2">
        <div className="bg-black/20 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
          <Users size={12} className="text-zim-green" />
          <span>{onlineUsers.length}</span>
        </div>
      </div>

      {/* Messages Area - Interactive & Scrollable */}
      <div
        className="flex-1 flex flex-col px-4 overflow-y-auto no-scrollbar mask-image-gradient-top relative [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex-1" />{" "}
        {/* Spacer to push messages down initially */}
        <div className="flex flex-col justify-end space-y-3 pb-2 pt-20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="max-w-[85%] bg-black/30 backdrop-blur-md rounded-2xl rounded-tl-none px-4 py-2 text-sm text-white shadow-lg border border-white/10 animate-fade-in-up origin-bottom-left hover:scale-105 hover:bg-black/40 hover:border-white/20 transition-all duration-300 ease-out cursor-default select-none relative z-0 hover:z-10 group"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-bold text-xs drop-shadow-md"
                    style={{ color: getUserColor(msg.username) }}
                  >
                    {msg.username}
                  </span>
                  <span className="text-white/95 font-light drop-shadow-sm leading-snug break-words">
                    {msg.text}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessageReact(msg.id);
                    }}
                    className={`flex items-center gap-1 text-[10px] transition-all px-1.5 py-0.5 rounded-full ${
                      msg.reactions?.["❤️"]?.includes(deviceId)
                        ? "text-rose-500 bg-white/10 font-bold"
                        : "text-white/30 hover:text-rose-400 hover:bg-white/5"
                    }`}
                    title="Me encanta"
                  >
                    <Heart
                      size={10}
                      fill={
                        msg.reactions?.["❤️"]?.includes(deviceId)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    <span>{msg.reactions?.["❤️"]?.length || ""}</span>
                  </button>

                  <span className="text-[10px] text-white/30 font-mono tracking-wide ml-2">
                    {new Date(msg.timestamp).toLocaleString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="absolute bottom-16 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" />
          </div>
          <span className="text-[10px] text-white/70 italic">
            {typingUsers.join(", ")} está{typingUsers.length > 1 ? "n" : ""}{" "}
            escribiendo...
          </span>
        </div>
      )}

      {/* Input Area - Clean & Minimal */}
      <div className="px-4 pb-2 pt-2 relative">
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-16 right-4 z-50 animate-fade-in-up origin-bottom-right shadow-2xl rounded-lg"
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={Theme.AUTO}
              emojiStyle={EmojiStyle.APPLE}
              lazyLoadEmojis={true}
              width={280}
              height={320}
              searchDisabled={true} // Cleaner look
              skinTonesDisabled={true} // Cleaner look
              previewConfig={{ showPreview: false }} // Save space
            />
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="flex gap-2 items-center relative z-20"
        >
          <div
            onClick={handleNameChange}
            className="w-10 h-10 rounded-full bg-zim-blue text-white flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/20"
            title="Cambiar Nombre"
          >
            <User size={18} />
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Envia tu saludo..."
              className="w-full bg-white/80 backdrop-blur-xl rounded-full pl-5 pr-24 py-3 text-sm text-zim-text focus:outline-none focus:ring-2 focus:ring-zim-orange/50 shadow-lg border border-white/40 placeholder-gray-500 font-medium transition-all"
            />

            {/* Action Buttons Container */}
            <div className="absolute right-1 top-1 flex gap-1">
              {/* Emoji Toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-9 h-9 text-zim-blue/60 hover:text-zim-orange hover:bg-zim-orange/10 rounded-full flex items-center justify-center transition-all active:scale-95"
              >
                <Smile size={20} />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-9 h-9 bg-zim-orange text-white rounded-full flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-90"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
