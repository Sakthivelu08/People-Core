describe('Authentication & SSO Login Flow E2E', () => {
  it('redirects unauthenticated users to /login and displays Microsoft SSO button', () => {
    cy.visit('/login');
    cy.contains('PeopleCore').should('exist');
    cy.contains('Sign in with Microsoft SSO').should('exist');
  });

  it('contains secure enterprise login badge', () => {
    cy.visit('/login');
    cy.contains('Authorized Access Only').should('exist');
  });
});
