import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';

// Update socket connection with options
const socket = io('https://grizzly-improved-scarcely.ngrok-free.app', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Add connection status monitoring
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

const App = () => {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.on('group_list', setGroups);
    return () => socket.off('group_list');
  }, []);

  useEffect(() => {
    const enableFullScreen = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen && !document.webkitFullscreenElement) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        enableFullScreen();
      }
    };

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      enableFullScreen();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add CSS variables for safe areas
  useEffect(() => {
    const setVHProperty = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', setVHProperty);
    setVHProperty();

    return () => window.removeEventListener('resize', setVHProperty);
  }, []);

  const handleCreateGroup = (groupName) => {
    socket.emit('create_group', groupName);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) {
    return <Login onLogin={setUser} socket={socket} />;
  }

  return (
    <div className="flex h-screen relative bg-gray-50" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
      >
        ☰
      </button>

      {/* Updated Sidebar with transitions */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transform transition-transform duration-300 ease-in-out
        fixed md:static left-0 top-0 h-full z-40
        md:min-w-[18rem] w-72
      `}>
        <Sidebar
          groups={groups}
          activeGroup={activeGroup}
          onSelectGroup={(group) => {
            setActiveGroup(group);
            setIsSidebarOpen(false); // Close sidebar on mobile after selection
          }}
          username={user.username}
          onCreateGroup={handleCreateGroup}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative">
        {activeGroup ? (
          <Chat
            socket={socket}
            groupName={activeGroup}
            username={user.username}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Nchat</h2>
              <p className="text-gray-500">Select a group to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
