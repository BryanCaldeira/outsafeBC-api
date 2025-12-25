const headers = require("../utils/headers");
const { getFlaggedReport, flagReport } = require("../sql/reports");
const { getCategoryOptionsById } = require("../sql/category-options");

const update = async (event) => {
	try {
		const { id } = event.queryStringParameters;

		const { user_id } = JSON.parse(event.body);

		const getFlaggedQuery = await getFlaggedReport(id, user_id);

		if (getFlaggedQuery.rowCount > 0) {
			return {
				statusCode: 500,
				headers,
				body: JSON.stringify({
					error: "You have already flagged to this report!",
					data: null,
					message: "",
				}),
			};
		}

		const queryResponse = await flagReport(id, user_id);

		if (!queryResponse.rowCount) {
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					error: null,
					data: null,
					message: "No hazard report found",
				}),
			};
		}

		const result = queryResponse.rows.map((report) => {
			return {
				id: report.id,
				location: {
					lat: Number(report.latitude),
					lng: Number(report.longitude),
					address: report.address ?? "",
				},
				hazardCategory: {
					// id: report.category_option_id,
					// name: report.category_name,
					//  "hasOptions":true
				},
				hazard: {
					id: report.category_option_id,
					// name: report.hazard_option_name,
				},
				comment: report.comments ?? "",
				created_at: report.created_at,
				updated_at: report.updated_at,
				deleted_at: report.deleted_at,
				still_there_count: report.still_there_count ?? 0,
				not_there_count: report.not_there_count ?? 0,
				flagged_count: report.flagged_count ?? 0,
				images: report.images,
				index: Number(report.index),
			};
		});

		const data = { ...result?.[0] };

		const hazardOptionQuery = await getCategoryOptionsById(data?.hazard?.id);

		if (hazardOptionQuery.rowCount > 0) {
			const hazardOption = hazardOptionQuery.rows[0];

			data.hazardCategory = {
				id: hazardOption.category_id,
				name: hazardOption.category_name,
			};

			data.hazard = {
				id: data?.hazard?.id,
				name: hazardOption.name,
			};
		}

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				error: null,
				data: data,
				message: "Thanks for keeping us updated!",
			}),
		};
	} catch (error) {
		console.log({ error });
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				error: error.message,
				data: error,
				message: null,
			}),
		};
	}
};

exports.handler = async (event) => {
	const { id } = event.queryStringParameters;

	if (event.httpMethod === "PUT" && !!id) {
		const response = await update(event);
		return response;
	}

	if (event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				data: null,
			}),
		};
	}

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({
			error: `${event.httpMethod} is not configured yet`,
			data: null,
			message: null,
		}),
	};
};
