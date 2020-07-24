const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const Task = require('../src/models/task');
const {
  userOne,
  userTwo,
  taskOne,
  setupDatabase,
  userOneId,
  taskTwo,
  taskThree,
} = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should get tasks for user one', async () => {
  const response = await request(app)
    .get('/tasks')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
});

test('Should fetch user task by id', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect({
    description: response.body.description,
    completed: response.body.completed,
  }).toEqual({
    description: task.description,
    completed: task.completed,
  });
});

test('should not fetch user task by id if unauthenticated', async () => {
  const response = await request(app).get(`/tasks/${taskOne._id}`).send().expect(401);

  expect(response.body.task).toBeUndefined();
});

test('should not fetch other users task by id', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userTwo.tokens[0].token}` })
    .send()
    .expect(204);

  const task = await Task.findById(taskOne._id);
  expect(response.body).toEqual({});
  expect(response.body).not.toEqual(task);
});

test('should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=true')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});

test('should fetch only incomplete tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=false')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});

test('should sort tasks by description', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=description')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('first Task');
  expect(response.body[1].description).toBe('second Task');
});

test('should sort tasks by description desc', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=description:desc')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('second Task');
  expect(response.body[1].description).toBe('first Task');
});

test('should sort tasks by completed', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=completed')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].completed).toBe(false);
  expect(response.body[1].completed).toBe(true);
});

test('should sort tasks by completed desc', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=completed:desc')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].completed).toBe(true);
  expect(response.body[1].completed).toBe(false);
});

test('should sort tasks by createdAt', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=createdAt')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('first Task');
  expect(response.body[1].description).toBe('second Task');
});

test('should sort tasks by createdAt desc', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=createdAt:desc')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('second Task');
  expect(response.body[1].description).toBe('first Task');
});

test('should sort tasks by updatedAt', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=updatedAt')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('first Task');
  expect(response.body[1].description).toBe('second Task');
});

test('should sort tasks by updatedAt desc', async () => {
  const response = await request(app)
    .get('/tasks?orderBy=updatedAt:desc')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(2);
  expect(response.body[0].description).toBe('second Task');
  expect(response.body[1].description).toBe('first Task');
});

test('should fetch page of tasks', async () => {
  const response = await request(app)
    .get('/tasks?limit=1')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
});

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: 'From "Should create task for user" test',
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test('should not create task with invalid description', async () => {
  const response = await request(app)
    .post('/tasks')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: '',
    })
    .expect(400);

  expect(response.body.task).toBeUndefined();
});

test('should not create task with invalid completed', async () => {
  const response = await request(app)
    .post('/tasks')
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: 'test',
      completed: '',
    })
    .expect(400);

  expect(response.body.task).toBeUndefined();
});

test('should not update task with invalid description', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: '',
    })
    .expect(400);

  expect(response.body.task).toBeUndefined();
});

test('should not update task with invalid completed', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: 'test',
      completed: '',
    })
    .expect(400);

  expect(response.body.task).toBeUndefined();
});

test('should not update other users task', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskThree._id}`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send({
      description: 'modified',
      completed: false,
    })
    .expect(204);

  expect(response.body.task).toBeUndefined();
});

test('should delete user task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .send()
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
});

test('should not delete task if unauthenticated', async () => {
  await request(app).delete(`/tasks/${taskOne._id}`).send().expect(401);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should not delete first tasks by userTwo', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set({ Authorization: `Bearer ${userTwo.tokens[0].token}` })
    .send()
    .expect(204);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should upload task image', async () => {
  await request(app)
    .post(`/tasks/${taskOne._id}/image`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .attach('image', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task.image).toEqual(expect.any(Buffer));
});

test('Should read task image', async () => {
  await request(app)
    .post(`/tasks/${taskOne._id}/image`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .attach('image', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  await request(app).get(`/tasks/${taskOne._id}/image`).expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task.image).toEqual(expect.any(Buffer));
});

test('Should delete task image', async () => {
  await request(app)
    .post(`/tasks/${taskOne._id}/image`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .attach('image', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  await request(app)
    .delete(`/tasks/${taskOne._id}/image`)
    .set({ Authorization: `Bearer ${userOne.tokens[0].token}` })
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task.image).toBeUndefined();
});
