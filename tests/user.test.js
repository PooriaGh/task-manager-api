const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'test',
      email: 'email@example.com',
      password: 'test1234!',
    })
    .expect(201);

  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();
  expect(response.body).toMatchObject({
    user: {
      name: 'test',
      email: 'email@example.com',
    },
    token: user.tokens[0].token,
  });
});

test('should not signup user with invalid name', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: '',
      email: 'email@example.com',
      password: 'test1234!',
    })
    .expect(400);

  expect(response.body.user).toBeUndefined();
  expect(response.body.token).toBeUndefined();
});

test('should not signup user with invalid email', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'test',
      email: 'email',
      password: 'test1234!',
    })
    .expect(400);

  expect(response.body.user).toBeUndefined();
  expect(response.body.token).toBeUndefined();
});

test('should not signup user with invalid password', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'test',
      email: 'email',
      password: 'test',
    })
    .expect(400);

  expect(response.body.user).toBeUndefined();
  expect(response.body.token).toBeUndefined();
});

test('Should login existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'none@example.com',
      password: 'password123!',
    })
    .expect(400);
});

test('Should get profile for authorized user', async () => {
  await request(app)
    .get('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);
});

test('Should get profile for unauthorized user', async () => {
  await request(app).get('/users/me').send().expect(401);
});

test('should not update user if unauthenticated', async () => {
  await request(app).patch('/users/me').send().expect(401);
});

test('should not update user with invalid name', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      name: '',
      email: 'email@example.com',
      password: 'test1234!',
    })
    .expect(500);

  expect(response.body.user).toBeUndefined();
});

test('should not update user with invalid email', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      name: 'test',
      email: 'email',
      password: 'test1234!',
    })
    .expect(500);

  expect(response.body.user).toBeUndefined();
});

test('should not update user with invalid password', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      name: 'test',
      email: 'email@example.com',
      password: 'test',
    })
    .expect(500);

  expect(response.body.user).toBeUndefined();
});

test('Should delete account for user', async () => {
  const response = await request(app)
    .delete('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete user if unauthenticated', async () => {
  await request(app).delete('/users/me').send().expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should upload valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({ name: 'modified', email: 'modified@example.com', password: 'modified1234!' })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toBe('modified');
  expect(user.email).toBe('modified@example.com');
  expect(user.password).not.toBe('modified1234!');
});

test('Should not upload invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({ location: 'location' })
    .expect(400);
});
