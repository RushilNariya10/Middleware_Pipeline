const path = require('path');
const taskApiDir = path.join(__dirname, '../task-api');
// Add task-api node_modules to module paths
module.paths.push(path.join(taskApiDir, 'node_modules'));
module.paths.push(path.join(__dirname, 'node_modules'));

require('dotenv').config({ path: path.join(taskApiDir, '.env') });
const mongoose = require('mongoose');
const Task = require(path.join(taskApiDir, 'models/Task'));
const User = require(path.join(taskApiDir, 'models/User'));

const DEMO_USER = {
  email: 'student24it055@charusat.edu.in',
  password: 'Password123!'
};

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  // Parse command line arguments
  const countArg = process.argv.find(arg => arg.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 2500;
  const resetArg = process.argv.includes('--clean');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  // 1. Ensure demo user exists
  let user = await User.findOne({ email: DEMO_USER.email });
  if (!user) {
    console.log(`Creating demo user: ${DEMO_USER.email}...`);
    user = await User.create(DEMO_USER);
    console.log('Demo user created with ID:', user._id);
  } else {
    console.log(`Demo user exists (${DEMO_USER.email}), ID: ${user._id}`);
  }

  // 2. Clear existing tasks if requested
  if (resetArg) {
    console.log('Clearing existing tasks...');
    await Task.deleteMany({});
  }

  const existingCount = await Task.countDocuments();
  console.log(`Current task count in database: ${existingCount}`);

  if (existingCount >= count && !resetArg) {
    console.log(`Database already has ${existingCount} tasks (>= requested ${count}). Skipping bulk insertion.`);
    console.log('Seed completed successfully.');
    await mongoose.disconnect();
    return;
  }

  const needed = count - existingCount;
  console.log(`Seeding ${needed} realistic task documents to reach target ${count}...`);

  const titles = [
    'Implement Redis cache fallback',
    'Benchmark Mongoose query response times',
    'Review JWT token expiration logic',
    'Write unit tests for authentication middleware',
    'Optimize database connection pooling',
    'Design rate limiting policy for API endpoints',
    'Audit OWASP Top 10 vulnerabilities in backend',
    'Configure CORS headers for staging and production',
    'Add compound indexes to MongoDB collections',
    'Implement lazy-loaded dashboard analytics in React',
    'Refactor error handling pipeline for structured responses',
    'Document API contracts using OpenAPI/Swagger',
    'Profile in-memory cache hit ratio and TTL expiration',
    'Verify cache invalidation on PUT and DELETE mutations',
    'Set up automated CI/CD workflow for integration tests'
  ];

  const priorities = ['low', 'medium', 'high'];
  const tasksToInsert = [];

  for (let i = 1; i <= needed; i++) {
    const titleTemplate = titles[i % titles.length];
    const priority = priorities[i % priorities.length];
    const completed = i % 3 === 0;

    tasksToInsert.push({
      title: `${titleTemplate} [#${existingCount + i}]`,
      description: `Task document generated for Practical 9 in-memory caching and query optimization benchmark. Priority: ${priority}, Completed: ${completed}.`,
      priority: priority,
      completed: completed,
      createdAt: new Date(Date.now() - (i * 60000))
    });
  }

  // Insert in batches of 500 for optimal network throughput
  const batchSize = 500;
  for (let i = 0; i < tasksToInsert.length; i += batchSize) {
    const batch = tasksToInsert.slice(i, i + batchSize);
    await Task.insertMany(batch, { ordered: false });
    console.log(`Inserted batch: ${Math.min(i + batchSize, tasksToInsert.length)} / ${tasksToInsert.length} tasks...`);
  }

  console.log('Bulk insertion complete!');
  const finalCount = await Task.countDocuments();
  console.log(`Total tasks now in database: ${finalCount}`);
  console.log(`Demo User Credentials:\n  Email: ${DEMO_USER.email}\n  Password: ${DEMO_USER.password}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Seed script finished.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
