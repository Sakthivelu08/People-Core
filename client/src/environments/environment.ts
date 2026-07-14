export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api', // Default local URL, updated as needed
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
    redirectUri: "http://localhost:4200"
  },
};