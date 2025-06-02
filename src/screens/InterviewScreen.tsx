import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { interviewAPI } from '../api';

interface InterviewResult {
  jobId: string;
  sttJobId?: string;
  rekognitionJobId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  analysisResults?: any;
}

const InterviewScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      const microphonePermission = await Camera.getMicrophonePermissionStatus();
      
      if (cameraPermission !== 'granted' || microphonePermission !== 'granted') {
        const newCameraPermission = await Camera.requestCameraPermission();
        const newMicrophonePermission = await Camera.requestMicrophonePermission();
        
        setHasPermission(
          newCameraPermission === 'granted' && newMicrophonePermission === 'granted'
        );
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error('권한 확인 실패:', error);
      Alert.alert('오류', '카메라 권한을 확인할 수 없습니다.');
    }
  };

  const startInterview = async () => {
    if (!hasPermission || !cameraRef.current) {
      Alert.alert('오류', '카메라 권한이 없거나 카메라를 사용할 수 없습니다.');
      return;
    }

    try {
      setIsRecording(true);
      
      // 영상 녹화 시작
      await cameraRef.current.startRecording({
        fileType: 'mp4',
        onRecordingFinished: async (video) => {
          await handleRecordingFinished(video);
        },
        onRecordingError: (error) => {
          console.error('녹화 오류:', error);
          Alert.alert('오류', '녹화 중 오류가 발생했습니다.');
          setIsRecording(false);
        },
      });

      console.log('✅ 면접 녹화 시작');
      Alert.alert('알림', '면접이 시작되었습니다. 자연스럽게 답변해주세요.');
      
    } catch (error) {
      console.error('면접 시작 실패:', error);
      Alert.alert('오류', '면접을 시작할 수 없습니다.');
      setIsRecording(false);
    }
  };

  const stopInterview = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      console.log('✅ 면접 녹화 종료');
    } catch (error) {
      console.error('녹화 종료 실패:', error);
      Alert.alert('오류', '녹화 종료 중 오류가 발생했습니다.');
    }
  };

  const handleRecordingFinished = async (video: any) => {
    setIsLoading(true);
    
    try {
      console.log('📹 녹화 완료:', video.path);
      
      // 1. Pre-signed URL 생성
      const fileName = `interview-${Date.now()}.mp4`;
      const preSignedResponse = await interviewAPI.getPresignedUrl(fileName, 'video/mp4');
      
      console.log('🔗 Pre-signed URL 생성 완료:', preSignedResponse.s3Key);

      // 2. S3에 영상 업로드
      const uploadResponse = await fetch(preSignedResponse.presignedUrl, {
        method: 'PUT',
        body: await fetch(video.path).then(res => res.blob()),
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 업로드 실패');
      }

      console.log('☁️ S3 업로드 완료');

      // 3. 분석 시작
      const analysisResponse = await interviewAPI.startAnalysis(
        preSignedResponse.s3Key,
        preSignedResponse.bucket
      );

      console.log('🧠 분석 시작:', analysisResponse);

      setInterviewResult({
        jobId: analysisResponse.jobId || `analysis-${Date.now()}`,
        sttJobId: analysisResponse.stt?.jobId,
        rekognitionJobId: analysisResponse.rekognition?.jobId,
        status: 'IN_PROGRESS',
      });

      Alert.alert(
        '업로드 완료', 
        '면접 영상이 업로드되었습니다. 분석이 진행중입니다.',
        [
          {
            text: '결과 확인',
            onPress: () => setShowResults(true)
          }
        ]
      );

    } catch (error) {
      console.error('💥 면접 처리 실패:', error);
      Alert.alert('오류', '면접 영상 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnalysisStatus = async () => {
    if (!interviewResult?.jobId) return;

    try {
      const statusResponse = await interviewAPI.getAnalysisStatus(interviewResult.jobId);
      
      setInterviewResult(prev => prev ? {
        ...prev,
        status: statusResponse.status,
        analysisResults: statusResponse.results
      } : null);

      if (statusResponse.status === 'COMPLETED') {
        Alert.alert('완료', '면접 분석이 완료되었습니다!');
      }
    } catch (error) {
      console.error('분석 상태 확인 실패:', error);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={!showResults}
        video={true}
        audio={true}
      />
      
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startInterview}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '처리중...' : '면접 시작'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopInterview}
          >
            <Text style={styles.buttonText}>면접 종료</Text>
          </TouchableOpacity>
        )}

        {interviewResult && (
          <TouchableOpacity 
            style={[styles.button, styles.statusButton]}
            onPress={() => setShowResults(true)}
          >
            <Text style={styles.buttonText}>결과 확인</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>업로드 및 분석 준비중...</Text>
        </View>
      )}

      <Modal visible={showResults} animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.modalTitle}>면접 분석 결과</Text>
            
            {interviewResult && (
              <>
                <Text style={styles.resultText}>
                  상태: {interviewResult.status}
                </Text>
                <Text style={styles.resultText}>
                  Job ID: {interviewResult.jobId}
                </Text>
                
                {interviewResult.status === 'IN_PROGRESS' && (
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={checkAnalysisStatus}
                  >
                    <Text style={styles.buttonText}>상태 새로고침</Text>
                  </TouchableOpacity>
                )}

                {interviewResult.analysisResults && (
                  <View style={styles.analysisResults}>
                    <Text style={styles.resultTitle}>분석 상세 결과:</Text>
                    <Text style={styles.resultText}>
                      {JSON.stringify(interviewResult.analysisResults, null, 2)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowResults(false)}
          >
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 15,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  statusButton: {
    backgroundColor: '#2196F3',
  },
  refreshButton: {
    backgroundColor: '#FF9800',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  analysisResults: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
});

export default InterviewScreen; 