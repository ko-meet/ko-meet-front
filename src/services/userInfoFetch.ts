import axios from 'axios'
import { refreshAccessToken } from '@/services/auth.ts'

// API 기본 URL 설정
axios.defaults.baseURL = import.meta.env.VITE_APP_API_URL

// 사용자 정보 요청 함수
export const getUserInfo = async (latitude: number, longitude: number): Promise<any> => {
  // 액세스 토큰 확인
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) {
    // 액세스 토큰 미존재 시 에러 반환
    return { status: 401, error: 'No access token' }
  }

  try {
    // 요청 구성
    const config = {
      method: 'get',
      url: `/auth/user?latitude=${latitude}&longitude=${longitude}`,
      headers: {
        contentType: 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    }

    // API 요청 및 응답 반환
    const response = await axios(config)
    return { status: response.status, data: response.data }
  } catch (error: unknown) {
    // 에러 처리
    console.error('Error:', error)
    if ((error as any).response && [401, 403].includes((error as any).response.status)) {
      // 토큰 갱신 시도
      const refreshResult = await refreshAccessToken()
      if (refreshResult && refreshResult.status === 200) {
        // 재시도
        return getUserInfo(latitude, longitude)
      } else {
        return { status: 401, error: 'Unauthorized' }
      }
    } else {
      localStorage.removeItem('accessToken')
    }
    // 기타 에러 반환
    return {
      status: error,
      error: 'Error fetching user info'
    }
  }
}
