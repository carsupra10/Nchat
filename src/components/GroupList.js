import React, { useState, useEffect } from 'react';

const GroupList = ({ socket, onJoinGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const refreshGroups = () => socket.emit('fetch_groups');
    
    socket.on('group_list', (availableGroups) => {
      setGroups(availableGroups);
    });

    // Fetch groups immediately and set up periodic refresh
    refreshGroups();
    const interval = setInterval(refreshGroups, 5000);

    return () => {
      socket.off('group_list');
      clearInterval(interval);
    };
  }, [socket]);

  const createGroup = () => {
    if (groupName.trim()) {
      socket.emit('create_group', groupName.trim());
      setGroupName('');
    }
  };

  const joinGroup = (group) => {
    socket.emit('join_group', group);
    onJoinGroup(group);
  };

  const filteredGroups = groups.filter(group => 
    group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Chat Groups</h2>
        
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Create Group Input */}
        <div className="flex mb-4">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="flex-1 border border-gray-300 p-2 rounded-l focus:outline-none"
          />
          <button
            onClick={createGroup}
            className="px-4 bg-green-500 text-white rounded-r hover:bg-green-600 transition duration-300"
          >
            Create
          </button>
        </div>

        <ul className="max-h-60 overflow-y-auto">
          {filteredGroups.map((group, index) => (
            <li
              key={index}
              className="p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition duration-200 flex justify-between items-center"
              onClick={() => joinGroup(group)}
            >
              <span>{group}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                Click to join
              </span>
            </li>
          ))}
          {filteredGroups.length === 0 && (
            <li className="p-3 text-center text-gray-500">
              {searchTerm ? 'No matching groups found.' : 'No groups available.'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GroupList;
