const { initializeApp } = require("firebase/app");
const {
	ref,
	getStorage,
	uploadString,
	getDownloadURL,
} = require("firebase/storage");
const headers = require("../utils/headers");
const firebaseConfig = require("../utils/firebaseConfig");

// Initialize Firebase
const app = initializeApp(firebaseConfig.config);

const storage = getStorage(app, firebaseConfig.firestoreURL);

exports.handler = async (event) => {
	const { fileName } = event.queryStringParameters;

	if (event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				data: null,
			}),
		};
	}

	if (!fileName) {
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				error: "fileName required",
				data: null,
				message: null,
			}),
		};
	}
	const file = event.body;

	if (event.httpMethod === "POST") {
		const storageRef = ref(storage, "hazard-report/" + fileName);

		await uploadString(storageRef, file, "base64");

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				error: null,
				data: {
					url: `${firebaseConfig.storagePublicURL}/${firebaseConfig.config.storageBucket}/${storageRef.fullPath}`,
				},
				message: null,
			}),
		};
	}

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({
			error: `${event.httpMethod} image endpoint to be implemented`,
			data: null,
			message: null,
		}),
	};
};
