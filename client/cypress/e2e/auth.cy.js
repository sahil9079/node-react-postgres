describe('Authentication flows', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display sign-in page', () => {
    cy.contains('Sign In').click();
    cy.url().should('include', '/sign-in');
    cy.get('input[id="email"]').should('exist');
    cy.get('input[id="password"]').should('exist');
  });

  it('should display sign-up page', () => {
    cy.contains('Sign Up').click();
    cy.url().should('include', '/sign-up');
    cy.get('input[id="firstName"]').should('exist');
    cy.get('input[id="lastName"]').should('exist');
    cy.get('input[id="email"]').should('exist');
    cy.get('input[id="password"]').should('exist');
    cy.get('input[id="passwordConfirm"]').should('exist');
  });

  it('should show validation errors on empty login form', () => {
    cy.contains('Sign In').click();
    cy.get('button').contains('SIGN IN').click();
    cy.contains('Please input your email').should('be.visible');
    cy.contains('Please input your password').should('be.visible');
  });

  it('should navigate to home via nav link', () => {
    cy.contains('Home').click();
    cy.contains('Home Page').should('be.visible');
  });

  it('should navigate to about page', () => {
    cy.contains('About').click();
    cy.contains('About Page').should('be.visible');
  });
});
