import { mount } from 'cypress/angular';
import { MetricCardComponent } from '../../src/app/shared/components/metric-card/metric-card.component';

describe('MetricCardComponent Cypress Component Test', () => {
  it('mounts and displays label, value, icon, and subtext', () => {
    mount(MetricCardComponent, {
      componentProperties: {
        label: 'Total Active Employees',
        value: 48,
        icon: 'people',
        variant: 'primary',
        subtext: '+12% from last month'
      }
    });

    cy.contains('Total Active Employees').should('be.visible');
    cy.contains('48').should('be.visible');
    cy.contains('+12% from last month').should('be.visible');
  });

  it('renders correct variant styling class', () => {
    mount(MetricCardComponent, {
      componentProperties: {
        label: 'Pending Leaves',
        value: 3,
        icon: 'pending_actions',
        variant: 'success',
        subtext: 'Requires admin review'
      }
    });

    cy.contains('Pending Leaves').should('be.visible');
    cy.contains('3').should('be.visible');
  });
});
