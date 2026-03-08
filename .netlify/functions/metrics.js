let latestMetrics = null;

exports.handler = async (event) => {
  // Coordinator sends metrics here
  if (event.httpMethod === "POST") {
    try {
      latestMetrics = JSON.parse(event.body);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "metrics stored" }),
      };
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }
  }

  // Dashboard fetches latest metrics
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(latestMetrics || {}),
    };
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
  };
};
