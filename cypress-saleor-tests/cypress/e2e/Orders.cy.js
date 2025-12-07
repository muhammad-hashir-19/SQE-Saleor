/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page Elements
    CREATE_ORDER_BUTTON: '[data-test-id="create-order-button"]',

    // Channel Selection Modal
    CHANNEL_MODAL_TITLE: 'h2:contains("Select a channel")',
    CHANNEL_INPUT: 'input[data-test-id="channel-autocomplete"]',
    CHANNEL_DROPDOWN_TOGGLE: 'svg[d*="M15.932 10H8.067"]', // Dropdown arrow SVG
    CONFIRM_BUTTON: 'button[data-test-id="submit"]',
    BACK_BUTTON: 'button[data-test-id="back"]',

    // Channels (Visible text in the dropdown/list)
    PLN_CHANNEL_OPTION: 'li:contains("Channel-PLN")', // Inferred list item selector
    USD_CHANNEL_OPTION: 'li:contains("Default channel")', // Inferred list item selector
};

// --- CONCRETE TEST DATA ---
const TEST_CHANNEL_NAME = 'PLN-Channel';
const TEST_CHANNEL_NAME_2 = 'Default channel';


describe('Orders: Channel Selection and Draft Creation Flow', () => {

    // --- Setup ---
    before(() => {
        // Creates and saves the authenticated session state
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        // Navigate to the Orders list page
        cy.visit('/orders');
        cy.url().should('include', '/orders');
    });

    // =================================================================
    // C1: CHANNEL SELECTION MODAL (FLOW & NEGATIVE TESTS) - 7 Cases
    // =================================================================

    it('C1.01: Successfully select a channel and navigate to Draft creation (PLN)', () => {
        // 1. Click Create Order button
        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_MODAL_TITLE).should('be.visible');

        // 2. Select channel using dropdown (PLN)
        cy.get(SELECTORS.CHANNEL_DROPDOWN_TOGGLE).click();
        cy.get(SELECTORS.PLN_CHANNEL_OPTION).click();

        // 3. Click Confirm
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // 4. Assert successful navigation to the Draft order creation page
        cy.url().should('include', '/drafts/');
        cy.contains('h2', 'Create Draft Order').should('be.visible'); // Inferred draft creation title
    });

    it('C1.02: Select channel by typing in the autocomplete field (Default channel)', () => {
        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();

        // 1. Type the channel name
        cy.get(SELECTORS.CHANNEL_INPUT).type(TEST_CHANNEL_NAME_2);

        // 2. Select the matching option from the dropdown/listbox
        cy.get('div[role="listbox"]').contains(TEST_CHANNEL_NAME_2).click();

        // 3. Click Confirm
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        cy.url().should('include', '/drafts/');
    });

    it('C1.03: Attempt to Confirm without selecting a channel', () => {
        // This is a test for client-side required validation
        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();

        // 1. Click Confirm immediately
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // 2. Assert validation error
        cy.get(SELECTORS.CHANNEL_INPUT).parent().parent().should('contain', 'This field is required');

        // Modal should remain open
        cy.get(SELECTORS.CHANNEL_MODAL_TITLE).should('be.visible');
    });

    it('C1.04: Verify Back button in modal closes the modal', () => {
        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();

        // Click Back button
        cy.get(SELECTORS.BACK_BUTTON).click();

        // Assert modal is closed
        cy.get(SELECTORS.CHANNEL_MODAL_TITLE).should('not.exist');
        cy.url().should('include', '/orders'); // Still on the orders list page
    });

    it('C1.05: Input invalid, non-existent channel name', () => {
        // ECP: Invalid Search Term
        const invalidName = 'NonExistentChannel123';

        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_INPUT).type(invalidName);

        // Assert that the listbox/dropdown shows "No results found" or similar
        cy.get('div[role="listbox"]').contains('No results found').should('be.visible');

        // Click Confirm (should fail/show error if a selection is mandatory)
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // Assert modal remains open/error is shown
        cy.get(SELECTORS.CHANNEL_MODAL_TITLE).should('be.visible');
    });

    it('C1.06: Verify channel names in dropdown are visible and clickable', () => {
        // Test dropdown functionality
        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_DROPDOWN_TOGGLE).click();

        // Assert both known channels are in the list
        cy.get('div[role="listbox"]').contains(TEST_CHANNEL_NAME).should('be.visible');
        cy.get('div[role="listbox"]').contains(TEST_CHANNEL_NAME_2).should('be.visible');

        // Close modal
        cy.get(SELECTORS.BACK_BUTTON).click();
    });

    it('C1.07: Verify search input handles special characters', () => {
        const specialCharSearch = 'PLN-Chann@l';

        cy.get(SELECTORS.CREATE_ORDER_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_INPUT).type(specialCharSearch);

        // Assert that the correct channel is still filtered/suggested despite invalid input
        cy.get('div[role="listbox"]').contains(TEST_CHANNEL_NAME).should('be.visible');

        // Close modal
        cy.get(SELECTORS.BACK_BUTTON).click();
    });
});