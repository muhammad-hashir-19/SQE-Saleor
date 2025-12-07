// cypress/support/commands.js

Cypress.Commands.add('manualSocialLogin', () => {
    const AUTH_URL = 'https://auth.saleor.io';

    cy.visit('https://cloud.saleor.io/login');

    // 1. Click the Google button on Saleor Auth page
    cy.origin(AUTH_URL, () => {
        // Using the stable ID selector: #social-google
        cy.get('#social-google', { timeout: 15000 })
            .should('be.visible')
            .click();
    });

    // 2. PAUSE EXECUTION: Halt the test immediately after landing on the Google domain.
    cy.log('*** MANUAL STEP REQUIRED: Please complete Google Login and click Resume. ***').then(() => {
        cy.pause();
    });

    // 3. FORCE STABILITY: This code runs only AFTER you manually complete the login and click RESUME.

    // Assert the browser is back on the Saleor Dashboard domain
    cy.url({ timeout: 60000 }).should('include', '/dashboard');

    // Wait for the main dashboard element to be fully rendered before the session saves.
    cy.get('nav[data-testid="sidebar"]', { timeout: 40000 })
        .should('be.visible');

    cy.wait(5000); // Final 5-second explicit wait for stability.
});