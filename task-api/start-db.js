const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'taskdb'
      }
    });
    console.log('====================================================================');
    console.log('  Local MongoDB Server Started');
    console.log('  URI: mongodb://127.0.0.1:27017/taskdb');
    console.log('====================================================================');
    console.log('Running... Keep this window open while using the application.');

    process.on('SIGINT', async () => {
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    if (err.message && err.message.includes('EADDRINUSE')) {
      console.log('MongoDB is already running on port 27017.');
    } else {
      console.error('Failed to start MongoDB memory server:', err.message);
    }
  }
}

run();

