import { mount } from 'cypress/angular';
import { TableComponent } from '../../src/app/shared/components/table/table.component';

describe('TableComponent Cypress Component Test', () => {
  it('mounts table and renders column headers', () => {
    mount(TableComponent, {
      componentProperties: {
        headers: ['Employee Name', 'Department', 'Role', 'Status']
      }
    });

    cy.contains('th', 'Employee Name').should('be.visible');
    cy.contains('th', 'Department').should('be.visible');
    cy.contains('th', 'Role').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
  });
});
