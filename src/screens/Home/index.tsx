import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants';
import Button from '../../components/common/Button';
import { useSchedules } from '../../contexts/ScheduleContext';
import { interviewAPI } from '../../api';

const HomeScreen = () => {
  const { schedules } = useSchedules();
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const upcomingSchedules = schedules
    .filter(schedule => schedule.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setServerStatus('loading');
    try {
      console.log('🔄 서버 연결 상태 확인 중...');
      const response = await interviewAPI.healthCheck();
      console.log('✅ 서버 응답:', response);
      setServerStatus('connected');
      setLastCheckTime(new Date().toLocaleTimeString());
      console.log('🎉 서버 연결 성공!');
    } catch (error) {
      console.error('❌ 서버 연결 실패:', error);
      setServerStatus('disconnected');
      setLastCheckTime(new Date().toLocaleTimeString());
    }
  };

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'connected': return '서버 연결됨';
      case 'disconnected': return '서버 연결 실패';
      default: return '연결 확인 중...';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요!</Text>
        <Text style={styles.subtitle}>오늘도 승무원의 꿈을 향해</Text>
      </View>
      
      {/* 서버 연결 상태 */}
      <View style={styles.serverStatusContainer}>
        <View style={styles.serverStatusCard}>
          <View style={styles.serverStatusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getServerStatusColor() }]} />
            <Text style={styles.serverStatusTitle}>서버 연결 상태</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={checkServerConnection}
            >
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.serverStatusText}>{getServerStatusText()}</Text>
          {lastCheckTime && (
            <Text style={styles.lastCheckText}>마지막 확인: {lastCheckTime}</Text>
          )}
          <Text style={styles.serverUrl}>API: http://10.0.2.2:3000</Text>
        </View>
      </View>
      
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>승무원 이미지</Text>
        </View>
      </View>

      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>다가오는 일정</Text>
        {upcomingSchedules.length > 0 ? (
          upcomingSchedules.map(schedule => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <Text style={styles.scheduleDate}>{schedule.date}</Text>
              <Text style={styles.scheduleItemTitle}>{schedule.title}</Text>
              {schedule.description && (
                <Text style={styles.scheduleDescription} numberOfLines={2}>
                  {schedule.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
            <Text style={styles.emptySubText}>일정 관리 탭에서 일정을 추가해보세요!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.8,
  },
  serverStatusContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  serverStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serverStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  serverStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  serverStatusText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  lastCheckText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  serverUrl: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  scheduleContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  scheduleItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  scheduleDate: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 5,
  },
  scheduleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: COLORS.text,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptySchedule: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen; 