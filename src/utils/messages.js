const generateMessage = (message, username) => {
  return { message, username, createdAt: new Date().getTime() };
};

const generateLocationMsg = (locationMsg, username) => {
  return {
    locationMsg,
    username,
    createdAt: new Date().getTime()
  };
};

module.exports = {
  generateMessage,
  generateLocationMsg
};
