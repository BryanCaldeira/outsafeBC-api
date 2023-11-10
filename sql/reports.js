// id uuid not null default gen_random_uuid (),
// created_at timestamp with time zone not null default now(),
// latitude numeric null,
// longitude numeric null,
// address text null,
// category_option_id uuid null,
// comments text null,
// images text[] not null default '{}'::text[],
// user_id uuid not null,
// updated_at timestamp with time zone null,
// deleted_at timestamp with time zone null,
// still_there_count numeric null,
// not_there_count numeric null,
// flagged_count numeric null,
// index numeric not null default nextval('increment'::regclass),

const SQLClient = require("./index.js");

// params
// cursor
// size
// user_id
// type //recent or past
// lat
// lng
// radius
// hazard_option_ids

async function getReports(data) {
  const {
    user_id,
    lat,
    lng,
    hazard_option_ids,
    category_ids,
    type,
    size = 10,
    cursor = 0,
    radius = 50,
    count_only = false,
    active_only = false,
  } = data;
  const params = [];

  if (user_id) {
    params.push(`user_id = '${user_id}'`);
  }

  // if (!!lat && !!lng) {
  //   const extraRadius = (+radius * 0.0449) / 5;
  //   const minLat = Math.abs(+lat) - extraRadius;
  //   const maxLat = Math.abs(+lat) + extraRadius;

  //   // console.log(extraRadius / Math.cos(+lat));
  //   const minLng = Math.abs(+lng) - extraRadius / Math.cos(+lat);
  //   const maxLng = Math.abs(+lng) + extraRadius / Math.cos(+lat);

  //   if (+lat < 0) {
  //     params.push(`r.latitude <= ${-minLat} and r.latitude >= ${-maxLat}`);
  //   } else {
  //     params.push(`r.latitude >= ${minLat} and r.latitude <= ${maxLat}`);
  //   }

  //   if (+lng < 0) {
  //     params.push(`r.longitude <= ${-minLng} and r.longitude >= ${-maxLng}`);
  //   } else {
  //     params.push(`r.longitude >= ${minLng} and r.longitude <= ${maxLng}`);
  //   }
  // }

  if (hazard_option_ids && hazard_option_ids.length) {
    params.push(
      `co.id in (${hazard_option_ids.map((id) => `'${id}'`).join(",")})`
    );
  }

  if (category_ids && category_ids.length) {
    params.push(`c.id in (${category_ids.map((id) => `'${id}'`).join(",")})`);
  }

  if (type === "recent" || type === "past") {
    params.push(
      `${
        type === "past"
          ? `r.created_at <= (CURRENT_DATE - INTERVAL '2 days')`
          : `r.created_at > (CURRENT_DATE - INTERVAL '2 days')`
      }`
    );
  }

  if (active_only) {
    params.push("r.deleted_at isnull");
  }

  let where = "";

  //   console.log(params);
  if (params.length) {
    where += ` where ${params.join(" and ")}`;
  }

  // console.log({ params, where });

  const countQuery = `
  SELECT COUNT(*) 
  FROM hazard_reports hr  join category_options co on co.id = hr.category_option_id
  join categories c on c.id = co.category_id
  left join users u on u.id = hr.user_id ${where.replaceAll(" r.", " hr.")}
  `;

  // if (cursor > -1) {
  //   params.push(`r.index > ${cursor}`);
  //   where = ` where ${params.join(" and ")} `;
  // }
  // console.log({ countQuery });

  if (!count_only) {
    const queryString = `select r.*, c.id as category_id, c.name as category_name, c.ui_settings as category_settings, co.id as hazard_option_id, co.name as hazard_option_name, u.name as user_name, u.email as user_email, u.photo as user_photo
  , (${countQuery}) as count
   from hazard_reports r
       join category_options co on co.id = r.category_option_id
       join categories c on c.id = co.category_id
       left join users u on u.id = r.user_id
       ${where} ORDER BY r.index asc 
   `;
    //   console.log(queryString);
    const response = await SQLClient.query(queryString);

    return response;
  } else {
    const response = await SQLClient.query(countQuery);

    return response;
  }
}

async function getReportsById(reportId) {
  const response = await SQLClient.query(
    `select r.*, co.name as hazard_option_name, c.id as category_id, c.name as category_name,c.ui_settings as category_settings, u.name as user_name, u.email as user_email, u.photo as user_photo from hazard_reports r 
    join category_options co on r.category_option_id = co.id
    join categories c on co.category_id = c.id
    left join users u on r.user_id = u.id
    where 
    r.id = '${reportId}'
    `
  );

  return response;
}

// async function updateReportEndorsement(reportId, userId, stillThere = true ) {
//     const response = await SQLClient.query(
//       `update endorsed_reports set still_there = ${stillThere}  where hazard_report_id = '${reportId}' and user_id = '${userId}'`
//     );

