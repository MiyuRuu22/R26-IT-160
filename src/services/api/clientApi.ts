import axios from 'axios';

const BASE_URL = 'http://10.35.252.19:8000';

export const searchClients = async (payload: {
  fullName: string;
  courtLocation: string;
  caseTypeHint?: string;
}) => {
  const response = await axios.post(`${BASE_URL}/search/clients`, {
    full_name: payload.fullName,
    court_location: payload.courtLocation,
    case_type_hint: payload.caseTypeHint || '',
  });

  return response.data;
};

export const getClientProfile = async (clientKey: string) => {
  const response = await axios.get(`${BASE_URL}/clients/profile`, {
    params: { client_key: clientKey },
  });

  return response.data;
};

export const getClientReport = async (clientKey: string) => {
  const response = await axios.get(`${BASE_URL}/reports/client-summary`, {
    params: { client_key: clientKey },
  });

  return response.data;
};