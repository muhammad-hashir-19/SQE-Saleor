// cypress/e2e/login.cy.js

// Define the two origins we interact with
const BASE_URL = 'https://cloud.saleor.io';
const AUTH_URL = 'https://auth.saleor.io'; // The domain that handles the login form and subsequent commands

describe('Authentication: Saleor Cloud Login Form Tests', () => {

    // Use a beforeEach to navigate to the login page and then switch context
    beforeEach(() => {
        // 1. Visit the base URL (which should redirect to the auth page)
        cy.visit(`${BASE_URL}/login`);

        // 2. Cypress should automatically detect the redirect to AUTH_URL.
        // However, to be certain, we will wrap the commands. 
        // If the commands below fail due to the origin error, we need to wrap the interaction.
    });

    // --- Negative Test Cases (Modified) ---

    // We wrap the form submission and assertion logic because it's managed by AUTH_URL
    // Note: We use the actual selectors from your provided source

    it('1. should show error messages when fields are left empty on submit', () => {

        // We must ensure the commands run against the AUTH_URL
        // The page structure is present on the AUTH URL, even if the URL in the browser bar shows cloud.saleor.io/login

        // If the error persists, you might need to wrap the entire test:
        cy.origin(AUTH_URL, () => {
            // 1. Click the submit button
            cy.get('[data-test="submit-button"]').click();

            // 2. Assert the error message (Need the exact selector and text)
            // You still need to replace the selector and message below:
            cy.get('#kc-content-wrapper')
                .should('contain', 'Invalid username or password.');
        });
    });


    it('2. should reject login with invalid credentials', () => {
        const invalidEmail = 'nonexistent_' + Date.now() + '@test.com';
        const invalidPassword = 'wrongpassword';

        cy.origin(AUTH_URL, () => {
            // 1. Type invalid credentials
            cy.get('[data-test="username"]').type(invalidEmail);
            cy.get('[data-test="password"]').type(invalidPassword);
            cy.get('[data-test="submit-button"]').click();

            // 2. Assert the error message
            // You still need to replace the selector and message below:
            cy.get('#kc-content-wrapper')
                .should('contain', 'Invalid username or password.');
        });
    });

    // --- Positive Test Case (Requires Custom Command Update) ---
    // The 'before each' hook failure meant this test didn't even start. 
    // We'll update the custom command next, then use it here.
    it('3. should successfully log in and redirect to the Project Selection page', () => {
        // ACTION REQUIRED: REPLACE with your actual, valid test user credentials
        const validEmail = 'zakihaider7860@gmail.com';
        const validPassword = '1033614@ZA';

        // Use the updated login command
        cy.login(validEmail, validPassword);

        // After the login command completes, the origin should be back to BASE_URL or the new project domain.
        cy.url().should('include', '/projects');
    });

    // ... other tests ...
});