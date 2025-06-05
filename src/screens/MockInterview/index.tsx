import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../../constants';
import Button from '../../components/common/Button';
import { api, interviewAPI } from '../../api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { MockInterviewScreenNavigationProp } from '../../types/navigation';
import { BaseAirline, getRandomQuestion, AIRLINES } from '../../models/Airline';
import { useInterviews } from '../../contexts/InterviewContext';
import { useUser } from '../../contexts/UserContext';
import { getRandomFeedback, FeedbackDetail, DetailedScore } from '../../models/InterviewFeedback';

// 웹 전용 임포트 (조건부)
let useRecorder: any = null;
let PRESIGNED_PUT_URL: string = '';

if (Platform.OS === 'web') {
  try {
    const webModules = require('../../hooks/useRecorder');
    useRecorder = webModules.useRecorder;
    const constants = require('../../constants');
    PRESIGNED_PUT_URL = constants.PRESIGNED_PUT_URL;
  } catch (e) {
    console.warn('웹 모듈 로드 실패:', e);
  }
}

interface InterviewReport {
  id: string;
  date: string;
  airline: string;
  username: string;
  score: number;
  feedback: string;
  duration: number;
  improvements: string[];
  grade: string;
  detailedScores: DetailedScore;
  voiceAnalysis: string;
  expressionAnalysis: string;
  speechAnalysis: string;
  answerAnalysis: string;
  detailedFeedback: {
    voiceAccuracyDetail: string;
    expressionDetail: string;
    speechPatternDetail: string;
    answerQualityDetail: string;
  };
  recommendedActions: string[];
}

