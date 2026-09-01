declare namespace Cypress {
  interface Chainable {
    loginAndVisit(url: string, role: 'Employee' | 'Admin'): Chainable<void>;
  }
}

const CLIENT_ID = '65a96e47-e4c1-410e-9944-a3022a01a447';

Cypress.Commands.add('loginAndVisit', (url: string, role: 'Employee' | 'Admin') => {
  const oid = role === 'Admin' ? 'e2e-admin-oid' : 'e2e-emp-oid';
  const name = role === 'Admin' ? 'Priya Sharma' : 'Rohan Sharma';
  const email = role === 'Admin' ? 'priya.sharma@peoplecore.com' : 'rohan.sharma@peoplecore.com';
  const homeAccountId = `${oid}.common`;

  const accountObj = {
    homeAccountId: homeAccountId,
    environment: 'login.microsoftonline.com',
    realm: 'common',
    localAccountId: oid,
    username: email,
    name: name,
    authorityType: 'MSAL',
    idTokenClaims: {
      oid: oid,
      name: name,
      preferred_username: email,
      roles: [role]
    }
  };

  cy.intercept('GET', '**/api/employees/me', {
    statusCode: 200,
    body: { oid, name, email, role }
  }).as('getProfile');

  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('msal.account.keys', JSON.stringify([homeAccountId]));
      win.localStorage.setItem(homeAccountId, JSON.stringify(accountObj));
      win.localStorage.setItem(`msal.${CLIENT_ID}.active-account`, homeAccountId);
      win.localStorage.setItem('msal.active-account', homeAccountId);
    }
  });
});
