
import axios from "axios";
import { baseApiUrl  as baseUrl} from "../constant/common";
import { useNavigate } from "react-router-dom";
import Cookies from 'universal-cookie';
import useToast from "./useToast";

axios.defaults.headers["Access-Control-Allow-Origin"] = "*";

const useApi = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const { toastError } = useToast();

  const apiCall = async (
    method,
    path,
    data ,
    token = null,
    contentType = "application/json"
  ) => {
    try {
      const config = {
        method,
        url: `${baseUrl}${path}`,
        data: data == null ? {} : data,
        headers: {
          "Content-Type": contentType,
        },
      };

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios(config);

      if (
        response?.data &&
        !response.data.success &&
        response.data.message === "Your session has expired! please login again"
      ) {
        cookies.remove("auth-token");
        toastError("Your session has expired. Please login again");
        navigate("/login");
        return { success: false };
      }

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      console.log("Error response data:", error?.response?.data);

      // Check if the error response has a specific message from the backend
      const backendMessage = error?.response?.data?.message;
      
      return {
        success: false,
        message: backendMessage || "Error while processing your request please try again later",
        msg: backendMessage || "Error while processing your request please try again later",
        data: [],
        error: backendMessage || error.message,
      };
    }
  };

  return { apiCall };
};

export default useApi;
