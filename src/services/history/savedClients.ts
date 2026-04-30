import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_CLIENTS_KEY = 'saved_clients';

export type SavedClientItem = {
  fullName: string;
  courtLocation: string;
  caseTypeHint?: string;
  savedAt: string;
};

export const getSavedClients = async (): Promise<SavedClientItem[]> => {
  try {
    const data = await AsyncStorage.getItem(SAVED_CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load saved clients:', error);
    return [];
  }
};

export const saveClientToFavorites = async (item: SavedClientItem) => {
  try {
    const existing = await getSavedClients();

    const alreadyExists = existing.some(
      client =>
        client.fullName === item.fullName &&
        client.courtLocation === item.courtLocation &&
        client.caseTypeHint === item.caseTypeHint
    );

    if (alreadyExists) return;

    const updated = [item, ...existing];
    await AsyncStorage.setItem(SAVED_CLIENTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save favorite client:', error);
  }
};

export const removeSavedClient = async (item: SavedClientItem) => {
  try {
    const existing = await getSavedClients();

    const updated = existing.filter(
      client =>
        !(
          client.fullName === item.fullName &&
          client.courtLocation === item.courtLocation &&
          client.caseTypeHint === item.caseTypeHint
        )
    );

    await AsyncStorage.setItem(SAVED_CLIENTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove saved client:', error);
  }
};