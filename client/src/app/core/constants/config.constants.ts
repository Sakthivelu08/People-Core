import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    employees: '/employees',
    employeeMe: '/employees/me',
    leaveBalances: '/leaves/balances',
    leaveRequests: '/leaves/requests',
    onboardingTasks: '/onboarding/tasks',
    attrition: '/insights/attrition',
    engagement: '/insights/engagement',
    narrative: '/insights/narrative'
  }
};

export const MICROSOFT_GRAPH_CONFIG = {
  baseUrl: 'https://graph.microsoft.com/v1.0',
  endpoints: {
    users: '/users',
    photo: '/me/photo/$value',
    memberOf: '/me/memberOf'
  },
  scopes: {
    directoryRead: ['Directory.Read.All', 'User.ReadWrite.All'],
    userRead: ['User.Read']
  }
};