const MockInterviewScreen = () => {
  const navigation = useNavigation<MockInterviewScreenNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<BaseAirline | null>(null);
  const [showAirlineSelection, setShowAirlineSelection] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const { feedbacks, setFeedbacks } = useInterviews();
  const { username } = useUser();
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackDetail | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);

  // 웹 환경에서만 녹화 훅 사용
  const webRecorder = Platform.OS === 'web' && useRecorder ? useRecorder() : null;

  useEffect(() => {
    checkCameraAvailability();
    console.log('🎬 [MockInterview] 화면 초기화');
  }, []);

  // 화면이 포커스를 받을 때마다 상태 초기화
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎬 [MockInterview] 화면 포커스, 상태 초기화');
      resetInterviewState();
    }, [])
  );

  const checkCameraAvailability = async () => {
    console.log('🎬 [MockInterview] 카메라 가용성 확인 시작');
    if (Platform.OS === 'web') {
      try {
        // 웹 환경에서만 navigator 접근
        const globalThis = global as any;
        if (globalThis.navigator && globalThis.navigator.mediaDevices) {
          const devices = await globalThis.navigator.mediaDevices.enumerateDevices();
          const hasVideoDevice = devices.some((device: any) => device.kind === 'videoinput');
          console.log('🎬 [MockInterview] 웹 카메라 확인:', { hasVideoDevice, devices: devices.length });
          setHasCamera(hasVideoDevice);
        } else {
          console.warn('💥 [MockInterview] 웹 환경이지만 mediaDevices API 미지원');
          setHasCamera(false);
        }
      } catch (err) {
        console.warn('💥 [MockInterview] 카메라 확인 실패:', err);
        setHasCamera(false);
      }
    } else if (Platform.OS === 'android') {
      console.log('🎬 [MockInterview] 안드로이드 카메라 권한 확인');
      if (!permission?.granted) {
        console.log('🎬 [MockInterview] 카메라 권한 요청');
        await requestPermission();
      }
    }
  };

  // 타이머 시작 함수
  const startTimer = () => {
    console.log('⏱️ [MockInterview] 타이머 시작');
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // 타이머 정지 함수
  const stopTimer = () => {
    console.log('⏱️ [MockInterview] 타이머 정지');
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // 타이머 포맷 함수
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 실제 면접 처리 함수 (백엔드 연동)
  const processInterviewWithBackend = async (videoFile: any) => {
    try {
      console.log('🎬 [MockInterview] 백엔드 면접 처리 시작');
      setUploadProgress('Pre-signed URL 생성 중...');
      
      // 1. Pre-signed URL 요청
      const fileName = `interview_${Date.now()}_${username}.webm`;
      const presignedData = await interviewAPI.getPresignedUrl(fileName, 'video/webm');
      
      console.log('✅ [MockInterview] Pre-signed URL 생성 성공');
      console.log('✅ [MockInterview] S3 키:', presignedData.s3Key);
      console.log('✅ [MockInterview] 버킷:', presignedData.bucket);
      setUploadProgress('S3에 비디오 업로드 중...');
      
      // 2. S3에 파일 업로드
      await interviewAPI.uploadFile(videoFile, presignedData.uploadUrl);
      
      console.log('✅ [MockInterview] S3 업로드 성공');
      setUploadProgress('업로드 완료, 분석 시작 중...');
      
      // 3. 업로드 상태 확인
      const uploadStatus = await interviewAPI.getUploadStatus(presignedData.s3Key);
      console.log('✅ [MockInterview] 업로드 상태 확인:', uploadStatus);
      
      if (!uploadStatus.exists) {
        throw new Error('파일 업로드가 완료되지 않았습니다');
      }
      
      setUploadProgress('면접 분석 시작 중...');
      
      // 4. 분석 시작
      const analysisResponse = await interviewAPI.startAnalysis(presignedData.s3Key, presignedData.bucket);
      const analysisJobs = analysisResponse.jobId; // 실제로는 복합 작업 ID들
      
      console.log('✅ [MockInterview] 분석 시작 성공:', analysisJobs);
      setUploadProgress('분석 중...');
      
      // 5. 분석 상태 폴링
      const pollAnalysis = async () => {
        try {
          console.log('🔄 [MockInterview] 분석 상태 확인 시작');
          
          // 모든 분석 작업 상태 확인
          const statusResponse = await interviewAPI.getAllAnalysisStatus(analysisJobs);
          console.log('🔄 [MockInterview] 모든 분석 상태:', statusResponse.results);
          
          const { stt, face, segment } = statusResponse.results;
          
          // 모든 작업이 완료되었는지 확인
          const allCompleted = 
            stt?.status === 'COMPLETED' && 
            face?.status === 'SUCCEEDED' && 
            segment?.status === 'SUCCEEDED';
          
          const anyFailed = 
            stt?.status === 'FAILED' || 
            face?.status === 'FAILED' || 
            segment?.status === 'FAILED';
          
          if (allCompleted) {
            console.log('✅ [MockInterview] 모든 분석 완료, 결과 생성 중...');
            setUploadProgress('분석 완료, 결과 생성 중...');
            
            // 6. 분석 결과 요약 생성
            const resultResponse = await interviewAPI.getAnalysisResult(analysisJobs);
            console.log('✅ [MockInterview] 분석 결과 수신:', resultResponse);
            
            // 백엔드 결과를 FeedbackDetail 형태로 변환
            const backendFeedback: FeedbackDetail = {
              candidateName: username,
              airline: selectedAirline?.name || '항공사',
              position: '승무원',
              interviewDate: new Date().toLocaleDateString('ko-KR'),
              version: 'v2.0',
              totalScore: resultResponse.overall_score || 85,
              grade: getGradeFromScore(resultResponse.overall_score || 85),
              overallEvaluation: generateOverallEvaluation(resultResponse),
              detailedScores: {
                voiceAccuracy: resultResponse.speech_analysis?.clarity || 88,
                expression: resultResponse.facial_analysis?.confidence || 82,
                speechPattern: resultResponse.speech_analysis?.pace || 85,
                answerQuality: resultResponse.speech_analysis?.volume || 87
              },
              voiceAnalysis: `음성 명확도: ${resultResponse.speech_analysis?.clarity || 88}점`,
              expressionAnalysis: `표정 자신감: ${resultResponse.facial_analysis?.confidence || 82}점`,
              speechAnalysis: `말하기 속도: ${resultResponse.speech_analysis?.pace || 85}점`,
              answerAnalysis: `답변 품질: ${resultResponse.speech_analysis?.volume || 87}점`,
              detailedFeedback: {
                voiceAccuracyDetail: '발음과 억양이 자연스럽고 청취하기 용이합니다.',
                expressionDetail: '표정이 밝고 긍정적이며 면접관과의 소통 의지가 잘 드러납니다.',
                speechPatternDetail: '말의 속도와 강약이 적절하며 듣기 편안합니다.',
                answerQualityDetail: '질문의 핵심을 파악하고 체계적으로 답변했습니다.'
              },
              improvements: resultResponse.recommendations || [
                '좀 더 자신감 있는 목소리 톤 연습',
                '구체적인 사례 제시',
                '간결한 답변 구성'
              ],
              recommendedActions: resultResponse.recommendations || [
                '발성 연습을 통한 목소리 개선',
                '모의면접 반복 연습',
                '업계 지식 보완'
              ]
            };
            
            console.log('🎉 [MockInterview] 면접 분석 완료!');
            setCurrentFeedback(backendFeedback);
            setIsAnalyzing(false);
            setUploadProgress('');
            
          } else if (anyFailed) {
            console.error('💥 [MockInterview] 일부 분석 작업 실패');
            throw new Error('분석 작업 중 일부가 실패했습니다');
          } else {
            // 아직 처리 중이면 5초 후 재시도
            console.log('⏳ [MockInterview] 분석 진행 중, 5초 후 재확인');
            setUploadProgress(`분석 중... (STT: ${stt?.status}, Face: ${face?.status}, Segment: ${segment?.status})`);
            setTimeout(pollAnalysis, 5000);
          }
        } catch (error) {
          console.error('💥 [MockInterview] 분석 상태 확인 실패:', error);
          throw error;
        }
      };
      
      // 폴링 시작 (2초 후)
      setTimeout(pollAnalysis, 2000);
      
    } catch (error) {
      console.error('💥 [MockInterview] 백엔드 처리 실패:', error);
      setIsAnalyzing(false);
      setUploadProgress('');
      Alert.alert('오류', `면접 분석 중 오류가 발생했습니다: ${error.message}`);
      
      // 실패 시 더미 데이터로 대체
      const feedback = getRandomFeedback(selectedAirline?.name || '', username);
      setCurrentFeedback(feedback);
    }
  };

  // 점수에 따른 등급 계산
  const getGradeFromScore = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    return 'D';
  };

  // 종합 평가 생성
  const generateOverallEvaluation = (results: any): string => {
    const score = results.overall_score || 85;
    if (score >= 90) {
      return '매우 우수한 면접 성과를 보였습니다. 자신감 있는 태도와 명확한 의사소통이 인상적입니다.';
    } else if (score >= 80) {
      return '전반적으로 양호한 면접 성과를 보였습니다. 몇 가지 개선점을 보완하면 더 좋은 결과를 기대할 수 있습니다.';
    } else if (score >= 70) {
      return '기본적인 면접 역량을 갖추고 있으나, 추가적인 준비와 연습이 필요합니다.';
    } else {
      return '면접 기본기를 더 연습하시고 체계적인 준비가 필요합니다.';
    }
  };

  const handleInterviewToggle = async () => {
    if (!isInterviewing) {
      console.log('🎬 [MockInterview] 면접 시작');
      setIsInterviewing(true);
      // 웹에서 녹화 시작
      if (Platform.OS === 'web' && webRecorder) {
        console.log('🎬 [MockInterview] 웹 녹화 시작');
        await webRecorder.start();
      }
    } else {
      console.log('🎬 [MockInterview] 면접 종료 및 분석 시작');
      stopTimer();
      setIsInterviewing(false);
      setIsAnalyzing(true);
      setUploadProgress('녹화 완료, 처리 중...');
      
      // 웹에서 녹화 중단 및 업로드
      if (Platform.OS === 'web' && webRecorder) {
        console.log('🎬 [MockInterview] 웹 녹화 중단 및 처리');
        const recordedBlob = await webRecorder.stop();
        
        if (recordedBlob) {
          console.log('🎬 [MockInterview] 녹화된 비디오 처리 시작:', {
            size: recordedBlob.size,
            type: recordedBlob.type
          });
          
          // 실제 백엔드 처리
          await processInterviewWithBackend(recordedBlob);
        } else {
          console.warn('⚠️ [MockInterview] 녹화된 비디오가 없음, 더미 데이터 사용');
          // 녹화 실패 시 더미 데이터로 대체
          setTimeout(() => {
            const feedback = getRandomFeedback(selectedAirline?.name || '', username);
            setCurrentFeedback(feedback);
            setIsAnalyzing(false);
          }, 3000);
        }
      } else {
        console.log('🎬 [MockInterview] 네이티브 환경 또는 녹화 기능 없음, 더미 데이터 사용');
        // 네이티브 환경에서는 일단 더미로 처리
        setTimeout(() => {
          const feedback = getRandomFeedback(selectedAirline?.name || '', username);
          setCurrentFeedback(feedback);
          setIsAnalyzing(false);
        }, 3000);
      }
    }
  };

  const handleSaveReport = async () => {
    if (currentFeedback) {
      const report: InterviewReport = {
        id: Date.now().toString(),
        date: currentFeedback.interviewDate,
        airline: currentFeedback.airline,
        username: currentFeedback.candidateName,
        score: currentFeedback.totalScore,
        feedback: currentFeedback.overallEvaluation,
        duration: timer,
        improvements: currentFeedback.improvements,
        grade: currentFeedback.grade,
        detailedScores: currentFeedback.detailedScores,
        voiceAnalysis: currentFeedback.voiceAnalysis,
        expressionAnalysis: currentFeedback.expressionAnalysis,
        speechAnalysis: currentFeedback.speechAnalysis,
        answerAnalysis: currentFeedback.answerAnalysis,
        detailedFeedback: currentFeedback.detailedFeedback,
        recommendedActions: currentFeedback.recommendedActions
      };
      
      setFeedbacks(prev => [...prev, report]);
      setIsSaved(true);
    }
  };

  const handleStartInterview = () => {
    setShowAirlineSelection(true);
  };

  const handleAirlineSelect = (airline: BaseAirline) => {
    setSelectedAirline(airline);
    setShowAirlineSelection(false);
    setIsInterviewing(true);
    setTimer(0);
    startTimer();
    const randomQuestion = airline.questions[Math.floor(Math.random() * airline.questions.length)];
    setCurrentQuestion(randomQuestion);
  };

  const resetInterviewState = () => {
    setIsInterviewing(false);
    setIsSaved(false);
    setIsAnalyzing(false);
    setShowAirlineSelection(false);
    setSelectedAirline(null);
    setCurrentFeedback(null);
    stopTimer();
    setTimer(0);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  if (isSaved) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>저장이 완료되었습니다!</Text>
        <Button 
          title="새로운 면접 시작하기" 
          onPress={() => {
            resetInterviewState();
            setShowAirlineSelection(true);
          }} 
        />
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>분석중입니다...</Text>
        {uploadProgress && (
          <Text style={styles.progressText}>{uploadProgress}</Text>
        )}
        {analysisJobId && (
          <Text style={styles.jobIdText}>분석 ID: {analysisJobId}</Text>
        )}
      </View>
    );
  }

  if (currentFeedback) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.reportContainer}>
          <Text style={styles.reportTitle}>면접 분석 리포트</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지원자 정보</Text>
            <Text style={styles.infoText}>이름: {currentFeedback.candidateName}</Text>
            <Text style={styles.infoText}>지원 항공사: {currentFeedback.airline}</Text>
            <Text style={styles.infoText}>지원 직무: {currentFeedback.position}</Text>
            <Text style={styles.infoText}>면접 일자: {currentFeedback.interviewDate}</Text>
            <Text style={styles.infoText}>평가 버전: {currentFeedback.version}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>면접 결과 요약</Text>
            <Text style={styles.scoreText}>총점: {currentFeedback.totalScore} / 100</Text>
            <Text style={styles.gradeText}>합격 예측 등급: {currentFeedback.grade}</Text>
            <Text style={styles.durationText}>총 면접 시간: {formatTime(timer)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>전반적인 평가</Text>
            <Text style={styles.sectionText}>{currentFeedback.overallEvaluation}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>세부 평가 결과</Text>
            <Text style={styles.subTitle}>음성 정확도 ({currentFeedback.detailedScores.voiceAccuracy}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.voiceAccuracyDetail}</Text>
            
            <Text style={styles.subTitle}>표정 분석 ({currentFeedback.detailedScores.expression}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.expressionDetail}</Text>
            
            <Text style={styles.subTitle}>말투 & 속도 ({currentFeedback.detailedScores.speechPattern}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.speechPatternDetail}</Text>
            
            <Text style={styles.subTitle}>답변 퀄리티 ({currentFeedback.detailedScores.answerQuality}점)</Text>
            <Text style={styles.sectionText}>{currentFeedback.detailedFeedback.answerQualityDetail}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>개선사항</Text>
            {currentFeedback.improvements.map((item, index) => (
              <Text key={index} style={styles.improvementItem}>• {item}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 조치사항</Text>
            {currentFeedback.recommendedActions.map((item, index) => (
              <Text key={index} style={styles.recommendationItem}>• {item}</Text>
            ))}
          </View>
        </ScrollView>

        <View style={styles.buttonGroup}>
          <Button 
            title="저장하기" 
            onPress={handleSaveReport} 
          />
          <View style={styles.buttonSpacing} />
          <Button 
            title="홈으로" 
            onPress={() => {
              resetInterviewState();
              navigation.navigate('Home');
            }} 
          />
        </View>
      </View>
    );
  }

  // 항공사 선택 화면
  if (showAirlineSelection) {
    return (
      <View style={styles.container}>
        <Text style={styles.selectionTitle}>항공사를 선택해주세요</Text>
        <ScrollView style={styles.airlineList}>
          {AIRLINES.map((airline) => (
            <TouchableOpacity
              key={airline.name}
              style={styles.airlineItem}
              onPress={() => handleAirlineSelect(airline)}
            >
              <Text style={styles.airlineName}>{airline.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // 면접 진행 화면
  if (isInterviewing && selectedAirline) {
    if (Platform.OS === 'web' && webRecorder) {
      // 웹 환경에서의 녹화 화면
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.timerContainer}>
              <Text style={styles.timer}>{formatTime(timer)}</Text>
            </View>
            <Text style={styles.selectedAirline}>
              {selectedAirline.name} 면접 진행 중 (녹화 중)
            </Text>
          </View>
          
          <View style={styles.webCameraContainer}>
            {webRecorder.stream && (
              <video
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '640px',
                  height: 'auto',
                  backgroundColor: '#000',
                  borderRadius: 8,
                  border: '2px solid #34C759'
                }}
                ref={(video) => {
                  if (video && webRecorder.stream) {
                    video.srcObject = webRecorder.stream;
                  }
                }}
              />
            )}
            
            {/* 녹화 상태 표시 */}
            <View style={styles.recordingStatus}>
              <Text style={styles.recordingText}>
                🔴 녹화 중 {webRecorder.isUploading && '- 업로드 중...'}
              </Text>
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion}</Text>
          </View>

          {/* 웹 로그 표시 - 전체 로그를 ScrollView로 */}
          <View style={styles.webLogContainer}>
            <Text style={styles.logTitle}>
              📋 면접 로그 {webRecorder.isAnalyzing && '(분석 중...)'}
            </Text>
            <ScrollView style={styles.logScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.logText}>
                {webRecorder.logs.join('\n')}
              </Text>
            </ScrollView>
          </View>

          {webRecorder.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {webRecorder.error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button 
              title={
                webRecorder.isUploading 
                  ? "업로드 중..." 
                  : webRecorder.isAnalyzing 
                    ? "분석 중..." 
                    : "종료하기"
              }
              onPress={handleInterviewToggle}
              disabled={webRecorder.isUploading || webRecorder.isAnalyzing}
            />
          </View>
        </View>
      );
    }
    
    // React Native 환경에서의 기존 카메라 화면
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatTime(timer)}</Text>
          </View>
          <Text style={styles.selectedAirline}>
            {selectedAirline.name} 면접 진행 중
          </Text>
        </View>
        
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={ref => setCamera(ref)}
            style={styles.camera} 
            facing="front"
          />
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title="종료하기"
            onPress={handleInterviewToggle} 
          />
        </View>
      </View>
    );
  }

  // 초기 화면
  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={ref => setCamera(ref)}
          style={styles.camera} 
          facing="front"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="모의 면접 시작하기"
          onPress={handleStartInterview} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  camera: {
    flex: 1,
    aspectRatio: 4/3,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  errorContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text,
  },
  reportContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 15,
  },
  gradeText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  durationText: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  successText: {
    fontSize: 20,
    color: 'green',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  buttonSpacing: {
    height: 10,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: COLORS.text,
  },
  airlineList: {
    width: '100%',
  },
  airlineItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  airlineName: {
    fontSize: 18,
    color: COLORS.text,
  },
  header: {
    width: '100%',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  selectedAirline: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  questionText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  improvementItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: COLORS.text,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 5,
  },
  recommendationItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: COLORS.text,
  },
  interviewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  webCameraContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingStatus: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  webLogContainer: {
    width: '100%',
    height: 200,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  logScrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.text,
    lineHeight: 16,
  },
  progressText: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text,
  },
  jobIdText: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text,
  },
});

export default MockInterviewScreen; 