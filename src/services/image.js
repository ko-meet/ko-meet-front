import axios from 'axios';

// API 기본 URL 설정
axios.defaults.baseURL = import.meta.env.VITE_APP_API_URL;
const token = localStorage.getItem('accessToken');

export const uploadImageApi = async (path, form) => {
	// 토큰 미제공 시 인증되지 않음 반환
	if (!token) {
		return { status: 'unauthenticated' };
	}
	try {
		// 요청 구성
		const config = createConfig('post', `/images?imagePath=${path}`, form);
		// API 요청 및 응답 상태 반환
		const response = await axios(config);
		return { status: response.status };
	} catch (error) {
		// 에러 발생 시 로그 기록 및 에러 상태 반환
		console.error(error);
		return { status: 'error', error };
	}
};

const createConfig = (method, url, data) => {
	return {
		method,
		url,
		headers: {
			'Content-Type': 'multipart/form-data',
			Authorization: `Bearer ${token}`,
		},
		data,
	};
};
