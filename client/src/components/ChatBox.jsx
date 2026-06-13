import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Send,
  Image,
  Mic,
  MicOff,
  Smile,
  Check,
  CheckCheck,
  Loader2,
  Phone,
  Video,
  Info,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import api from '../services/api';

const ChatBox = ({ activeChat, onNewMessageSent }) => {
  const { user } = useAuth();
  const { socket, onlineUsers, addMessageListener, removeMessageListener } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  
  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceChunks, setVoiceChunks] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isPartnerOnline = !activeChat.isGroup && onlineUsers.includes(activeChat.chatPartner?._id);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeChat._id}`);
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [activeChat._id]);

  // Handle incoming real-time messages via context listeners
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      // Check if message belongs to this active conversation
      if (data.conversation._id === activeChat._id) {
        setMessages((prev) => [...prev, data.message]);
        
        // Update read receipt state in backend
        api.get(`/messages/${activeChat._id}`);
      }
    };

    addMessageListener(handleIncomingMessage);
    
    // Auto scroll to bottom
    setTimeout(scrollToBottom, 150);

    return () => {
      removeMessageListener(handleIncomingMessage);
    };
  }, [activeChat._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerIsTyping]);

  // Socket listener for typing indicators
  useEffect(() => {
    if (socket) {
      socket.on('typing', ({ conversationId, senderId }) => {
        if (conversationId === activeChat._id && senderId !== user._id) {
          setPartnerIsTyping(true);
        }
      });

      socket.on('stopTyping', ({ conversationId, senderId }) => {
        if (conversationId === activeChat._id && senderId !== user._id) {
          setPartnerIsTyping(false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('typing');
        socket.off('stopTyping');
      }
    };
  }, [socket, activeChat._id, user._id]);

  // Handle Input typing socket broadcasts
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: activeChat._id,
        receiverId: activeChat.chatPartner?._id,
      });
    }

    // Debounce typing stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('stopTyping', {
          conversationId: activeChat._id,
          receiverId: activeChat.chatPartner?._id,
        });
      }
    }, 1500);
  };

  // Handle sending message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment && voiceChunks.length === 0) return;

    // Stop typing indicator instantly
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    if (socket) {
      socket.emit('stopTyping', {
        conversationId: activeChat._id,
        receiverId: activeChat.chatPartner?._id,
      });
    }

    const formData = new FormData();
    formData.append('conversationId', activeChat._id);
    formData.append('text', inputText);

    if (attachment) {
      formData.append('media', attachment);
    } else if (voiceChunks.length > 0) {
      // Build voice audio file
      const audioBlob = new Blob(voiceChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      formData.append('media', audioFile);
    }

    try {
      const res = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setInputText('');
        setAttachment(null);
        setAttachmentPreview(null);
        setVoiceChunks([]);
        
        if (onNewMessageSent) onNewMessageSent(res.data.conversation);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Voice Recording trigger controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setVoiceChunks(chunks);
        stream.getTracks().forEach((track) => track.stop()); // close microphone
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setVoiceChunks([]);
    } catch (err) {
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  // Voice player helper
  const AudioPlayer = ({ url }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    };

    return (
      <div className="flex items-center space-x-2.5 px-3 py-2 bg-neutral-100 dark:bg-premium-darkBorder rounded-xl max-w-xs">
        <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
        <button onClick={togglePlay} className="p-2 bg-instagram-blue text-white rounded-full hover:scale-105 transition">
          {playing ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
        </button>
        {/* visual waveform waveform simulation */}
        <div className="flex space-x-0.5 items-center h-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-0.75 bg-instagram-blue rounded-full transition-all duration-300 ${
                playing ? 'pulse-waveform h-4' : 'h-1.5'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard overflow-hidden shadow-sm transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-premium-lightBorder dark:border-premium-darkBorder">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={activeChat.displayPic || '/uploads/default-avatar.png'}
              alt={activeChat.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isPartnerOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-premium-darkCard rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">{activeChat.displayName}</h3>
            {activeChat.isGroup ? (
              <span className="text-[10px] text-neutral-400 font-semibold">{activeChat.participants.length} members</span>
            ) : (
              <span className="text-[10px] text-neutral-400 font-semibold">
                {isPartnerOnline ? 'Active Now' : 'Offline'}
              </span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-3 text-neutral-600 dark:text-neutral-300">
          <button className="hover:text-instagram-blue transition"><Phone size={18} /></button>
          <button className="hover:text-instagram-blue transition"><Video size={20} /></button>
          <button className="hover:text-instagram-blue transition"><Info size={19} /></button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-neutral-50/50 dark:bg-premium-darkBg/10 scrollbar-thin scrollbar-thumb-premium-darkBorder">
        {messages.map((msg, index) => {
          const isSender = msg.sender?._id === user._id || msg.sender === user._id;
          
          return (
            <div key={msg._id} className={`flex items-end space-x-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {!isSender && (
                <img
                  src={msg.sender?.profilePic || '/uploads/default-avatar.png'}
                  alt={msg.sender?.username}
                  className="w-7 h-7 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder mb-0.5"
                />
              )}
              
              <div className="flex flex-col space-y-1 max-w-[70%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs md:text-sm select-text ${
                    isSender
                      ? 'bg-instagram-blue text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder text-neutral-800 dark:text-neutral-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {/* Media uploads inside DMs */}
                  {msg.mediaType === 'image' && (
                    <img src={msg.mediaUrl} alt="mediaDM" className="rounded-lg max-w-full max-h-40 object-cover mb-2" />
                  )}
                  {msg.mediaType === 'video' && (
                    <video src={msg.mediaUrl} className="rounded-lg max-w-full max-h-40 object-cover mb-2" controls />
                  )}
                  {msg.mediaType === 'voice' && (
                    <AudioPlayer url={msg.mediaUrl} />
                  )}

                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                </div>

                {/* Info (date, read receipt ticks) */}
                <div className={`flex items-center space-x-1 text-[9px] text-neutral-400 font-bold uppercase ${isSender ? 'justify-end' : 'justify-start'}`}>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isSender && (
                    msg.readBy.length > 1 ? (
                      <CheckCheck size={11} className="text-instagram-blue" />
                    ) : (
                      <Check size={11} />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Partner Typing Indicator */}
        {partnerIsTyping && (
          <div className="flex items-center space-x-2">
            <img
              src={activeChat.displayPic || '/uploads/default-avatar.png'}
              alt="avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl px-4 py-2 text-xs text-neutral-400 flex items-center space-x-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel drawer */}
      <div className="border-t border-premium-lightBorder dark:border-premium-darkBorder p-3.5 bg-white dark:bg-premium-darkCard">
        
        {/* Attachment preview */}
        {attachmentPreview && (
          <div className="relative inline-block border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl overflow-hidden bg-neutral-50 mb-3 p-1">
            {attachment.type.startsWith('video') ? (
              <video src={attachmentPreview} className="w-20 h-20 object-cover" muted />
            ) : (
              <img src={attachmentPreview} alt="preview attachment" className="w-20 h-20 object-cover" />
            )}
            <button
              onClick={() => {
                setAttachment(null);
                setAttachmentPreview(null);
              }}
              className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full transition"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}

        {/* Voice recording indicators */}
        {isRecording && (
          <div className="flex items-center justify-between bg-neutral-50 dark:bg-premium-darkBg px-4 py-2.5 rounded-xl text-xs text-neutral-500 mb-3 border border-premium-lightBorder dark:border-premium-darkBorder">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Recording voice message...</span>
            </div>
            <button type="button" onClick={stopRecording} className="text-instagram-red font-bold flex items-center space-x-1">
              <MicOff size={14} />
              <span>Stop</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-3">
          
          {/* File select button */}
          <label className="text-neutral-500 hover:text-instagram-blue transition cursor-pointer">
            <Image size={21} />
            <input type="file" onChange={handleAttachmentChange} accept="image/*,video/*" className="hidden" />
          </label>

          {/* Microphone recording button */}
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
            className="text-neutral-500 hover:text-instagram-blue transition disabled:text-neutral-300"
          >
            <Mic size={21} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={isRecording ? "Voice lock active..." : "Message..."}
            disabled={isRecording}
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2 rounded-full border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-xs focus:outline-none focus:ring-2 focus:ring-instagram-blue text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachment && voiceChunks.length === 0}
            className="p-2.5 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-100 dark:disabled:bg-premium-darkBorder text-white rounded-full transition shadow-xs hover:scale-105"
          >
            <Send size={15} />
          </button>

        </form>
      </div>

    </div>
  );
};

export default ChatBox;
