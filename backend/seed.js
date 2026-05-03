require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teamtaskmanager';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  console.log('Cleared existing data');

  const admin = await User.create({ name: 'Admin User', email: 'admin@demo.com', password: 'Admin1234', role: 'admin' });
  const alice = await User.create({ name: 'Alice Johnson', email: 'alice@demo.com', password: 'Alice1234', role: 'member' });
  const bob = await User.create({ name: 'Bob Smith', email: 'bob@demo.com', password: 'Bob12345', role: 'member' });
  console.log('Users created');

  const project1 = await Project.create({
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX.',
    owner: admin._id,
    members: [admin._id, alice._id, bob._id]
  });

  const project2 = await Project.create({
    name: 'Mobile App',
    description: 'Cross-platform mobile application for iOS and Android.',
    owner: alice._id,
    members: [alice._id, bob._id]
  });
  console.log('Projects created');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const in5Days = new Date();
  in5Days.setDate(in5Days.getDate() + 5);
  const in2Days = new Date();
  in2Days.setDate(in2Days.getDate() + 2);
  const in10Days = new Date();
  in10Days.setDate(in10Days.getDate() + 10);

  await Task.create([
    {
      title: 'Design mockups',
      description: 'Create high-fidelity mockups for all main pages.',
      assignee: alice._id, priority: 'high', status: 'in_progress',
      dueDate: in3Days, project: project1._id, createdBy: admin._id
    },
    {
      title: 'Write copy',
      description: 'Write all website copy including landing page, about, and product pages.',
      assignee: bob._id, priority: 'medium', status: 'todo',
      dueDate: in5Days, project: project1._id, createdBy: admin._id
    },
    {
      title: 'Deploy to staging',
      description: 'Set up CI/CD pipeline and deploy to staging environment.',
      assignee: alice._id, priority: 'high', status: 'todo',
      dueDate: yesterday, project: project1._id, createdBy: admin._id
    },
    {
      title: 'Build login screen',
      description: 'Implement login and signup screens with form validation.',
      assignee: bob._id, priority: 'high', status: 'done',
      project: project2._id, createdBy: alice._id
    },
    {
      title: 'Push notifications',
      description: 'Integrate push notification service for both iOS and Android.',
      assignee: bob._id, priority: 'medium', status: 'in_progress',
      dueDate: in2Days, project: project2._id, createdBy: alice._id
    },
    {
      title: 'App store submission',
      description: 'Prepare app store assets and submit for review.',
      assignee: alice._id, priority: 'low', status: 'todo',
      dueDate: in10Days, project: project2._id, createdBy: alice._id
    }
  ]);
  console.log('Tasks created');

  console.log('\n✅ Seed complete!');
  console.log('Admin:  admin@demo.com / Admin1234');
  console.log('Alice:  alice@demo.com / Alice1234');
  console.log('Bob:    bob@demo.com   / Bob12345');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });