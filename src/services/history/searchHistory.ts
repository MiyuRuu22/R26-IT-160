import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';

export type SearchHistoryItem = {
  fullName: string;
  courtLocation: string;
  caseTypeHint?: string;
  searchedAt: string;
};

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

export const saveSearchHistory = async (item: SearchHistoryItem) => {
  try {
    const existing = await getSearchHistory();

    const filtered = existing.filter(
      historyItem =>
        !(
          historyItem.fullName === item.fullName &&
          historyItem.courtLocation === item.courtLocation &&
          historyItem.caseTypeHint === item.caseTypeHint
        )
    );

    const updated = [item, ...filtered].slice(0, 10);

    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};