import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { getClientReport } from '../../services/api/clientApi';
import { colors } from '../../theme/colors';
import { RADIUS, SCREEN_PADDING } from '../../constants/ui';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ClientReport'
>;

type RiskData = {
  overall_risk?: string;
  confidence?: number;
  case_count?: number;
  civil_count?: number;
  criminal_count?: number;
  commercial_count?: number;
  score?: number;
};

type ReportData = {
  client_name?: string;
  summary?: string;
  recommendation?: string;
  risk?: RiskData;
};

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createReportHtml = ({
  clientKey,
  clientName,
  generatedAt,
  overallRisk,
  score,
  confidence,
  summary,
  recommendation,
  risk,
}: {
  clientKey: string;
  clientName: string;
  generatedAt: string;
  overallRisk: string;
  score: number;
  confidence: number;
  summary: string;
  recommendation: string;
  risk?: RiskData;
}) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { margin: 34px; }
        body {
          color: ${colors.text};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 12px;
          line-height: 1.55;
        }
        h1, h2, p { margin: 0; }
        .header {
          border-bottom: 2px solid ${colors.primary};
          margin-bottom: 24px;
          padding-bottom: 16px;
        }
        .eyebrow {
          color: ${colors.textMuted};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        h1 { font-size: 25px; line-height: 1.2; margin-top: 5px; }
        .muted { color: ${colors.textMuted}; }
        .reference { margin-top: 6px; font-size: 11px; }
        .risk-card {
          background: ${colors.inputBg};
          border: 1px solid ${colors.border};
          border-radius: 10px;
          margin-bottom: 20px;
          padding: 16px;
        }
        .risk-title { font-size: 16px; font-weight: 700; }
        .risk-level { color: ${colors.primary2}; font-size: 20px; font-weight: 800; margin-top: 5px; }
        .metrics { margin-top: 14px; width: 100%; }
        .metric { display: inline-block; margin-right: 30px; }
        .metric-label { color: ${colors.textMuted}; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .metric-value { font-size: 18px; font-weight: 800; }
        .section { margin-top: 22px; }
        h2 { font-size: 15px; margin-bottom: 8px; }
        .panel { background: ${colors.cardBg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 13px; }
        table { border-collapse: collapse; margin-top: 8px; width: 100%; }
        th, td { border-bottom: 1px solid ${colors.divider}; padding: 9px 6px; text-align: left; }
        th { color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; }
        td:last-child, th:last-child { text-align: right; }
        .notice { background: ${colors.chipBlue}; border-left: 3px solid ${colors.primary}; border-radius: 6px; margin-top: 22px; padding: 12px; }
        .footer { border-top: 1px solid ${colors.divider}; color: ${colors.textMuted}; font-size: 10px; margin-top: 28px; padding-top: 12px; }
      </style>
    </head>
    <body>
      <header class="header">
        <p class="eyebrow">Lawyer Client Risk</p>
        <h1>AI Client Risk Report</h1>
        <p class="muted">Prepared for ${escapeHtml(clientName)}</p>
        <p class="reference muted">Client reference: ${escapeHtml(clientKey)} &nbsp;•&nbsp; Generated: ${escapeHtml(generatedAt)}</p>
      </header>

      <section class="risk-card">
        <p class="eyebrow">Overall risk assessment</p>
        <p class="risk-title">Client Risk Assessment</p>
        <p class="risk-level">${escapeHtml(overallRisk)} Risk</p>
        <div class="metrics">
          <div class="metric"><p class="metric-label">Risk score</p><p class="metric-value">${score}%</p></div>
          <div class="metric"><p class="metric-label">Confidence</p><p class="metric-value">${confidence}%</p></div>
          <div class="metric"><p class="metric-label">Total cases</p><p class="metric-value">${risk?.case_count ?? 0}</p></div>
        </div>
      </section>

      <section class="section">
        <h2>AI Risk Summary</h2>
        <div class="panel">${escapeHtml(summary)}</div>
      </section>

      <section class="section">
        <h2>Relevant Case History</h2>
        <div class="panel">Available case history is reflected in the risk summary and case-type breakdown below.</div>
      </section>

      <section class="section">
        <h2>Case Type Breakdown</h2>
        <table>
          <thead><tr><th>Case type</th><th>Cases</th></tr></thead>
          <tbody>
            <tr><td>Total cases</td><td>${risk?.case_count ?? 0}</td></tr>
            <tr><td>Civil</td><td>${risk?.civil_count ?? 0}</td></tr>
            <tr><td>Criminal</td><td>${risk?.criminal_count ?? 0}</td></tr>
            <tr><td>Commercial</td><td>${risk?.commercial_count ?? 0}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="notice">
        <h2>Recommended Action</h2>
        <p>${escapeHtml(recommendation)}</p>
      </section>

      <footer class="footer">AI-assisted legal research. This report is a decision-support tool and requires professional legal review.</footer>
    </body>
  </html>
`;

const ClientReportScreen = ({ route }: Props) => {
  const { clientKey } = route.params;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    try {
      setError('');

      const data = await getClientReport(clientKey);

      setReport(data);
    } catch (err) {
      console.error('Client report error:', err);

      setError(
        'Unable to load the client risk report. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientKey]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  const handleRetry = () => {
    setLoading(true);
    loadReport();
  };

  const risk = report?.risk;

  const overallRisk = useMemo(() => {
    const value = String(
      risk?.overall_risk || 'Low',
    ).trim();

    if (!value) {
      return 'Low';
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1).toLowerCase()
    );
  }, [risk?.overall_risk]);

  const score = useMemo(() => {
    const value = Number(risk?.score ?? 0);

    if (Number.isNaN(value)) {
      return 0;
    }

    return Math.max(0, Math.min(100, value));
  }, [risk?.score]);

  const confidence = useMemo(() => {
  const value = Number(
    risk?.confidence ?? 0,
  );

  if (Number.isNaN(value)) {
    return 0;
  }

  // Backend returns confidence as 0–1.
  // Convert it to a percentage for display.
  const percentage =
    value <= 1
      ? value * 100
      : value;

  return Math.round(
    Math.max(0, Math.min(100, percentage))
  );
}, [risk?.confidence]);

  const riskColor = useMemo(() => {
    switch (overallRisk.toLowerCase()) {
      case 'high':
        return colors.danger;

      case 'medium':
        return colors.warning;

      default:
        return colors.success;
    }
  }, [overallRisk]);

  const riskBackground = useMemo(() => {
    switch (overallRisk.toLowerCase()) {
      case 'high':
        return '#FEE2E2';

      case 'medium':
        return '#FEF3C7';

      default:
        return '#DCFCE7';
    }
  }, [overallRisk]);

  const clientName =
    report?.client_name || 'Unknown Client';

  const summary =
    report?.summary ||
    'No summary is currently available for this client.';

  const recommendation =
    report?.recommendation ||
    'Please review the available case history before making a final decision.';

  const handleExportReport = async () => {
    if (!report) {
      return;
    }

    try {
      setExporting(true);

      const exportedAt = new Date();
      const html = createReportHtml({
        clientKey,
        clientName,
        generatedAt: exportedAt.toLocaleDateString(),
        overallRisk,
        score,
        confidence,
        summary,
        recommendation,
        risk,
      });
      const safeClientName = clientName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 80) || 'Client';
      const filename = `Client_Risk_Report_${safeClientName}_${exportedAt
        .toISOString()
        .slice(0, 10)}.pdf`;
      const { uri } = await Print.printToFileAsync({ html });
      const baseDirectory =
        FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (!baseDirectory) {
        throw new Error('No local storage directory is available.');
      }

      const fileUri = `${baseDirectory}${filename}`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert(
          'Report Created',
          'The report PDF was created, but sharing is not available on this device.',
        );
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Client Risk Report',
        UTI: 'com.adobe.pdf',
      });

      Alert.alert(
        'Report Ready',
        `${filename} is ready to save or share.`,
      );
    } catch (exportError) {
      console.error('Report export error:', exportError);
      Alert.alert(
        'Export Failed',
        'Unable to create the client risk report PDF. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingTitle}>
          Generating Client Report
        </Text>

        <Text style={styles.loadingDescription}>
          Analysing the client case history and calculating
          the risk assessment...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>
        </View>

        <Text style={styles.errorTitle}>
          Report Unavailable
        </Text>

        <Text style={styles.errorDescription}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <View style={styles.header}>
          <Text style={styles.pageLabel}>
            AI CLIENT RISK REPORT
          </Text>

          <Text style={styles.clientName}>
            {clientName}
          </Text>

          <Text style={styles.headerDescription}>
            Automated analysis of the client's available
            court case history.
          </Text>
        </View>

        {/* ====================================================== */}
        {/* OVERALL RISK CARD */}
        {/* ====================================================== */}

        <View style={styles.riskCard}>
          <View style={styles.riskHeaderRow}>
            <View style={styles.riskTitleContainer}>
              <Text style={styles.sectionLabel}>
                OVERALL RISK
              </Text>

              <Text style={styles.riskTitle}>
                Client Risk Assessment
              </Text>
            </View>

            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor: riskBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.riskBadgeText,
                  {
                    color: riskColor,
                  },
                ]}
              >
                {overallRisk} Risk
              </Text>
            </View>
          </View>

          {/* Risk score */}

          <View style={styles.scoreSection}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                Risk Score
              </Text>

              <Text
                style={[
                  styles.scoreValue,
                  {
                    color: riskColor,
                  },
                ]}
              >
                {score}%
              </Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${score}%`,
                    backgroundColor: riskColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Confidence */}

          <View style={styles.confidenceBox}>
            <View style={styles.confidenceIcon}>
              <Text style={styles.confidenceIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.confidenceContent}>
              <Text style={styles.confidenceTitle}>
                Assessment Confidence
              </Text>

              <Text style={styles.confidenceDescription}>
                Based on the available case history and
                classification data.
              </Text>
            </View>

            <Text style={styles.confidenceValue}>
              {confidence}%
            </Text>
          </View>
        </View>

        {/* ====================================================== */}
        {/* AI SUMMARY */}
        {/* ====================================================== */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>
                AI
              </Text>
            </View>

            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>
                AI Risk Summary
              </Text>

              <Text style={styles.cardSubtitle}>
                Automated analysis
              </Text>
            </View>
          </View>

          <Text style={styles.summaryText}>
            {summary}
          </Text>
        </View>

        {/* ====================================================== */}
        {/* RECOMMENDATION */}
        {/* ====================================================== */}

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionLabel}>
            RECOMMENDATION
          </Text>

          <Text style={styles.recommendationTitle}>
            Suggested Action
          </Text>

          <Text style={styles.recommendationText}>
            {recommendation}
          </Text>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>
              Professional Review Required
            </Text>

            <Text style={styles.disclaimerText}>
              This assessment is an AI-assisted decision
              support tool. The final legal decision should
              always be made by a qualified legal professional.
            </Text>
          </View>
        </View>

        {/* ====================================================== */}
        {/* CASE STATISTICS */}
        {/* ====================================================== */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>
                #
              </Text>
            </View>

            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>
                Case Statistics
              </Text>

              <Text style={styles.cardSubtitle}>
                Available case history
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {/* Total */}

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {risk?.case_count ?? 0}
              </Text>

              <Text style={styles.statLabel}>
                Total Cases
              </Text>
            </View>

            {/* Civil */}

            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {risk?.civil_count ?? 0}
              </Text>

              <Text style={styles.statLabel}>
                Civil
              </Text>
            </View>

            {/* Criminal */}

            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                {risk?.criminal_count ?? 0}
              </Text>

              <Text style={styles.statLabel}>
                Criminal
              </Text>
            </View>

            {/* Commercial */}

            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: colors.primary2,
                  },
                ]}
              >
                {risk?.commercial_count ?? 0}
              </Text>

              <Text style={styles.statLabel}>
                Commercial
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================================== */}
        {/* RISK EXPLANATION */}
        {/* ====================================================== */}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            RISK CLASSIFICATION
          </Text>

          <Text style={styles.cardTitle}>
            What does this mean?
          </Text>

          <View style={styles.riskExplanationRow}>
            <View
              style={[
                styles.explanationDot,
                {
                  backgroundColor: colors.success,
                },
              ]}
            />

            <View style={styles.explanationContent}>
              <Text style={styles.explanationTitle}>
                Low Risk
              </Text>

              <Text style={styles.explanationText}>
                Limited indicators of significant legal risk
                based on the available case history.
              </Text>
            </View>
          </View>

          <View style={styles.riskExplanationRow}>
            <View
              style={[
                styles.explanationDot,
                {
                  backgroundColor: colors.warning,
                },
              ]}
            />

            <View style={styles.explanationContent}>
              <Text style={styles.explanationTitle}>
                Medium Risk
              </Text>

              <Text style={styles.explanationText}>
                Some relevant risk indicators were identified
                and should receive additional review.
              </Text>
            </View>
          </View>

          <View style={styles.riskExplanationRow}>
            <View
              style={[
                styles.explanationDot,
                {
                  backgroundColor: colors.danger,
                },
              ]}
            />

            <View style={styles.explanationContent}>
              <Text style={styles.explanationTitle}>
                High Risk
              </Text>

              <Text style={styles.explanationText}>
                Significant risk indicators were identified
                in the available case history.
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================================== */}
        {/* DATA NOTE */}
        {/* ====================================================== */}

        <View style={styles.dataNote}>
          <Text style={styles.dataNoteIcon}>
            ℹ
          </Text>

          <Text style={styles.dataNoteText}>
            The report is generated from the case information
            currently available in the system. Missing or
            incomplete court records may affect the assessment.
          </Text>
        </View>

        {/* ====================================================== */}
        {/* REFRESH BUTTON */}
        {/* ====================================================== */}

        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.disabledButton]}
          onPress={handleExportReport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color={colors.cardBg} />
              <Text style={styles.exportButtonText}>Creating PDF...</Text>
            </View>
          ) : (
            <Text style={styles.exportButtonText}>Export Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>
            Refresh Report
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          AI-assisted legal research • Human review required
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ========================================================== */
  /* CONTAINER */
  /* ========================================================== */

  container: {
    flex: 1,
    backgroundColor: colors.appBg,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 18,
    paddingBottom: 35,
  },

  /* ========================================================== */
  /* LOADING */
  /* ========================================================== */

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    backgroundColor: colors.appBg,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  loadingDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },

  /* ========================================================== */
  /* ERROR */
  /* ========================================================== */

  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: colors.appBg,
  },

  errorIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginBottom: 18,
  },

  errorIcon: {
    fontSize: 34,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  errorDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 24,
    minWidth: 170,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 25,
  },

  retryButtonText: {
    color: colors.cardBg,
    fontSize: 15,
    fontWeight: '700',
  },

  /* ========================================================== */
  /* HEADER */
  /* ========================================================== */

  header: {
    marginBottom: 14,
  },

  pageLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 6,
  },

  clientName: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.text,
  },

  headerDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* GENERAL CARD */
  /* ========================================================== */

  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipBlue,
    marginRight: 12,
  },

  cardIconText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  cardHeaderContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },

  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* RISK CARD */
  /* ========================================================== */

  riskCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  riskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  riskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 5,
  },

  riskTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },

  riskBadge: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginLeft: 10,
  },

  riskBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* ========================================================== */
  /* SCORE */
  /* ========================================================== */

  scoreSection: {
    marginTop: 24,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSubtle,
  },

  scoreValue: {
    fontSize: 25,
    fontWeight: '800',
  },

  progressBackground: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.divider,
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
  },

  /* ========================================================== */
  /* CONFIDENCE */
  /* ========================================================== */

  confidenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
  },

  confidenceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    marginRight: 10,
  },

  confidenceIconText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.success,
  },

  confidenceContent: {
    flex: 1,
  },

  confidenceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSubtle,
  },

  confidenceDescription: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },

  confidenceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 8,
  },

  /* ========================================================== */
  /* SUMMARY */
  /* ========================================================== */

  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSubtle,
  },

  /* ========================================================== */
  /* RECOMMENDATION */
  /* ========================================================== */

  recommendationCard: {
    backgroundColor: colors.chipBlue,
    borderRadius: RADIUS,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  recommendationTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 10,
  },

  recommendationText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSubtle,
  },

  disclaimerBox: {
    marginTop: 18,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.chipBlue,
  },

  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 5,
  },

  disclaimerText: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* STATS */
  /* ========================================================== */

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48%',
    minHeight: 90,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    marginBottom: 10,
    paddingHorizontal: 8,
  },

  statValue: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
  },

  statLabel: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* RISK EXPLANATION */
  /* ========================================================== */

  riskExplanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
  },

  explanationDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 10,
  },

  explanationContent: {
    flex: 1,
  },

  explanationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSubtle,
  },

  explanationText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* DATA NOTE */
  /* ========================================================== */

  dataNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 14,
  },

  dataNoteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.chipBlue,
    marginRight: 9,
  },

  dataNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
  },

  /* ========================================================== */
  /* REFRESH */
  /* ========================================================== */

  refreshButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 15,
  },

  exportButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy2,
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  exportButtonText: {
    color: colors.cardBg,
    fontSize: 14,
    fontWeight: '800',
  },

  refreshButtonText: {
    color: colors.cardBg,
    fontSize: 14,
    fontWeight: '800',
  },

  footerText: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    paddingBottom: 5,
  },
});

export default ClientReportScreen;
