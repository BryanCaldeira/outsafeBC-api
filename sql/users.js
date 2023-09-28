const SQLClient = require("./index.js");

async function getUser(id) {
  const response = await SQLClient.query(
    `select * from users where id = '${id}' `
  );

  return response;
}

async function getUserWithFirebase(id) {
  const response = await SQLClient.query(
    `select * from users where firebase_user_id = '${id}' `
  );

  return response;
}

async function createUser(
  firebase_user_id,
  name,
  lastname,
  email,
  provider,
  photo
) {
  const response = await SQLClient.query(
    `insert into users (firebase_user_id, name, lastname, email,  provider, photo) 
    values 
    ('${firebase_user_id}',
    '${name}',
    '${lastname}',
    '${email}',
    '${provider}',    
    '${photo}'
    )
    returning id , created_at
    `
  );

  return response;
}

async function updateUser(id, name, lastname, photo) {
  const fields = [
    { key: "name", value: name },
    { key: "lastname", value: lastname },
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
     returning id , name, lastname, email, photo, updated_at
    `
  );

  return response;
}

module.exports = {
  getUser,
  createUser,
  updateUser,
  getUserWithFirebase,
};
