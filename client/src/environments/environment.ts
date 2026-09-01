export const environment = {
  production: true,
  apiUrl: 'https://peoplecore-backend-api-cveweregfvcgbrax.canadacentral-01.azurewebsites.net/api',
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
    clientId: "65a96e47-e4c1-410e-9944-a3022a01a447",
    tenantId: "7fa1af66-8e05-4be1-9935-d6eedbcb74f7",
    redirectUri: typeof window !== 'undefined' ? window.location.origin : "http://localhost:4200"
  },
};