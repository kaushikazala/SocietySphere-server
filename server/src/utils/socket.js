let _io;

const init = (io) => { _io = io; };
const getIO = () => _io;

// Emit to all members of a society room
const toSociety = (societyId, event, data) => {
  if (_io) _io.to(`society:${societyId}`).emit(event, data);
};

// Emit to a specific user's room
const toUser = (userId, event, data) => {
  if (_io) _io.to(`user:${userId}`).emit(event, data);
};

module.exports = { init, getIO, toSociety, toUser };