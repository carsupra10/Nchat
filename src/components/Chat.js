import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, groupName, username, onMenuClick }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = React.useRef(null);
  const chatContainerRef = useRef(null);
  const headerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.emit('join_group', groupName);
    
    return () => {
      socket.off('receive_message');
      socket.emit('leave_group', groupName);
    };
  }, [socket, groupName]);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    
    const handleResize = () => {
      if (!visualViewport) return;
      
      const viewport = {
        height: visualViewport.height,
        offsetTop: visualViewport.offsetTop,
      };

      if (viewport.height < window.innerHeight) {
        // Keyboard is open
        const heightDiff = window.innerHeight - viewport.height;
        setKeyboardHeight(heightDiff);
        // Adjust scroll position
        scrollToBottom();
      } else {
        setKeyboardHeight(0);
      }
    };

    visualViewport?.addEventListener('resize', handleResize);
    visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      visualViewport?.removeEventListener('resize', handleResize);
      visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('send_message', {
        groupName,
        message: message.trim(),
        username
      });
      setMessage('');
    }
  };

  const MessageBubble = ({ msg }) => {
    if (msg.sender === 'System') {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-600">
            {msg.message}
          </div>
        </div>
      );
    }

    const isOwnMessage = msg.username === username;
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isOwnMessage
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-white text-gray-800 mr-auto'
          }`}
        >
          <div className={`text-xs mb-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {msg.username}
          </div>
          <div className="break-words">{msg.message}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      {/* Fixed Header */}
      <div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 bg-white shadow-md z-10"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold">#{groupName}</h2>
              <p className="text-sm text-gray-500">
                {messages.filter(m => m.sender !== 'System').length} messages today
              </p>
            </div>
          </div>
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area with dynamic padding for header */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingTop: headerRef.current ? headerRef.current.offsetHeight : '73px',
          paddingBottom: keyboardHeight > 0 ? '60px' : '80px'
        }}
      >
        <div className="p-4 space-y-2">
          {messages.map((msg, index) => (
            <MessageBubble key={index} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white border-t`}
        style={{
          transform: `translateY(${keyboardHeight > 0 ? -keyboardHeight : 0}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div className="p-2">
          <div className="flex space-x-2 items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => scrollToBottom()}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-3 border rounded-full focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={sendMessage}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
