import { mount } from 'cypress/angular';
import { ModalComponent } from '../../src/app/shared/components/modal/modal.component';

describe('ModalComponent Cypress Component Test', () => {
  it('does not render modal content when isOpen is false', () => {
    mount(ModalComponent, {
      componentProperties: {
        isOpen: false,
        title: 'New Leave Request'
      }
    });

    cy.contains('New Leave Request').should('not.exist');
  });

  it('renders modal header title when isOpen is true', () => {
    mount(ModalComponent, {
      componentProperties: {
        isOpen: true,
        title: 'Apply for Leave'
      }
    });

    cy.contains('Apply for Leave').should('be.visible');
  });
});
