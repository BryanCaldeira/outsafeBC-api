const SQLClient = require("./index.js");

async function getUsers() {
  const response = await SQLClient.query(`select * from users`);

  return response;
}

async function getUser(id) {
  const response = await SQLClient.query(
    `select * from users where id = '${id}' `
  );

  return response;
}

async function getUserWithFirebase(id) {
  const response = await SQLClient.query(
    `select u.*, n.is_enabled as notifications_enabled from users u left join notifications n on n.user_id = u.id where u.firebase_user_id = '${id}' `
  );

  return response;
}

async function createUser(firebase_user_id, name, email, provider, photo) {
  const response = await SQLClient.query(
    `insert into users (firebase_user_id, name, email,  provider, photo) 
    values 
    ('${firebase_user_id}',
    '${name}',
    '${email}',
    '${provider}',    
    '${photo}'
    )
    returning id , created_at
    `
  );

  return response;
}

async function updateUser(id, name, photo) {
  const fields = [
    { key: "name", value: name },
    { key: "photo", value: photo },
  ]
    .filter(({ value }) => !!value)
    .map(({ value, key }) => `${key} = '${value}'`)
    .join(",");

  const response = await SQLClient.query(
    `update users
     set updated_at = NOW(),
    ${fields}
     where id = '${id}'
     returning id , name, email, photo, updated_at
    `
  );

  return response;
}

async function deleteUser(firebaseUserId) {
  const result = await getUserWithFirebase(firebaseUserId);

  const user = result.rows[0];

  const response = await SQLClient.query(
    `update users
     set deleted_at = NOW(),
     name = '',
     photo = '',
     firebase_user_id = NULL
     where id = '${user.id}'
     returning id
    `
  );

  return response;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserWithFirebase,
};
