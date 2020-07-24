const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'nameOne',
  email: 'one@example.com',
  password: 'test1234!',
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET_KEY),
    },
  ],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: 'nameTwo',
  email: 'two@example.com',
  password: 'test1234!',
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET_KEY),
    },
  ],
};

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: 'first Task',
  completed: true,
  owner: userOneId,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: 'second Task',
  completed: false,
  owner: userOneId,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: 'third Task',
  completed: false,
  owner: userTwo._id,
};

const setupDatabase = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOneId,
  userOne,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};
