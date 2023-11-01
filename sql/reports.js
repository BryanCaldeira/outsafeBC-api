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
    type,
    size = 10,
    cursor = 0,
    radius = 50,
    count_only = false,
  } = data;
  const params = [];

  if (user_id) {
    params.push(`user_id = '${user_id}'`);
  }

  if (!!lat && !!lng) {
    const extraRadius = (+radius * 0.0449) / 5;
    const minLat = Math.abs(+lat) - extraRadius;
    const maxLat = Math.abs(+lat) + extraRadius;

    // console.log(extraRadius / Math.cos(+lat));
    const minLng = Math.abs(+lng) - extraRadius / Math.cos(+lat);
    const maxLng = Math.abs(+lng) + extraRadius / Math.cos(+lat);

    if (+lat < 0) {
      params.push(`r.latitude <= ${-minLat} and r.latitude >= ${-maxLat}`);
    } else {
      params.push(`r.latitude >= ${minLat} and r.latitude <= ${maxLat}`);
    }

    if (+lng < 0) {
      params.push(`r.longitude <= ${-minLng} and r.longitude >= ${-maxLng}`);
    } else {
      params.push(`r.longitude >= ${minLng} and r.longitude <= ${maxLng}`);
    }
  }

  if (hazard_option_ids && hazard_option_ids.length) {
    params.push(
      `co.id in (${hazard_option_ids.map((id) => `'${id}'`).join(",")})`
    );
  }

  if (type === "recent" && type === "past") {
    params.push(
      `${
        type === "recent"
          ? `r.created_at <= (CURRENT_DATE - INTERVAL '2 days')`
          : `r.created_at > (CURRENT_DATE - INTERVAL '2 days')`
      }`
    );
  }

  params.push("r.deleted_at isnull");

  let where = "";

  //   console.log(params);
  if (params.length) {
    where += ` where ${params.join(" and ")}`;
  }

  const countQuery = `
  SELECT COUNT(*) 
  FROM hazard_reports hr ${where.replaceAll(" r.", " hr.")}
  `;

  if (cursor > -1) {
    params.push(`r.index > ${cursor}`);
    where = ` where ${params.join(" and ")} `;
  }
  if (!count_only) {
    const queryString = `select r.*, c.name as category_name, co.id as hazard_option_id, co.name as hazard_option_name
  , (${countQuery}) as count
   from hazard_reports r
       join category_options co on co.id = r.category_option_id
       join categories c on c.id = co.category_id
       ${where} ORDER BY r.index asc LIMIT ${size}
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
    `select * from hazard_reports where id = '${reportId}' and deleted_at isnull`
  );

  return response;
}

// async function updateReportEndorsement(reportId, userId, stillThere = true ) {
//     const response = await SQLClient.query(
//       `update endorsed_reports set still_there = ${stillThere}  where hazard_report_id = '${reportId}' and user_id = '${userId}'`
//     );

//     return response;
//   }

async function createReportEndorsement(reportId, userId, stillThere = true) {
  const selectEndorsement = await SQLClient.query(
    `select * from endorsed_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' and is_active = true limit 1`
  );

  const isAlreadyEndorsed = selectEndorsement.rowCount > 0;
  const isStillThere = selectEndorsement.rows[0]?.still_there === "true";

  // insert into endorsed_reports defaulted to is_valid true
  const response = await SQLClient.query(
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
          ? `update endorsed_reports set is_valid = false where user_id = '${userId}' and hazard_report_id = '${reportId}';`
          : ""
      }

      insert into endorsed_reports (user_id, hazard_report_id, still_there)
       values (
        '${userId}',
        '${reportId}',
        ${stillThere}
       );

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
    
       select * from endorsed_reports where hazard_report_id = '${reportId}' and user_id = '${userId}' and is_active = true limit 1;
       COMMIT;
      `
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
  const response = await SQLClient.query(
    `insert into hazard_reports (latitude, longitude, address, category_option_id, comment, images, user_id)
       values (${latitude}, ${longitude}, '${address}', '${category_option_id}', '${
      comment ?? ""
    }', ARRAY [${images.join(",")}], '${user_id}' )
        returning *
      `
  );

  return response;
}

module.exports = {
  getReports,
  getReportsById,
  deleteReport,
  createReportEndorsement,
  createReport,
};
