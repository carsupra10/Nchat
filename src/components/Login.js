import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const Login = ({ onLogin, socket }) => {
  const [username, setUsername] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if device is already registered
    const savedDeviceId = localStorage.getItem('deviceId');
    const savedUsername = localStorage.getItem('username');
    if (savedDeviceId && savedUsername) {
      setDeviceId(savedDeviceId);
      setUsername(savedUsername);
      setIsNewUser(false);
    }
  }, []);

  useEffect(() => {
    socket.on('login_response', (response) => {
      if (response.success) {
        localStorage.setItem('deviceId', response.deviceId);
        localStorage.setItem('username', response.username);
        onLogin({ deviceId: response.deviceId, username: response.username });
      } else {
        setError(response.message);
      }
    });

    return () => socket.off('login_response');
  }, [socket, onLogin]);

  useEffect(() => {
    // Add connection status handling
    const handleConnect = () => setError('');
    const handleError = () => setError('Unable to connect to server');

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };
  }, [socket]);

  const handleSignup = () => {
    if (!username.trim()) return;
    const newDeviceId = uuidv4();
    socket.emit('register', { deviceId: newDeviceId, username: username.trim() });
  };

  const handleLogin = () => {
    if (!username.trim() || !deviceId) return;
    socket.emit('login', { deviceId, username: username.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Welcome to Nchat
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:border-blue-500"
        />

        {isNewUser ? (
          <div>
            <button
              onClick={handleSignup}
              disabled={!username.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
            >
              Sign Up
            </button>
            <p className="mt-4 text-center text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setIsNewUser(false)}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={handleLogin}
              disabled={!username.trim()}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
            >
              Login
            </button>
            <p className="mt-4 text-center text-gray-600">
              New user?{' '}
              <button
                onClick={() => setIsNewUser(true)}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
