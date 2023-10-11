const SQLClient = require("./index.js");

async function getByUser(user_id) {
  const response = await SQLClient.query(
    `select * from notifications where user_id = '${user_id}' `
  );

  return response;
}

async function createNotification(user_id, is_enabled = false) {
  const response = await SQLClient.query(
    `insert into notifications (user_id, is_enabled) 
    values 
    ('${user_id}',
    ${is_enabled}
    )
    returning id , created_at, user_id, is_enabled
    `
  );

  return response;
}

async function updateNotification(user_id, is_enabled = false) {
  const response = await SQLClient.query(
    `update notifications
     set updated_at = NOW(),
     is_enabled = ${is_enabled}
     where user_id = '${user_id}'
     returning id , user_id, is_enabled, created_at, updated_at
    `
  );

  return response;
}

async function upsertNotification(user_id, is_enabled = false) {
  const result = await getByUser(user_id);

  if (result.rows.length) {
    return updateNotification(user_id, is_enabled);
  } else {
    return createNotification(user_id, is_enabled);
  }
}

module.exports = {
  getByUser,
  createNotification,
  updateNotification,
  upsertNotification,
};
