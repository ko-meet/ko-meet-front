import axios from 'axios';

export default function useAxios() {
	axios.defaults.baseURL = import.meta.env.VITE_APP_API_URL;

	const sendRequest = async (method, url, headers = {}, data = {}) => {
		try {
			const config = {
				method,
				url,
				...headers,
				...(method.toLowerCase() === 'get' || method.toLowerCase() === 'delete'
					? { params: data }
					: { data }),
			};

			const response = await axios(config);
			if (response.status === 401) {
				await refreshAccessToken();
				config.headers.Authorization = `Bearer ${
					localStorage.getItem('accessToken') || ''
				}`;
				return sendRequest(method, url, headers, data); // 재요청
			}

			return { status: response.status, data: response.data };
		} catch (error) {
			if (error.response && error.response.status === 401) {
				// 401 Unauthorized 처리
				await refreshAccessToken();
				return sendRequest(method, url, headers, data); // 재요청
			}

			return {
				status: error.response?.status || 500,
				error: error.response?.data || 'Internal Server Error',
			};
		}
	};

	const refreshAccessToken = async () => {
		const refreshToken = localStorage.getItem('refreshToken');
		if (!refreshToken) {
			return;
		}
		try {
			const refreshResponse = await axios.get(
				'/auth/refresh?token=' + refreshToken,
				null,
				{
					headers: { 'Content-Type': 'application/json' },
				},
			);

			if (refreshResponse.status === 200) {
				localStorage.setItem(
					'accessToken',
					refreshResponse.data.data.accessToken,
				);
				localStorage.setItem(
					'refreshToken',
					refreshResponse.data.data.refreshToken,
				);
			} else {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			}
		} catch (error) {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
		}
	};

	return {
		sendRequest,
		refreshAccessToken,
	};
}
