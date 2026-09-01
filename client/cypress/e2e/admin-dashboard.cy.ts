describe('Admin Management Dashboard E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/employees', {
      statusCode: 200,
      body: [
        { id: '1', name: 'Rohan Sharma', email: 'rohan@peoplecore.com' },
        { id: '2', name: 'Aarav Patel', email: 'aarav@peoplecore.com' }
      ]
    }).as('getEmployees');

    cy.intercept('GET', '**/api/leaves/requests', {
      statusCode: 200,
      body: [
        { id: 'l99', employee_name: 'Aarav Patel', employee_email: 'aarav@peoplecore.com', type: 'annual', start_date: '2026-07-10', end_date: '2026-07-15', days: 5, reason: 'Vacation', status: 'pending' }
      ]
    }).as('getAdminLeaves');

    cy.intercept('GET', '**/api/insights/attrition', {
      statusCode: 200,
      body: [
        { id: 'r1', employee_name: 'Arjun Mehta', department: 'Sales', risk_score: 78, risk_level: 'high', key_factors: 'Short tenure' }
      ]
    }).as('getAttrition');

    cy.intercept('GET', '**/api/onboarding/tasks', {
      statusCode: 200,
      body: [
        { id: 't1', title: 'Submit Identification Documents', completed: false }
      ]
    }).as('getOnboardingTasks');

    cy.intercept('PATCH', '**/api/leaves/requests/l99/approve', {
      statusCode: 200,
      body: { message: 'Leave status updated successfully' }
    }).as('approveLeave');
  });

  it('renders employee headcount, leave requests, and attrition widgets', () => {
    cy.loginAndVisit('/admin/dashboard', 'Admin');
    cy.contains('HR Admin Dashboard').should('exist');
    cy.contains('Total Employees').should('exist');
    cy.contains('Pending Leave Requests').should('exist');
  });

  it('approves a pending employee leave request', () => {
    cy.loginAndVisit('/admin/dashboard', 'Admin');
    cy.contains('tr', 'Aarav Patel')
      .contains('button', 'Approve')
      .click();
    cy.wait('@approveLeave');
    cy.contains('Leave request approved!').should('exist');
  });
});
