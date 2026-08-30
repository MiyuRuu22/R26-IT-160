import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { RADIUS, SCREEN_PADDING } from '../../constants/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'CasePdf'>;

const BACKEND_URL = 'http://172.28.247.19:8000';

const CasePdfScreen = ({ route }: Props) => {
  const { pdfUrl, caseTitle } = route.params;

  const [downloading, setDownloading] = useState(false);

  const hasValidPdf = useMemo(() => {
    if (!pdfUrl) {
      return false;
    }

    const url = String(pdfUrl).trim();

    return (
      url.startsWith('http://') ||
      url.startsWith('https://')
    );
  }, [pdfUrl]);

  const proxyUrl = useMemo(() => {
    if (!hasValidPdf) {
      return '';
    }

    return `${BACKEND_URL}/pdf/proxy?url=${encodeURIComponent(
      String(pdfUrl).trim(),
    )}`;
  }, [pdfUrl, hasValidPdf]);

  const handleOpenOriginalPdf = async () => {
    try {
      if (!hasValidPdf) {
        Alert.alert(
          'PDF Not Available',
          'This case does not have a valid PDF link.',
        );
        return;
      }

      const originalUrl = String(pdfUrl).trim();

      const supported = await Linking.canOpenURL(originalUrl);

      if (!supported) {
        Alert.alert(
          'Unable to Open PDF',
          'Your device cannot open this PDF link.',
        );
        return;
      }

      await Linking.openURL(originalUrl);
    } catch (error) {
      console.error('Open PDF error:', error);

      Alert.alert(
        'Error',
        'Unable to open the original PDF.',
      );
    }
  };

  const handleDownloadPdf = async () => {
    try {
      if (!hasValidPdf) {
        Alert.alert(
          'PDF Not Available',
          'This case does not have a valid PDF link.',
        );
        return;
      }

      setDownloading(true);

      const baseDir =
        FileSystem.documentDirectory ||
        FileSystem.cacheDirectory;

      if (!baseDir) {
        throw new Error(
          'No local storage directory is available.',
        );
      }

      const safeName =
        `${caseTitle || 'judgement'}`
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 100);

      const fileUri = `${baseDir}${safeName}.pdf`;

      console.log('Downloading PDF:', proxyUrl);

      const result = await FileSystem.downloadAsync(
        proxyUrl,
        fileUri,
      );

      console.log('Download result:', result);

      if (result.status !== 200) {
        throw new Error(
          `PDF download failed with HTTP ${result.status}`,
        );
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Open Judgment PDF',
        });
      } else {
        Alert.alert(
          'PDF Downloaded',
          'The judgment PDF was downloaded successfully.',
        );
      }
    } catch (error) {
      console.error('Download PDF error:', error);

      Alert.alert(
        'Download Failed',
        'Unable to download the judgment PDF. Please try again.',
      );
    } finally {
      setDownloading(false);
    }
  };

  if (!hasValidPdf) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageLabel}>
            JUDGMENT VIEWER
          </Text>

          <Text style={styles.caseTitle}>
            {caseTitle || 'Judgment'}
          </Text>

          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>
              PDF UNAVAILABLE
            </Text>
          </View>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            📄
          </Text>

          <Text style={styles.emptyTitle}>
            PDF Not Available
          </Text>

          <Text style={styles.emptyDescription}>
            This case does not currently have a valid PDF
            document.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.pageLabel}>
          JUDGMENT VIEWER
        </Text>

        <Text
          style={styles.caseTitle}
          numberOfLines={3}
        >
          {caseTitle || 'Judgment'}
        </Text>

        <View style={styles.buttonRow}>

          {/* DOWNLOAD BUTTON */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              downloading && styles.disabledButton,
            ]}
            onPress={handleDownloadPdf}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <>
                <ActivityIndicator color={colors.cardBg} />

                <Text style={styles.downloadText}>
                  Downloading...
                </Text>
              </>
            ) : (
              <Text style={styles.downloadText}>
                Download PDF
              </Text>
            )}
          </TouchableOpacity>

          {/* OPEN BUTTON */}
          <TouchableOpacity
            style={styles.openButton}
            onPress={handleOpenOriginalPdf}
            activeOpacity={0.8}
          >
            <Text style={styles.openText}>
              Open PDF
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* PDF AREA */}
      <View style={styles.viewerCard}>

        <View style={styles.previewContainer}>

          <Text style={styles.previewIcon}>
            📄
          </Text>

          <Text style={styles.previewTitle}>
            Judgment PDF Ready
          </Text>

          <Text style={styles.previewDescription}>
            The judgment PDF has been retrieved successfully
            from the Court of Appeal website.
          </Text>

          <Text style={styles.previewInfo}>
            You can download and open the judgment using the
            button below.
          </Text>

          {/* MAIN ACTION */}
          <TouchableOpacity
            style={[
              styles.primaryAction,
              downloading && styles.disabledButton,
            ]}
            onPress={handleDownloadPdf}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <>
                <ActivityIndicator color={colors.cardBg} />

                <Text style={styles.primaryActionText}>
                  Downloading PDF...
                </Text>
              </>
            ) : (
              <Text style={styles.primaryActionText}>
                Download & Open PDF
              </Text>
            )}
          </TouchableOpacity>

          {/* ORIGINAL PDF */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenOriginalPdf}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryText}>
              Open Original Court PDF
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* ANDROID INFO */}
      {Platform.OS === 'android' && (
        <Text style={styles.infoText}>
          Download the judgment to view it with a PDF
          application on your device.
        </Text>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBg,
  },

  header: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  pageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },

  caseTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 25,
    marginBottom: 14,
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  downloadButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexDirection: 'row',
    gap: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  downloadText: {
    color: colors.cardBg,
    fontSize: 14,
    fontWeight: '700',
  },

  openButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  openText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  unavailableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  unavailableText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  viewerCard: {
    flex: 1,
    margin: 12,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  previewIcon: {
    fontSize: 64,
    marginBottom: 18,
  },

  previewTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  previewDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSubtle,
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: 12,
  },

  previewInfo: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },

  primaryAction: {
    width: '100%',
    maxWidth: 320,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },

  primaryActionText: {
    color: colors.cardBg,
    fontSize: 14,
    fontWeight: '700',
  },

  secondaryButton: {
    width: '100%',
    maxWidth: 320,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryText: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '700',
  },

  emptyCard: {
    flex: 1,
    margin: 12,
    borderRadius: RADIUS,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  emptyDescription: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },

  infoText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});

export default CasePdfScreen;
