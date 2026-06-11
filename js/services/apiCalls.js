// Web address to the local Node JS server
const serverAddress = "http://192.168.28.132:3000";

// endpoint on the Node JS backend server
const endpoints = {
  // simple updates
  updateArrivalConfirmation: { url: (id) => `/edit/arrconfirm/${id}`, method: 'POST' },
  updateOrderTimeRemark: { url: (id) => `/edit/order_time_remark/${id}`, method: 'POST' },
  updateProductionId: { url: (id) => `/edit/production_id/${id}`, method: 'POST' },
  updateArrival: { url: (id) => `/edit/arrival/${id}`, method: 'POST' },
  updateDeparture: { url: (id) => `/edit/departure/${id}`, method: 'POST' },
  updateDeliveryNo: { url: (id) => `/edit/delivery_no/${id}`, method: 'POST' },
  // simple calls
  getProductionDetail: { url: (id) => `/production_sheet?id=${id}`, method: 'GET' },
};

export async function callApi(name, { params, body } = {}) {
  const endpoint = endpoints[name];

  if (!endpoint) {
    throw new Error(`Unknown API endpoint: ${name}`);
  }

  const url =
    typeof endpoint.url === 'function'
      ? endpoint.url(params)
      : endpoint.url;

  try {

    let response = null;

    if (endpoint.method === "GET") {
      response = await fetch(`${serverAddress}${url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      response = await fetch(`${serverAddress}${url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
    }


    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}