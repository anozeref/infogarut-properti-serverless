// Polling utilities to replace Socket.IO for real-time features

// Poll for notifications
export const pollNotifications = async (userId, lastCheckTime, callback) => {
  try {
    const response = await fetch(`/api/notifications?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');

    const notifications = await response.json();
    const newNotifications = notifications.filter(n => new Date(n.createdAt) > new Date(lastCheckTime));

    if (newNotifications.length > 0) {
      callback(newNotifications);
    }

    return notifications;
  } catch (error) {
    console.error('Polling error:', error);
    return [];
  }
};

// Poll for property updates (admin)
export const pollProperties = async (lastCheckTime, callback) => {
  try {
    const response = await fetch('/api/properties');
    if (!response.ok) throw new Error('Failed to fetch properties');

    const properties = await response.json();
    const newProperties = properties.filter(p => new Date(p.postedAt) > new Date(lastCheckTime));

    if (newProperties.length > 0) {
      callback(newProperties);
    }

    return properties;
  } catch (error) {
    console.error('Polling error:', error);
    return [];
  }
};

// Poll for user updates (admin)
export const pollUsers = async (lastCheckTime, callback) => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');

    const users = await response.json();
    const updatedUsers = users.filter(u => new Date(u.joinedAt) > new Date(lastCheckTime));

    if (updatedUsers.length > 0) {
      callback(updatedUsers);
    }

    return users;
  } catch (error) {
    console.error('Polling error:', error);
    return [];
  }
};

// Start polling with interval
export const startPolling = (pollFunction, interval = 5000, callback) => {
  let lastCheckTime = new Date().toISOString();

  const poll = async () => {
    const data = await pollFunction(lastCheckTime, callback);
    lastCheckTime = new Date().toISOString();
    return data;
  };

  // Initial poll
  poll();

  // Set up interval
  const intervalId = setInterval(poll, interval);

  return () => clearInterval(intervalId); // Return cleanup function
};