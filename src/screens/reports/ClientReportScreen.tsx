import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PieChart } from 'react-native-chart-kit';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getClientReport } from '../../services/api/clientApi';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientReport'>;

type ReportData = {
  client_name: string;
  summary: string;
  recommendation: string;
  risk: {
    overall_risk: string;
    confidence?: number;
    case_count: number;
    civil_count: number;
    criminal_count: number;
    commercial_count: number;
    score?: number;
  };
};

const screenWidth = Dimensions.get('window').width;

const ClientReportScreen = ({ route }: Props) => {
  const { clientKey } = route.params;
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await getClientReport(clientKey);
      setReport(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;

    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 24px;">
            <h1>Client Risk Report</h1>
            <h2>${report.client_name}</h2>
            <p><strong>Summary:</strong> ${report.summary}</p>
            <p><strong>Recommendation:</strong> ${report.recommendation}</p>
            <hr />
            <p><strong>Overall Risk:</strong> ${report.risk.overall_risk}</p>
            <p><strong>Confidence:</strong> ${report.risk.confidence ?? 0}</p>
            <p><strong>Total Cases:</strong> ${report.risk.case_count}</p>
            <p><strong>Civil:</strong> ${report.risk.civil_count}</p>
            <p><strong>Criminal:</strong> ${report.risk.criminal_count}</p>
            <p><strong>Commercial:</strong> ${report.risk.commercial_count}</p>
            <p><strong>Risk Score:</strong> ${report.risk.score ?? 0}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF created successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      default:
        return '#16A34A';
    }
  };

  const getPieData = () => {
    if (!report) return [];

    return [
      {
        name: 'Civil',
        count: report.risk.civil_count,
        color: '#3B82F6',
        legendFontColor: '#334155',
        legendFontSize: 13,
      },
      {
        name: 'Criminal',
        count: report.risk.criminal_count,
        color: '#EF4444',
        legendFontColor: '#334155',
        legendFontSize: 13,
      },
      {
        name: 'Commercial',
        count: report.risk.commercial_count,
        color: '#10B981',
        legendFontColor: '#334155',
        legendFontSize: 13,
      },
    ].filter(item => item.count > 0);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loaderText}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Report not found</Text>
      </View>
    );
  }

  const riskScore = report.risk.score ?? 0;
  const progressWidth = `${Math.min(riskScore, 100)}%`;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>AI Generated Legal Report</Text>
        <Text style={styles.heroTitle}>{report.client_name}</Text>
        <Text style={styles.heroSubtitle}>
          Risk assessment summary and legal case overview
        </Text>
      </View>

      <View style={styles.riskCard}>
        <Text style={styles.sectionTitle}>Overall Risk</Text>
        <Text
          style={[
            styles.riskText,
            { color: getRiskColor(report.risk.overall_risk) },
          ]}
        >
          {report.risk.overall_risk} Risk
        </Text>

        <Text style={styles.progressLabel}>Risk Score: {riskScore}%</Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth as any,
                backgroundColor: getRiskColor(report.risk.overall_risk),
              },
            ]}
          />
        </View>

        <Text style={styles.detailText}>
          Confidence: {report.risk.confidence ?? 0}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{report.risk.case_count}</Text>
          <Text style={styles.statLabel}>Total Cases</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{report.risk.civil_count}</Text>
          <Text style={styles.statLabel}>Civil</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{report.risk.criminal_count}</Text>
          <Text style={styles.statLabel}>Criminal</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{report.risk.commercial_count}</Text>
          <Text style={styles.statLabel}>Commercial</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.bodyText}>{report.summary}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <Text style={styles.bodyText}>{report.recommendation}</Text>
      </View>

      <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
        <Text style={styles.exportButtonText}>Export PDF Report</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Case Type Distribution</Text>
        {getPieData().length > 0 ? (
          <PieChart
            data={getPieData()}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              color: () => '#000000',
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={styles.bodyText}>No case distribution data available</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detailed Statistics</Text>
        <Text style={styles.detailText}>Overall Risk: {report.risk.overall_risk}</Text>
        <Text style={styles.detailText}>Confidence: {report.risk.confidence ?? 0}</Text>
        <Text style={styles.detailText}>Total Past Cases: {report.risk.case_count}</Text>
        <Text style={styles.detailText}>Civil Cases: {report.risk.civil_count}</Text>
        <Text style={styles.detailText}>Criminal Cases: {report.risk.criminal_count}</Text>
        <Text style={styles.detailText}>Commercial Cases: {report.risk.commercial_count}</Text>
        <Text style={styles.detailText}>Risk Score: {report.risk.score ?? 0}</Text>
      </View>
    </ScrollView>
  );
};

export default ClientReportScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F5F9',
    padding: 18,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
  },
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BFDBFE',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 22,
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  riskText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 22,
  },
  exportButton: {
    backgroundColor: '#0F766E',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});