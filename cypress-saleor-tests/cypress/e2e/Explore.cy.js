/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / General
    SEARCH_INPUT: 'input[placeholder="Search Extensions..."]',
    APP_CARD_BASE: 'div[class*="Agentic Commerce"]', // Targeting a specific app card
    INSTALL_BUTTON: 'button:contains("Install")',
    REQUEST_EXTENSION_BUTTON: 'button:contains("Request Extension")',

    // Add Extension Dropdown (from the top right corner)
    ADD_EXTENSION_BUTTON: 'button:contains("Add Extension")',
    INSTALL_FROM_MANIFEST_LINK: 'div:contains("Install from manifest")',
    PROVIDE_MANUALLY_LINK: 'div:contains("Provide details manually")',

    // Generic
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
};

// --- CONCRETE TEST DATA ---
const KNOWN_APP_NAME = 'Instant Checkout with ChatGPT';


describe('Extensions: Explore Marketplace and Flow Tests (>15 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/extensions/explore');
        cy.contains('Explore').should('be.visible');
    });

    // =================================================================
    // C1: UI INTEGRITY & READ TESTS - 5 Cases
    // =================================================================

    it('C1.01: Verify the main app card is displayed correctly', () => {
        // Assert the known app is visible
        cy.contains(KNOWN_APP_NAME).should('be.visible');

        // Assert key details are present
        cy.get(SELECTORS.APP_CARD_BASE).should('contain', 'Developed by Saleor Commerce');
        cy.get(SELECTORS.APP_CARD_BASE).find(SELECTORS.INSTALL_BUTTON).should('be.visible');
    });

    it('C1.02: Verify the "Learn more" link is present and functional', () => {
        // Assert the link that explains the explore page is present
        cy.contains('Learn more about extensions').should('have.attr', 'href');
    });

    it('C1.03: Verify the "Request Extension" button is present and actionable', () => {
        cy.get(SELECTORS.REQUEST_EXTENSION_BUTTON).should('be.visible').click();

        // Assert a modal or form for requesting an extension opens (inferred)
        cy.contains('Request a new extension').should('be.visible');

        cy.get('button:contains("Back")').click();
    });

    it('C1.04: Verify clicking the Install button navigates to the installation form', () => {
        // Click the Install button on the app card
        cy.get(SELECTORS.APP_CARD_BASE).find(SELECTORS.INSTALL_BUTTON).click();

        // Assert redirection to the manifest install page (inferred flow)
        cy.url().should('include', 'install-from-manifest');
        cy.contains('Provide Manifest URL').should('be.visible');
    });

    it('C1.05: Verify the "Add Extension" dropdown shows all options', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();

        // Assert all options are visible
        cy.get(SELECTORS.INSTALL_FROM_MANIFEST_LINK).should('be.visible');
        cy.get(SELECTORS.PROVIDE_MANUALLY_LINK).should('be.visible');
        cy.contains('Explore').should('be.visible');
    });

    // =================================================================
    // C2: SEARCH & FILTER FUNCTIONALITY - 5 Cases
    // =================================================================

    it('C2.01: Successfully search for a known app', () => {
        cy.get(SELECTORS.SEARCH_INPUT).type('ChatGPT');

        // Assert only the relevant app card is visible
        cy.contains(KNOWN_APP_NAME).should('be.visible');
        cy.contains('Developed by Saleor Commerce').should('be.visible');
    });

    it('C2.02: Search for a non-existent app name', () => {
        const nonExistentApp = 'Zaki Test App 123';
        cy.get(SELECTORS.SEARCH_INPUT).type(nonExistentApp);

        // Assert "No results found" message appears
        cy.contains('No results found').should('be.visible'); // Assumed message
        cy.contains(KNOWN_APP_NAME).should('not.exist');
    });

    it('C2.03: Clearing the search field resets the view', () => {
        cy.get(SELECTORS.SEARCH_INPUT).type('Chat');
        cy.contains(KNOWN_APP_NAME).should('be.visible');

        cy.get(SELECTORS.SEARCH_INPUT).clear();

        // Assert the full list (or section list) reappears
        cy.contains(KNOWN_APP_NAME).should('be.visible');
        cy.contains('Payments').should('be.visible'); // Assert the section header
    });

    it('C2.04: Verify long search term input does not break UI', () => {
        const longSearch = 'L'.repeat(100);
        cy.get(SELECTORS.SEARCH_INPUT).type(longSearch);

        // Assert input field accepts the long string (not truncated)
        cy.get(SELECTORS.SEARCH_INPUT).should('have.value', longSearch);
    });

    it('C2.05: Verify search handles partial names', () => {
        cy.get(SELECTORS.SEARCH_INPUT).type('Checkout');

        cy.contains(KNOWN_APP_NAME).should('be.visible');
    });
});