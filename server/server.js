const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Update CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Add basic Express route for testing
app.get('/', (req, res) => {
  res.send('Server is running');
});

// File paths
const usersFilePath = path.join(__dirname, 'data', 'users.json');
const groupsFilePath = path.join(__dirname, 'data', 'groups.json');
const chatsFilePath = path.join(__dirname, 'data', 'chats.json');

// Data storage with proper structure
let groups = {}; // { groupName: { members: [], createdAt: timestamp } }
let users = {};  // { socketId: { deviceId: string, lastSeen: timestamp } }
let messages = {}; // { groupName: [{ message, sender, timestamp }, ...] }
let userGroups = {}; // Track user's active groups
let registeredUsers = {}; // { deviceId: { username, lastSeen } }

// Helper functions for file operations
async function loadData() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const [usersData, groupsData, chatsData, registeredData] = await Promise.all([
      fs.readFile(usersFilePath, 'utf8').catch(() => '{"users":{}}'),
      fs.readFile(groupsFilePath, 'utf8').catch(() => '{"groups":{}}'),
      fs.readFile(chatsFilePath, 'utf8').catch(() => '{"messages":{}}'),
      fs.readFile(path.join(__dirname, 'data', 'registered.json'), 'utf8').catch(() => '{"users":{}}')
    ]);
    users = JSON.parse(usersData).users;
    groups = JSON.parse(groupsData).groups;
    messages = JSON.parse(chatsData).messages;
    registeredUsers = JSON.parse(registeredData).users;

    // Clean up old messages (older than 24 hours)
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    Object.keys(messages).forEach(groupName => {
      messages[groupName] = messages[groupName].filter(msg => 
        msg.timestamp > yesterday
      );
    });
  } catch (error) {
    console.error('Error loading data:', error);
    users = {};
    groups = {};
    messages = {};
  }
}

async function saveData() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await Promise.all([
      fs.writeFile(usersFilePath, JSON.stringify({ users }, null, 2)),
      fs.writeFile(groupsFilePath, JSON.stringify({ groups }, null, 2)),
      fs.writeFile(chatsFilePath, JSON.stringify({ messages }, null, 2)),
      fs.writeFile(path.join(__dirname, 'data', 'registered.json'), JSON.stringify({ users: registeredUsers }, null, 2))
    ]);
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load initial data
loadData();

// Add new message handler function
async function saveMessageToFile(groupName, message) {
  try {
    const chatFile = path.join(__dirname, 'data', 'chats', `${groupName}.json`);
    await fs.mkdir(path.join(__dirname, 'data', 'chats'), { recursive: true });
    
    let messages = [];
    try {
      const existing = await fs.readFile(chatFile, 'utf8');
      messages = JSON.parse(existing);
    } catch (err) {
      messages = [];
    }

    // Keep only last 24 hours messages
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    messages = messages.filter(msg => msg.timestamp > yesterday);
    messages.push(message);
    
    await fs.writeFile(chatFile, JSON.stringify(messages, null, 2));
    return messages;
  } catch (error) {
    console.error('Error saving message:', error);
    return [];
  }
}

async function loadGroupMessages(groupName) {
  try {
    const chatFile = path.join(__dirname, 'data', 'chats', `${groupName}.json`);
    const data = await fs.readFile(chatFile, 'utf8');
    const messages = JSON.parse(data);
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    return messages.filter(msg => msg.timestamp > yesterday);
  } catch (error) {
    return [];
  }
}

// Add device verification
const verifyDevice = async (deviceId, fingerprint, deviceInfo) => {
  try {
    if (!registeredUsers[deviceId]) return false;

    const userDevice = registeredUsers[deviceId];
    
    // Check if fingerprint matches
    if (!userDevice.fingerprint) {
      userDevice.fingerprint = fingerprint;
      userDevice.deviceInfo = deviceInfo;
      await saveData();
      return true;
    }

    // Compare device info for VPN detection
    const significantChanges = detectSignificantChanges(userDevice.deviceInfo, deviceInfo);
    if (significantChanges) {
      console.log(`Suspicious login attempt for device ${deviceId}`);
      return false;
    }

    return userDevice.fingerprint === fingerprint;
  } catch (error) {
    console.error('Device verification error:', error);
    return false;
  }
};

