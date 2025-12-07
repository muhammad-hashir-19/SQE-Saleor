// cypress/e2e/signup_navigation.cy.js

describe('Authentication: Navigation Tests', () => {

    // The AUTH_URL is the domain that hosts the form you interact with
    const AUTH_URL = 'https://auth.saleor.io';

    beforeEach(() => {
        // 1. Visit the initial entry point
        cy.visit('/login');

        // 2. Cypress will redirect the browser to the full AUTH_URL login page.
        // We ensure commands are ready to run on the AUTH_URL.

        // You MUST wrap the navigation commands in cy.origin() if the link you click
        // leads to a different domain (like the /registration link).

        // For the 'beforeEach' stability, just relying on cy.visit() and the pageLoadTimeout
        // is usually sufficient, as cy.visit() handles redirects.

        // However, if the page load is still flaky, you can add a simple wait
        // and an assertion to confirm the form is present before the test starts:
        cy.wait(2000); // Give the page a short moment to render
        cy.get('[data-test="submit-button"]').should('be.visible'); // Assert the key element is ready
    });

    // ... tests for Forgot Password and Sign up ...
});