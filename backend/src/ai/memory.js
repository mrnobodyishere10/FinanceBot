let userMemory = {};

function saveUserMemory(userId, data) {
    if(!userMemory[userId]) userMemory[userId] = [];
    userMemory[userId].push(data);
}

function getUserMemory(userId) {
    return userMemory[userId] || [];
}

module.exports = { saveUserMemory, getUserMemory };
