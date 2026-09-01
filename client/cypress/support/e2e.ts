import './commands';

// Prevent uncaught exception failures from third-party libraries in tests
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});
