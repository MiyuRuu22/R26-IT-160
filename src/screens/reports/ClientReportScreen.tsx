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

    const data = [];

    if (report.risk.civil_count > 0) {
      data.push({
        name: 'Civil',
        count: report.risk.civil_count,
        color: '#2563EB',
        legendFontColor: '#334155',
        legendFontSize: 13,
      });
    }

    if (report.risk.criminal_count > 0) {
      data.push({
        name: 'Criminal',
        count: report.risk.criminal_count,
        color: '#DC2626',
        legendFontColor: '#334155',
        legendFontSize: 13,
      });
    }

    if (report.risk.commercial_count > 0) {
      data.push({
        name: 'Commercial',
        count: report.risk.commercial_count,
        color: '#F59E0B',
        legendFontColor: '#334155',
        legendFontSize: 13,
      });
    }

    return data;
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

  const riskColor = getRiskColor(report.risk.overall_risk);

  const civilCount = report.risk.civil_count ?? 0;
  const criminalCount = report.risk.criminal_count ?? 0;
  const commercialCount = report.risk.commercial_count ?? 0;

  const hasMultipleCaseTypes =
    Number(civilCount > 0) +
      Number(criminalCount > 0) +
      Number(commercialCount > 0) >
    1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>AI Client Risk Report</Text>
        <Text style={styles.title}>Client Report</Text>
        <Text style={styles.name}>{report.client_name}</Text>
      </View>

      <View style={styles.riskCard}>
        <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
          <Text style={styles.riskBadgeText}>
            {report.risk.overall_risk} Risk
          </Text>
        </View>

        <Text style={styles.riskScoreText}>
          Risk Score: {report.risk.score ?? 0}%
        </Text>

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
          hasMultipleCaseTypes ? (
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
            <View style={styles.primaryCategoryCard}>
              <Text style={styles.primaryLabel}>Primary Legal Activity</Text>

              <Text style={styles.primaryType}>
                {criminalCount > 0
                  ? 'Criminal'
                  : commercialCount > 0
                  ? 'Commercial'
                  : 'Civil'}
              </Text>

              <Text style={styles.primaryCount}>
                {criminalCount > 0
                  ? criminalCount
                  : commercialCount > 0
                  ? commercialCount
                  : civilCount}{' '}
                detected case(s)
              </Text>

              <Text style={styles.primaryNote}>
                Only one major case category was detected for this client profile.
              </Text>
            </View>
          )
        ) : (
          <Text style={styles.bodyText}>No case distribution data available</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detailed Statistics</Text>
        <Text style={styles.detailText}>
          Overall Risk: {report.risk.overall_risk}
        </Text>
        <Text style={styles.detailText}>
          Confidence: {report.risk.confidence ?? 0}
        </Text>
        <Text style={styles.detailText}>
          Total Past Cases: {report.risk.case_count}
        </Text>
        <Text style={styles.detailText}>
          Civil Cases: {report.risk.civil_count}
        </Text>
        <Text style={styles.detailText}>
          Criminal Cases: {report.risk.criminal_count}
        </Text>
        <Text style={styles.detailText}>
          Commercial Cases: {report.risk.commercial_count}
        </Text>
        <Text style={styles.detailText}>
          Risk Score: {report.risk.score ?? 0}
        </Text>
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
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  name: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 22,
  },

  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  riskBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 12,
  },

  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  riskScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },

  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },

  bodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },

  detailText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },

  exportButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },

  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  primaryCategoryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 10,
  },

  primaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 8,
  },

  primaryType: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },

  primaryCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 10,
  },

  primaryNote: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});