describe('AI Attrition & Engagement Insights E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/insights/attrition', {
      statusCode: 200,
      body: [
        { name: 'Arjun Mehta', department: 'Sales', riskScore: 78, riskLevel: 'high', keyFactors: ['Short tenure', 'Low salary grade'] },
        { name: 'Neha Gupta', department: 'Product', riskScore: 35, riskLevel: 'low', keyFactors: ['Recent promotion'] }
      ]
    }).as('getAttrition');

    cy.intercept('GET', '**/api/insights/engagement', {
      statusCode: 200,
      body: [
        { department: 'Engineering', score: 84, trend: 'rising' },
        { department: 'Sales', score: 62, trend: 'declining' }
      ]
    }).as('getEngagement');

    cy.intercept('GET', '**/api/insights/ai-narrative', {
      statusCode: 200,
      body: { narrative: 'AI Summary: Sales department shows elevated attrition risk due to recent organizational restructure. Immediate retention review recommended.' }
    }).as('getNarrative');
  });

  it('renders attrition risk scores, engagement trends, and AI executive summary narrative', () => {
    cy.loginAndVisit('/admin/insights', 'Admin');
    cy.contains('AI People Insights').should('exist');
    cy.contains('Arjun Mehta').should('exist');
    cy.contains('78').should('exist');
    cy.contains('Engineering').should('exist');
    cy.contains('AI Summary: Sales department shows elevated attrition risk').should('exist');
  });

  it('triggers regenerate AI narrative action', () => {
    cy.loginAndVisit('/admin/insights', 'Admin');
    cy.contains('button', 'Regenerate').click();
    cy.wait('@getNarrative');
    cy.contains('AI Summary: Sales department shows elevated attrition risk').should('exist');
  });
});
