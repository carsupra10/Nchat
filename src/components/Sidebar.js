import React from 'react';

const Sidebar = ({ groups, activeGroup, onSelectGroup, username, onCreateGroup }) => {
  const [newGroupName, setNewGroupName] = React.useState('');

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  return (
    <div className="w-64 bg-gray-800 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <p className="text-white text-lg font-semibold">Welcome, {username}!</p>
      </div>
      
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
            className="flex-1 p-2 rounded-lg bg-gray-700 text-white"
          />
          <button
            onClick={handleCreateGroup}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((group, index) => (
          <div
            key={index}
            onClick={() => onSelectGroup(group)}
            className={`p-4 cursor-pointer hover:bg-gray-700 ${
              activeGroup === group ? 'bg-gray-700' : ''
            }`}
          >
            <p className="text-white"># {group}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
