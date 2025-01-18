import React, { useState, useEffect } from 'react';

const Chat = ({ socket, groupName, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = React.useRef(null);

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
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white p-4 shadow-md flex items-center">
        <h2 className="text-xl font-semibold flex-1">#{groupName}</h2>
      </div>
      
      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((msg, index) => (
            <MessageBubble key={index} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2 md:p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
