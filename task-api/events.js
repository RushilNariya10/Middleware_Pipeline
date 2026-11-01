// events.js - Practical 10: one shared EventEmitter for the whole app
const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();

