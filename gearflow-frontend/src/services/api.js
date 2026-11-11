import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true, withXSRFToken: true });
api.defaults.xsrfCookieName = "XSRF-TOKEN";
api.defaults.xsrfHeaderName = "X-XSRF-TOKEN";

export default api;