const detectSignificantChanges = (oldInfo, newInfo) => {
  // Check for suspicious changes that might indicate VPN
  const criticalChanges = [
    oldInfo.platform !== newInfo.platform,
    oldInfo.screenResolution !== newInfo.screenResolution,
    oldInfo.language !== newInfo.language
  ];

  return criticalChanges.filter(Boolean).length >= 2;
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add device verification handler
  socket.on('verify_device', async ({ deviceId, fingerprint, deviceInfo }) => {
    const isValid = await verifyDevice(deviceId, fingerprint, deviceInfo);
    socket.emit('device_verification', { success: isValid });
  });

  socket.on('register', async ({ deviceId, username, deviceInfo }) => {
    // Add fingerprint generation
    const fingerprint = await generateDeviceFingerprint(deviceInfo);
    
    if (registeredUsers[deviceId]) {
      socket.emit('login_response', {
        success: false,
        message: 'Device already registered. Please login.'
      });
      return;
    }

    registeredUsers[deviceId] = {
      username,
      lastSeen: Date.now(),
      fingerprint,
      deviceInfo
    };

    users[socket.id] = {
      deviceId,
      username,
      lastSeen: Date.now()
    };

    saveData();
    socket.emit('login_response', {
      success: true,
      deviceId,
      username
    });
    socket.emit('group_list', Object.keys(groups));
  });

  socket.on('login', ({ deviceId, username }) => {
    const registeredUser = registeredUsers[deviceId];
    if (!registeredUser || registeredUser.username !== username) {
      socket.emit('login_response', {
        success: false,
        message: 'Invalid credentials. Please try again.'
      });
      return;
    }

    users[socket.id] = {
      deviceId,
      username,
      lastSeen: Date.now()
    };

    registeredUser.lastSeen = Date.now();
    saveData();

    socket.emit('login_response', {
      success: true,
      deviceId,
      username
    });
    socket.emit('group_list', Object.keys(groups));
  });

  socket.on('create_group', (groupName) => {
    if (!groups[groupName]) {
      groups[groupName] = {
        members: [],
        createdAt: Date.now()
      };
      messages[groupName] = [];
      saveData();
      io.emit('group_list', Object.keys(groups));
      console.log(`Group created: ${groupName}`);
    } else {
      socket.emit('error', 'Group already exists');
    }
  });

  socket.on('join_group', async (groupName) => {
    if (groups[groupName]) {
      // Check if user is already in group
      if (!userGroups[socket.id]) userGroups[socket.id] = new Set();
      
      if (!userGroups[socket.id].has(groupName)) {
        userGroups[socket.id].add(groupName);
        groups[groupName].members.push(socket.id);
        socket.join(groupName);
        
        // Load recent messages
        const recentMessages = await loadGroupMessages(groupName);
        socket.emit('existing_messages', recentMessages);

        const joinMessage = {
          message: `${users[socket.id]?.username} joined the group`,
          sender: 'System',
          timestamp: Date.now()
        };
        
        await saveMessageToFile(groupName, joinMessage);
        io.to(groupName).emit('receive_message', joinMessage);
        saveData();
      }
    }
  });

  socket.on('send_message', async ({ groupName, message, username }) => {
    if (groups[groupName] && groups[groupName].members.includes(socket.id)) {
      const msg = {
        message,
        username,
        timestamp: Date.now(),
      };
      
      await saveMessageToFile(groupName, msg);
      io.to(groupName).emit('receive_message', msg);
    }
  });

  socket.on('leave_group', (groupName) => {
    if (groups[groupName] && userGroups[socket.id]?.has(groupName)) {
      socket.leave(groupName);
      userGroups[socket.id].delete(groupName);
      groups[groupName].members = groups[groupName].members.filter(id => id !== socket.id);
      
      io.to(groupName).emit('receive_message', {
        message: `${users[socket.id]?.username} left the group`,
        sender: 'System',
        timestamp: Date.now()
      });
      
      saveData();
    }
  });

  socket.on('disconnect', () => {
    const username = users[socket.id]?.username;
    
    // Clean up user's group memberships
    if (userGroups[socket.id]) {
      for (const groupName of userGroups[socket.id]) {
        groups[groupName].members = groups[groupName].members.filter(id => id !== socket.id);
        io.to(groupName).emit('receive_message', {
          message: `${username} disconnected`,
          sender: 'System',
          timestamp: Date.now()
        });
      }
      delete userGroups[socket.id];
    }

    delete users[socket.id];
    saveData();
    console.log(`User disconnected: ${username}`);
  });
});

// Periodically save data
setInterval(saveData, 5 * 60 * 1000);

// Clean up old messages every hour
setInterval(() => {
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  Object.keys(messages).forEach(groupName => {
    messages[groupName] = messages[groupName].filter(msg => 
      msg.timestamp > yesterday
    );
  });
  saveData();
}, 60 * 60 * 1000);

// Update port to use environment variable
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
