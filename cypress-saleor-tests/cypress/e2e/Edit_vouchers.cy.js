/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_CUSTOMER_ROW: 'tbody tr:first-child a',

    // General Info Fields (Editable)
    CUST_FIRST_NAME_INPUT: 'input[name="firstName"]', // General Info section
    CUST_LAST_NAME_INPUT: 'input[name="lastName"]', // General Info section
    CUST_EMAIL_INPUT: 'input[name="email"]',

    // Actions & Flow
    NOTE_TEXTAREA: 'textarea[name="note"]',
    VIEW_ALL_ORDERS_BUTTON: 'button:contains("View all orders")',
    ADDRESS_INFO_MANAGE_BUTTON: '[data-test-id="manage-addresses"]',
    ISSUE_NEW_CARD_BUTTON: '[data-test-id="issue-new-gift-card"]',

    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    DELETE_BUTTON: '[data-test-id="button-bar-delete"]',

    // Address Modal Fields (Inferred)
    ADDR_MODAL_FIRST_NAME_INPUT: 'input[name="firstName"]',
    ADDR_MODAL_LINE1_INPUT: 'input[name="streetAddress1"]',
    ADDR_MODAL_CITY_INPUT: 'input[name="city"]',
    ADDR_MODAL_ZIP_INPUT: 'input[name="postalCode"]',
    ADDR_MODAL_SAVE_BUTTON: 'button:contains("Save")',

    // Gift Card Modal (Reused)
    ISSUE_CARD_MODAL_AMOUNT_INPUT: 'input[name="balanceAmount"]',
    ISSUE_CARD_MODAL_ISSUE_BUTTON: 'button[data-test-id="submit"]',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
};


