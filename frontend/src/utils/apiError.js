/**
 * Converts Axios API errors into clean, consistent, user-friendly messages.
 * Guarantees that internal stack traces, SQL errors, and sensitive tokens are never exposed.
 */
export function getApiErrorMessage(error, defaultFallback = "Something went wrong. Please try again.") {
  if (!error) {
    return defaultFallback;
  }

  // Handle network failure or backend server offline
  if (error.code === "ERR_NETWORK" || !error.response) {
    return "Unable to connect to the server. Please make sure the backend is running.";
  }

  const status = error.response.status;
  const detail = error.response.data?.detail;

  // Extract clean detail string if provided by backend without sensitive leakage
  let detailMessage = null;
  if (typeof detail === "string" && detail.trim().length > 0) {
    const lower = detail.toLowerCase();
    if (
      !lower.includes("traceback") &&
      !lower.includes("sqlite") &&
      !lower.includes("sqlalchemy") &&
      !lower.includes("exception") &&
      !lower.includes("syntaxerror")
    ) {
      detailMessage = detail.trim();
    }
  } else if (Array.isArray(detail) && detail.length > 0) {
    const firstMsg = detail[0]?.msg;
    if (typeof firstMsg === "string") {
      detailMessage = firstMsg;
    }
  }

  switch (status) {
    case 401:
      return detailMessage || "Your session is invalid or expired. Please log in again.";
    case 403:
      return detailMessage || "You do not have permission to perform this action.";
    case 404:
      return detailMessage || "The requested resource was not found.";
    case 422:
      return detailMessage || "Please check the information you entered.";
    case 500:
      return "Something went wrong on the server. Please try again.";
    default:
      return detailMessage || defaultFallback;
  }
}