//     return response;
//   }

async function getEndorsedReports(reportId, userId) {
  const response = await SQLClient.query(
    `select * from endorsed_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' and is_active = true limit 1`
  );

  return response;
}

async function createReportEndorsement(reportId, userId, stillThere = true) {
  const selectEndorsement = await SQLClient.query(
    `select * from endorsed_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' and is_active = true limit 1`
  );

  const isAlreadyEndorsed = selectEndorsement.rowCount > 0;

  const isStillThere = selectEndorsement.rows[0]?.still_there === true;

  // insert into endorsed_reports defaulted to is_active true
  await SQLClient.query(
    `
      BEGIN;
      ${
        isAlreadyEndorsed && isStillThere && !stillThere
          ? `update hazard_reports set still_there_count = still_there_count - 1 where id = '${reportId}' ;`
          : ""
      }
      ${
        isAlreadyEndorsed && !isStillThere && stillThere
          ? `update hazard_reports set not_there_count = not_there_count - 1 where id = '${reportId}' ;`
          : ""
      }

      ${
        isAlreadyEndorsed
          ? `update endorsed_reports set is_active = false where user_id = '${userId}' and hazard_report_id = '${reportId}';`
          : ` insert into endorsed_reports (user_id, hazard_report_id, still_there)
          values (
           '${userId}',
           '${reportId}',
           ${stillThere}
          );
          `
      }

       ${
         !!stillThere
           ? `update hazard_reports set still_there_count = still_there_count + 1 where id = '${reportId}' ;`
           : ""
       }
       ${
         !stillThere
           ? `update hazard_reports set not_there_count = not_there_count + 1 where id = '${reportId}' ;`
           : ""
       }
    
       COMMIT;
      `
  );

  const response = await SQLClient.query(
    `select * from hazard_reports where id = '${reportId}';`
  );

  return response;
}

async function getFlaggedReport(reportId, userId) {
  const response = await SQLClient.query(
    `select * from flagged_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' limit 1`
  );

  return response;
}

async function flagReport(reportId, userId) {
  const selectFlaggedReport = await SQLClient.query(
    `select * from flagged_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' limit 1`
  );

  const isAlreadyFlagged = selectFlaggedReport.rowCount > 0;

  await SQLClient.query(
    `
      BEGIN;
      ${
        !!isAlreadyFlagged
          ? `update hazard_reports set flagged_count = flagged_count + 1 where id = '${reportId}' ;`
          : ""
      }

      insert into flagged_reports (user_id, hazard_report_id)
       values (
        '${userId}',
        '${reportId}'
       );
    
       COMMIT;
      `
  );

  const response = await SQLClient.query(
    ` select * from hazard_reports where id = '${reportId}'; `
  );

  return response;
}

async function deleteReport(reportId) {
  const response = await SQLClient.query(
    `update hazard_reports set deleted_at = now() where id = '${reportId}'
     returning *`
  );

  return response;
}

async function enableDeletedReport(reportId) {
  const response = await SQLClient.query(
    `update hazard_reports set deleted_at = NULL where id = '${reportId}'
     returning *`
  );

  return response;
}

async function createReport(data) {
  const {
    latitude,
    longitude,
    address,
    category_option_id,
    comment,
    images,
    user_id,
  } = data;

  const insertImages = images.length
    ? ` ARRAY [${images.map((image) => `'${image}'`).join(",")}] `
    : " '{}'::text[]";

  const query = `insert into hazard_reports (latitude, longitude, address, category_option_id, comments, user_id , images)
  values (${latitude}, ${longitude}, '${address?.replace(
    /["']/g,
    ""
  )}', '${category_option_id}', '${
    comment ?? ""
  }', '${user_id}' , ${insertImages} )
 
   returning *
 `;

  // console.log({ query });
  const response = await SQLClient.query(query);

  return response;
}

async function updateReport(data) {
  const {
    id,
    user_id,
    latitude,
    longitude,
    address,
    category_option_id,
    comment,
    images,
  } = data;

  const updateImages = images.length
    ? ` , images = ARRAY [${images.map((image) => `'${image}'`).join(",")}]`
    : ",images =  '{}'::text[] ";

  const query = `update hazard_reports set 
  latitude = ${latitude}, 
  longitude = ${longitude}, 
  address = '${address}', 
  category_option_id = '${category_option_id}', 
  comments = '${comment ?? ""}'
  ${updateImages}
  where id = '${id}' and user_id = '${user_id}'

   returning *
 `;

  // console.log({ query });
  const response = await SQLClient.query(query);

  return response;
}

module.exports = {
  enableDeletedReport,
  getReports,
  getReportsById,
  deleteReport,
  createReportEndorsement,
  createReport,
  updateReport,
  getEndorsedReports,
  flagReport,
  getFlaggedReport,
};