describe('Customer Details: Comprehensive Edit and Delete Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/customers');
        // Navigate to the first customer (e.g., Lee Abbott)
        cy.get(SELECTORS.FIRST_CUSTOMER_ROW).click();
        cy.contains('Customer Details').should('be.visible');
    });

    // =================================================================
    // C1: CORE UPDATE (U) & VALIDATION - 10 Cases
    // =================================================================

    it('C1.01: Change Name and Last Name successfully', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear().type('Robert');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).clear().type('Cypress');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).should('have.value', 'Robert');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).should('have.value', 'Cypress');
    });

    it('C1.02: Attempt to save with invalid Email format', () => {
        const originalEmail = 'lee.abbott@example.com';
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type('invalidemail@');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');

        // Restore valid email to prevent subsequent test failures
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type(originalEmail);
        cy.get(SELECTORS.SAVE_BUTTON).click();
    });

    it('C1.03: Attempt to save with empty required Name fields', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear();
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Update Customer Note by appending new data', () => {
        const appendedNote = ' (Confirmed customer preferences on 2025-12-04.)';

        cy.get(SELECTORS.NOTE_TEXTAREA).type(appendedNote);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.NOTE_TEXTAREA).should('contain.value', appendedNote.trim());
    });

    it('C1.05: Toggle User Account Active status (Deactivate/Reactivate)', () => {
        // 1. Deactivate (click the checked box)
        cy.contains('User account active').prev('input[type="checkbox"]').uncheck({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');

        // 2. Reactivate
        cy.contains('User account active').prev('input[type="checkbox"]').check({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');
    });

    it('C1.06: Add a Public Metadata field and save', () => {
        cy.contains('Metadata').parent().find('button:contains("Add field")').click();

        // Input Key and Value
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('customer_tier');
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('GOLD');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('GOLD').should('be.visible');
    });

    it('C1.07: Attempt to save with empty Metadata key', () => {
        cy.contains('Metadata').parent().find('button:contains("Add field")').click();

        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('Temp Value');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error
        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Metadata key cannot be empty');

        cy.get('button:contains("Back")').click();
    });

    it('C1.08: Verify removing an existing Metadata field', () => {
        // NOTE: This test requires a metadata field to be present (from C1.06)
        cy.contains('customer_tier').siblings().find('button[aria-label="Delete metadata field"]').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('customer_tier').should('not.exist');
    });

    it('C1.09: Ensure Name fields handle maximum length updates', () => {
        const longName = 'L'.repeat(50);
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear().type(longName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).should('have.value', longName);
    });

    it('C1.10: Ensure email field handles maximum length updates (255 characters)', () => {
        const maxEmailPart = 'a'.repeat(240);
        const longEmail = `${maxEmailPart}@example.com`;

        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type(longEmail);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });


    // =================================================================
    // C2: ADDRESS MANAGEMENT & GIFTCARDS - 10 Cases
    // =================================================================

    it('C2.01: Verify "Manage" button opens the address list modal', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        cy.contains('Address Management').should('be.visible');

        cy.get('button:contains("Close")').click();
    });

    it('C2.02: Add a new address with full required US details via Manage modal', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();
        cy.get('button:contains("Add address")').click();

        cy.get(SELECTORS.ADDR_MODAL_FIRST_NAME_INPUT).type('Shipping');
        cy.get('input[name="lastName"]').type('Contact');
        cy.get(SELECTORS.ADDR_MODAL_LINE1_INPUT).type('500 New Cypress Rd');
        cy.get(SELECTORS.ADDR_MODAL_CITY_INPUT).type(NEW_ADDRESS_CITY);
        cy.get(SELECTORS.ADDR_MODAL_ZIP_INPUT).type('98101');

        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click(); // Save in the address modal

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Address added successfully');
    });

    it('C2.03: Attempt to save new address without mandatory Address Line 1', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();
        cy.get('button:contains("Add address")').click();

        cy.get(SELECTORS.ADDR_MODAL_FIRST_NAME_INPUT).type('MissingAddr');
        // Address Line 1 is left empty
        cy.get(SELECTORS.ADDR_MODAL_CITY_INPUT).type('TestCity');

        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_MODAL_LINE1_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.04: Verify setting a secondary address as default billing', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Find the second address row and click the "Set as default billing" button
        cy.get('tbody tr').eq(1).find('button:contains("Set as default billing")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Default address set');
    });

    it('C2.05: Successfully delete an existing secondary address', () => {
        // NOTE: This test should run on the address created in C2.02
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Find the Delete icon/button on the second row
        cy.get('tbody tr').eq(1).find('button[aria-label="Delete address"]').click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Address deleted successfully');
    });

    it('C2.06: Verify primary address cannot be deleted via the manage modal', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Assert the Delete button/icon for the primary (first) address is disabled or absent
        cy.get('tbody tr').first().find('button[aria-label="Delete address"]').should('not.exist');

        cy.get('button:contains("Close")').click();
    });

    it('C2.07: Verify "Issue new card" button opens the Gift Card modal', () => {
        cy.get(SELECTORS.ISSUE_NEW_CARD_BUTTON).click();

        cy.contains('Issue gift card').should('be.visible');

        // Assert customer is pre-selected (Lee Abbott)
        cy.contains('Lee Abbott').should('be.visible');

        cy.get('button:contains("Back")').click();
    });

    it('C2.08: Successfully issue a Gift Card directly from customer page', () => {
        cy.get(SELECTORS.ISSUE_NEW_CARD_BUTTON).click();

        cy.get(SELECTORS.ISSUE_CARD_MODAL_AMOUNT_INPUT).clear().type('25.00');

        cy.get(SELECTORS.ISSUE_CARD_MODAL_ISSUE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card issued successfully');
    });

    it('C2.09: Attempt to issue gift card with zero amount', () => {
        cy.get(SELECTORS.ISSUE_NEW_CARD_BUTTON).click();

        cy.get(SELECTORS.ISSUE_CARD_MODAL_AMOUNT_INPUT).clear().type('0');

        cy.get(SELECTORS.ISSUE_CARD_MODAL_ISSUE_BUTTON).click();

        cy.get('input[name="balanceAmount"]').parent().parent().should('contain', 'Amount must be greater than 0');
    });

    // =================================================================
    // C3: DELETE CUSTOMER (D) - 5 Cases
    // =================================================================

    it('C3.01: Successfully delete the customer (if no orders)', () => {
        // NOTE: Lee Abbott has "No orders found", making them safe to delete.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer deleted successfully');
        cy.url().should('include', '/customers');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click Back button to cancel deletion
        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Attempt to delete customer with existing orders (Server block)', () => {
        // NOTE: This test relies on Steven Walsh (Order #20) existing and having orders.
        cy.visit('/customers');
        cy.contains('Steven Walsh').click();

        cy.get(SELECTORS.DELETE_BUTTON).click();
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete customer with existing orders'); // Inferred error
    });

    it('C3.04: Verify overall Back button returns to the list view', () => {
        cy.get('button:contains("Back")').last().click(); // Last "Back" button on the page

        cy.url().should('include', '/customers');
    });

    it('C3.05: Attempt to change email to an existing customer email', () => {
        const existingEmail = 'vanessa.bird@example.com'; //

        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type(existingEmail);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'User with this email already exists');
    });
});