import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CasePdf'>;

const CasePdfScreen = ({ route }: Props) => {
  const { pdfUrl, caseTitle } = route.params;

  const hasValidPdf =
    !!pdfUrl &&
    (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) &&
    !pdfUrl.toLowerCase().includes('404') &&
    !pdfUrl.toLowerCase().includes('notfound') &&
    !pdfUrl.toLowerCase().includes('not-found');

  const handleDownloadPdf = async () => {
    try {
      if (!hasValidPdf) {
        Alert.alert('PDF Not Available', 'This case does not have a valid PDF link.');
        return;
      }

      const baseDir =
        FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (!baseDir) {
        Alert.alert('Error', 'No local storage directory available');
        return;
      }

      const safeFileName = `${caseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const fileUri = `${baseDir}${safeFileName}`;

      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${downloadResult.uri}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to download PDF');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.pageLabel}>Judgment Viewer</Text>
        <Text style={styles.caseTitle}>{caseTitle}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              !hasValidPdf && styles.downloadButtonDisabled,
            ]}
            onPress={handleDownloadPdf}
            disabled={!hasValidPdf}
          >
            <Text style={styles.downloadButtonText}>
              {hasValidPdf ? 'Download PDF' : 'PDF Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewerCard}>
        {hasValidPdf ? (
          <WebView source={{ uri: pdfUrl }} style={styles.webview} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>PDF Not Available</Text>
            <Text style={styles.emptyText}>
              This case does not currently have a valid PDF link.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CasePdfScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 16,
  },
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  pageLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  caseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    lineHeight: 28,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  downloadButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  downloadButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  viewerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});