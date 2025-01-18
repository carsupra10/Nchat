import React from 'react';

const Sidebar = ({ groups, activeGroup, onSelectGroup, username, onCreateGroup, activeUsers = {} }) => {
  const [newGroupName, setNewGroupName] = React.useState('');

  return (
    <div className="w-72 bg-gray-900 h-screen flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            {username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{username}</p>
            <p className="text-gray-400 text-sm">Online</p>
          </div>
        </div>
      </div>
      
      {/* Create Group Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Create new group"
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (newGroupName.trim()) {
                onCreateGroup(newGroupName);
                setNewGroupName('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-gray-400 text-sm font-medium mb-2">GROUPS</h2>
          {groups.map((group, index) => (
            <div
              key={index}
              onClick={() => onSelectGroup(group)}
              className={`
                flex items-center justify-between p-3 rounded-lg mb-1 cursor-pointer
                ${activeGroup === group ? 'bg-gray-700' : 'hover:bg-gray-800'}
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-gray-300">#</span>
                <span className="text-gray-300">{group}</span>
              </div>
              {activeUsers[group] && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  {activeUsers[group]} online
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
