import axios from 'axios';

// 로컬 Node.js 서버로 연결 (Android 에뮬레이터에서는 10.0.2.2 사용)
const BASE_URL = 'http://10.0.2.2:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 처리 인터셉터 추가
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 면접 관련 API 함수들
export const interviewAPI = {
  // 면접 영상 업로드용 Pre-Signed URL 생성
  getPresignedUrl: async (fileName: string, fileType: string) => {
    try {
      const response = await api.post('/upload/presigned-url', {
        fileName,
        fileType
      });
      return response.data;
    } catch (error) {
      console.error('Pre-signed URL 생성 실패:', error);
      throw error;
    }
  },

  // 면접 분석 시작
  startAnalysis: async (s3Key: string, bucket?: string) => {
    try {
      const response = await api.post('/analysis/start', {
        s3Key,
        bucket
      });
      return response.data;
    } catch (error) {
      console.error('면접 분석 시작 실패:', error);
      throw error;
    }
  },

  // 분석 상태 확인
  getAnalysisStatus: async (jobId: string) => {
    try {
      const response = await api.get(`/analysis/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('분석 상태 확인 실패:', error);
      throw error;
    }
  },

  // 분석 결과 조회
  getAnalysisResult: async (jobId: string) => {
    try {
      const response = await api.get(`/analysis/result/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('분석 결과 조회 실패:', error);
      throw error;
    }
  },

  // 서버 상태 확인
  healthCheck: async () => {
    try {
      const response = await axios.get('http://10.0.2.2:3000/health');
      return response.data;
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      throw error;
    }
  }
}; 