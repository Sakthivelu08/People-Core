export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiEndpoints: {
    employees: '/employees',
    employeeMe: '/employees/me',
    leaveBalances: '/leaves/balances',
    leaveRequests: '/leaves/requests',
    onboardingTasks: '/onboarding/tasks',
    attrition: '/insights/attrition',
    engagement: '/insights/engagement',
    narrative: '/insights/narrative'
  },
  azure: {
    clientId: "e2a32780-387c-411c-a42a-51f2fc94d17b",
    tenantId: "4364f74a-6fec-4021-aa47-71ab911adf97",
    redirectUri: "http://localhost:4200"
  },
};