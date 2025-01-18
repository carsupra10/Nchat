import React, { useState } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';

const socket = io('http://localhost:3001');

const App = () => {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  React.useEffect(() => {
    socket.on('group_list', setGroups);
    return () => socket.off('group_list');
  }, []);

  const handleCreateGroup = (groupName) => {
    socket.emit('create_group', groupName);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) {
    return <Login onLogin={setUser} socket={socket} />;
  }

  return (
    <div className="flex h-screen relative">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
      >
        ☰
      </button>

      {/* Sidebar with mobile responsive classes */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transform transition-transform duration-300 ease-in-out
        fixed md:static left-0 top-0 h-full z-40
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

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1">
        {activeGroup ? (
          <Chat
            socket={socket}
            groupName={activeGroup}
            username={user.username}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-500">Select a group to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
