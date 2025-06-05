import axios from 'axios';

// 로컬 Node.js 서버로 연결 (Android 에뮬레이터에서는 10.0.2.2 사용)
const BASE_URL = 'http://10.0.2.2:3000/api';

console.log('🔧 [API] API 클라이언트 초기화');
console.log('🔧 [API] BASE_URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
  config => {
    console.log('📤 [API REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data ? JSON.stringify(config.data).substring(0, 200) + '...' : 'no data'
    });
    return config;
  },
  error => {
    console.error('❌ [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
  response => {
    console.log('📥 [API RESPONSE SUCCESS]', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data ? JSON.stringify(response.data).substring(0, 200) + '...' : 'no data'
    });
    return response;
  },
  error => {
    console.error('❌ [API RESPONSE ERROR]', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// 면접 관련 API 함수들
export const interviewAPI = {
  // 면접 영상 업로드용 Pre-Signed URL 생성
  getPresignedUrl: async (fileName: string, fileType: string) => {
    try {
      console.log('🔄 [PRESIGNED_URL] 요청 시작', { fileName, fileType });
      const response = await api.post('/upload/presigned-url', {
        fileName,
        fileType
      });
      console.log('✅ [PRESIGNED_URL] 성공', response.data);
      return {
        uploadUrl: response.data.presignedUrl,
        s3Key: response.data.s3Key,
        bucket: response.data.bucket
      };
    } catch (error) {
      console.error('💥 [PRESIGNED_URL] 실패:', error);
      throw error;
    }
  },

  // 면접 분석 시작 (백엔드 구조에 맞게 수정)
  startAnalysis: async (s3Key: string, bucket?: string) => {
    try {
      console.log('🔄 [START_ANALYSIS] 요청 시작', { s3Key, bucket });
      const response = await api.post('/analysis/start', {
        s3Key,
        bucket
      });
      console.log('✅ [START_ANALYSIS] 성공', response.data);
      return {
        jobId: response.data.analysisJobs, // 복합 작업 ID들 반환
        s3Key: response.data.s3Key,
        bucket: response.data.bucket
      };
    } catch (error) {
      console.error('💥 [START_ANALYSIS] 실패:', error);
      throw error;
    }
  },

  // 분석 상태 확인 (개별 작업별로)
  getAnalysisStatus: async (jobType: string, jobId: string) => {
    try {
      console.log('🔄 [ANALYSIS_STATUS] 요청 시작', { jobType, jobId });
      const response = await api.get(`/analysis/status/${jobType}/${jobId}`);
      console.log('✅ [ANALYSIS_STATUS] 성공', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 [ANALYSIS_STATUS] 실패:', error);
      throw error;
    }
  },

  // 모든 분석 작업 상태 일괄 확인
  getAllAnalysisStatus: async (jobs: any) => {
    try {
      console.log('🔄 [ALL_ANALYSIS_STATUS] 요청 시작', { jobs });
      const response = await api.post('/analysis/status-all', { jobs });
      console.log('✅ [ALL_ANALYSIS_STATUS] 성공', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 [ALL_ANALYSIS_STATUS] 실패:', error);
      throw error;
    }
  },

  // 분석 결과 요약 생성
  getAnalysisResult: async (jobs: any) => {
    try {
      console.log('🔄 [ANALYSIS_RESULT] 요청 시작', { jobs });
      const response = await api.post('/analysis/summary', { jobs });
      console.log('✅ [ANALYSIS_RESULT] 성공', response.data);
      return response.data.summary;
    } catch (error) {
      console.error('💥 [ANALYSIS_RESULT] 실패:', error);
      throw error;
    }
  },

  // 업로드 상태 확인
  getUploadStatus: async (s3Key: string) => {
    try {
      console.log('🔄 [UPLOAD_STATUS] 요청 시작', { s3Key });
      const response = await api.get(`/upload/status/${encodeURIComponent(s3Key)}`);
      console.log('✅ [UPLOAD_STATUS] 성공', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 [UPLOAD_STATUS] 실패:', error);
      throw error;
    }
  },

  // 서버 상태 확인
  healthCheck: async () => {
    try {
      console.log('🔄 [HEALTH_CHECK] 요청 시작');
      const response = await axios.get('http://10.0.2.2:3000/health');
      console.log('✅ [HEALTH_CHECK] 성공', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 [HEALTH_CHECK] 실패:', error);
      throw error;
    }
  },

  // 파일 업로드
  uploadFile: async (file: any, presignedUrl: string) => {
    try {
      console.log('🔄 [FILE_UPLOAD] S3 업로드 시작', { 
        fileSize: file.size || 'unknown',
        fileType: file.type || 'unknown',
        presignedUrl: presignedUrl.substring(0, 50) + '...'
      });
      
      const response = await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type || 'video/webm'
        },
        timeout: 60000 // 1분 타임아웃
      });
      
      console.log('✅ [FILE_UPLOAD] S3 업로드 성공', {
        status: response.status,
        statusText: response.statusText
      });
      return response;
    } catch (error) {
      console.error('💥 [FILE_UPLOAD] S3 업로드 실패:', error);
      throw error;
    }
  }
}; 