describe('Leave Management E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/leaves/requests', {
      statusCode: 200,
      body: [
        { id: 'l1', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-05', days: 5, reason: 'Summer Trip', appliedOn: '2026-05-15', status: 'approved' }
      ]
    }).as('getLeaves');

    cy.intercept('GET', '**/api/leaves/balances', {
      statusCode: 200,
      body: { annual: 14, sick: 10, casual: 6 }
    }).as('getBalance');
  });

  it('renders leave balance cards and request history table', () => {
    cy.loginAndVisit('/employee/leave', 'Employee');
    cy.contains('Leave Management').should('exist');
    cy.contains('Annual Leave').should('exist');
    cy.contains('Summer Trip').should('exist');
  });

  it('opens leave application modal and toggles display', () => {
    cy.loginAndVisit('/employee/leave', 'Employee');
    cy.contains('button', 'Apply for Leave').click();
    cy.contains('New Leave Request').should('be.visible');

    cy.contains('button', 'Cancel').click();
  });
});
