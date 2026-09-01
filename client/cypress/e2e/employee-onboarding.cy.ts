describe('Employee Onboarding Portal E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/onboarding/tasks', {
      statusCode: 200,
      body: [
        { id: 't1', title: 'Submit Identification Documents', description: 'Upload Passport or National ID', category: 'documents', dueDate: '2026-09-10', completed: true },
        { id: 't2', title: 'Attend Security Compliance Orientation', description: 'Complete online security module', category: 'training', dueDate: '2026-09-15', completed: false }
      ]
    }).as('getOnboardingTasks');
  });

  it('renders onboarding status title and tasks', () => {
    cy.loginAndVisit('/employee/onboarding', 'Employee');
    cy.contains('Onboarding Status').should('exist');
    cy.contains('Submit Identification Documents').should('exist');
    cy.contains('Attend Security Compliance Orientation').should('exist');
  });

  it('displays category cards and progress metrics', () => {
    cy.loginAndVisit('/employee/onboarding', 'Employee');
    cy.contains('Overall Progress').should('exist');
    cy.contains('Documents').should('exist');
    cy.contains('Training').should('exist');
  });
});
