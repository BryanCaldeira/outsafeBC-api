const SQLClient = require("./index.js");

async function getUser(id) {
  const response = await SQLClient.query(
    `select * from users where id = '${id}' `
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

module.exports = {
  getUser,
  createUser,
};
