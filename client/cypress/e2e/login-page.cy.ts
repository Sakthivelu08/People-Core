describe('PeopleCore Login Page E2E Suite', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('1. should load login page and display brand title', () => {
    cy.contains('PeopleCore').should('be.visible');
    cy.contains('Integrated HR & AI Insights Platform').should('be.visible');
  });

  it('2. should display Sign In heading and description', () => {
    cy.contains('h2', 'Sign In').should('be.visible');
    cy.contains('Access your workspace using your secure enterprise credentials.').should('be.visible');
  });

  it('3. should render Microsoft SSO login button', () => {
    cy.get('button.sso-button')
      .should('be.visible')
      .and('contain.text', 'Sign in with Microsoft SSO');
  });

  it('4. should render security badge', () => {
    cy.contains('Authorized Access Only').should('be.visible');
  });

  it('5. should redirect root path / to /login when unauthenticated', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });
});
