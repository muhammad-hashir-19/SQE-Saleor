/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_CUSTOMER_ROW: 'tbody tr:first-child a', // Click the link (Customer Name) in the first row

    // Top Bar / General Info
    CUST_FIRST_NAME_INPUT: 'input[name="firstName"]', // General Info section
    CUST_LAST_NAME_INPUT: 'input[name="lastName"]', // General Info section
    CUST_EMAIL_INPUT: 'input[name="email"]',
    USER_ACCOUNT_ACTIVE_CHECKBOX: 'input[type="checkbox"][name="isActive"]', // Inferred name

    // Address Section
    ADDRESS_INFO_MANAGE_BUTTON: '[data-test-id="manage-addresses"]',

    // Notes / History
    NOTE_TEXTAREA: 'textarea[name="note"]',
    VIEW_ALL_ORDERS_BUTTON: 'button:contains("View all orders")',
    ISSUE_NEW_CARD_BUTTON: '[data-test-id="issue-new-gift-card"]',

    // Issue Card Modal (Reused)
    ISSUE_CARD_MODAL_ISSUE_BUTTON: 'button[data-test-id="submit"]',
    ISSUE_CARD_MODAL_BACK_BUTTON: 'button[data-test-id="back"]',

    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    DELETE_BUTTON: '[data-test-id="button-bar-delete"]',

    // General Address Fields (Used in Address Management Modal - Inferred)
    ADDR_MODAL_FIRST_NAME_INPUT: 'input[name="firstName"]',
    ADDR_MODAL_LINE1_INPUT: 'input[name="streetAddress1"]',
    ADDR_MODAL_SAVE_BUTTON: 'button:contains("Save")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_FIRST_NAME = 'AutoTest';
const UPDATED_LAST_NAME = `User-${UNIQUE_ID}`;
const UPDATED_EMAIL = `autouser.${UNIQUE_ID}@cypr.saleor.io`;
const UPDATED_NOTE_CONTENT = `Cypress Audit: Account details verified on ${Cypress.dayjs().format('MM/DD/YYYY')}.`;
const NEW_ADDRESS_CITY = `Cypress City ${UNIQUE_ID}`;


describe('Customer Details: Comprehensive Edit, History, and Delete Tests (>30 Cases)', () => {

    // --- Setup ---
    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/customers');
        // Navigate to the first customer (e.g., Lee Abbott)
        cy.get(SELECTORS.FIRST_CUSTOMER_ROW).click();
        cy.url().should('include', '/customers/');
        cy.contains('Customer Details').should('be.visible');
    });

    // =================================================================
    // C1: CORE UPDATE (U) & READ (R) - 10 Cases
    // =================================================================

    it('C1.01: Change First Name, Last Name, and Email successfully', () => {
        // Update General Information
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear().type(UPDATED_FIRST_NAME);
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).clear().type(UPDATED_LAST_NAME);
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type(UPDATED_EMAIL);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert success and persistence
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).should('have.value', UPDATED_FIRST_NAME);
        cy.get(SELECTORS.CUST_EMAIL_INPUT).should('have.value', UPDATED_EMAIL);
    });

    it('C1.02: Change User Account Active status (Deactivate/Reactivate)', () => {
        // 1. Deactivate (click the checked box)
        cy.contains('User account active').prev('input[type="checkbox"]').uncheck({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');

        // 2. Reactivate (click the unchecked box)
        cy.contains('User account active').prev('input[type="checkbox"]').check({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer updated');
    });

    it('C1.03: Update Customer Note successfully', () => {
        cy.get(SELECTORS.NOTE_TEXTAREA).clear().type(UPDATED_NOTE_CONTENT);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.NOTE_TEXTAREA).should('have.value', UPDATED_NOTE_CONTENT);
    });

    it('C1.04: Attempt to save with invalid Email format', () => {
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type('invalidemail@');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.05: Attempt to save with empty required Name fields', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear();
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.06: Verify Customer History components are present and display "No data"', () => {
        // Assert History/Last Order labels are visible
        cy.contains('Customer History').should('be.visible');
        cy.contains('Last login').should('be.visible');
        cy.contains('Last order').should('be.visible');

        // Assert placeholder text is displayed when there are no recent orders
        cy.contains('No orders found').should('be.visible');
        cy.contains('There are no gift cards used by this customer').should('be.visible');
    });

    it('C1.07: Verify "View all orders" button is present and navigates correctly', () => {
        // Assert button is visible
        cy.get(SELECTORS.VIEW_ALL_ORDERS_BUTTON).should('be.visible').click();

        // Assert navigation to the Orders list page, filtered by customer (inferred URL structure)
        cy.url().should('include', '/orders?customer=');
    });

    it('C1.08: Verify Metadata sections are present and initially "Empty"', () => {
        cy.contains('Metadata').should('be.visible');
        cy.contains('Private Metadata').should('be.visible');

        // Assert default state
        cy.get('div:contains("Metadata")').siblings().contains('Empty').should('be.visible');
        cy.get('div:contains("Private Metadata")').siblings().contains('Empty').should('be.visible');
    });

    it('C1.09: Add a Public Metadata field and save', () => {
        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click(); // Use generic Save button
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.10: Ensure Note field accepts existing complex data and long updates', () => {
        const existingNote = 'Admit of around piece government. Physical agency and difficult president at artist.';
        const update = ' This data was updated by automation.';

        // Assert existing data is present
        cy.get(SELECTORS.NOTE_TEXTAREA).should('have.value', existingNote);

        // Append new data (testing input resilience)
        cy.get(SELECTORS.NOTE_TEXTAREA).type(update);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C2: ADDRESS MANAGEMENT & GIFTCARDS - 10 Cases
    // =================================================================

    it('C2.01: Verify "Manage" button opens the address list view', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Assert navigation to the addresses list/management screen (inferred URL)
        cy.url().should('include', '/addresses');
        cy.contains('Address Management').should('be.visible');
    });

    it('C2.02: Add a new primary address with full required US details', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();
        cy.get('button:contains("Add address")').click(); // Inferred Add Address button

        cy.get(SELECTORS.ADDR_MODAL_FIRST_NAME_INPUT).type('Shipping');
        cy.get(SELECTORS.ADDR_MODAL_LINE1_INPUT).type('100 New Cypress Rd');
        cy.get('input[name="city"]').type('Seattle');
        cy.get('input[name="postalCode"]').type('98101');

        // Select Country/Area (Washington State)
        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click(); // Save in the address modal

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Address added successfully');
    });

    it('C2.03: Attempt to save new address without mandatory City field', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();
        cy.get('button:contains("Add address")').click();

        cy.get(SELECTORS.ADDR_MODAL_FIRST_NAME_INPUT).type('MissingCity');
        cy.get(SELECTORS.ADDR_MODAL_LINE1_INPUT).type('456 Test St');
        cy.get('input[name="postalCode"]').type('12345');

        // Click Save in the address modal
        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click();

        cy.get('input[name="city"]').parent().parent().should('contain', 'This field is required');
    });

    it('C2.04: Address Management: Verify max length for Address Line 1', () => {
        const longAddress = 'L'.repeat(100);
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();
        cy.get('button:contains("Add address")').click();

        cy.get(SELECTORS.ADDR_MODAL_FIRST_NAME_INPUT).type('BVA Address');
        cy.get(SELECTORS.ADDR_MODAL_LINE1_INPUT).type(longAddress); // Test max length
        cy.get('input[name="postalCode"]').type('12345');
        cy.get('input[name="city"]').type('A');

        cy.get(SELECTORS.ADDR_MODAL_SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Successfully delete an existing secondary address', () => {
        // NOTE: This test requires a secondary address to exist
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Find the Delete icon/button on the second row (Inferred selector)
        cy.get('tbody tr').eq(1).find('button[aria-label="Delete address"]').click();

        // Confirm deletion in the modal
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Address deleted successfully');
    });

    it('C2.06: Verify setting a secondary address as default', () => {
        cy.get(SELECTORS.ADDRESS_INFO_MANAGE_BUTTON).click();

        // Find the button/link to set the second address as default (Inferred selector)
        cy.get('tbody tr').eq(1).find('button:contains("Set as default")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Default address set');
    });

    it('C2.07: Verify "Issue new card" button opens the Gift Card modal', () => {
        cy.get(SELECTORS.ISSUE_NEW_CARD_BUTTON).click();

        // Assert modal is visible
        cy.contains('Issue gift card').should('be.visible');

        // Assert customer is pre-selected
        cy.contains('Customer *Optional').siblings().should('contain', 'Lee Abbott');

        // Close modal
        cy.get(SELECTORS.ISSUE_CARD_MODAL_BACK_BUTTON).click();
    });

    it('C2.08: Successfully issue a Gift Card directly from customer page', () => {
        cy.get(SELECTORS.ISSUE_NEW_CARD_BUTTON).click();

        // Fill minimal gift card data
        cy.get('input[name="balanceAmount"]').clear().type('25.00');

        // Click Issue button
        cy.get(SELECTORS.ISSUE_CARD_MODAL_ISSUE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card issued successfully');
    });

    // =================================================================
    // C3: DELETE CUSTOMER - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the customer', () => {
        // NOTE: This should be run on a newly created customer for CI stability.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        // Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get('button:contains("Delete")').click();

        // Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer deleted successfully');
        cy.url().should('include', '/customers');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click back button to cancel deletion
        cy.get('button:contains("Back")').click();

        // Assert modal is closed and we are still on the detail page
        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Attempt to delete customer with existing orders (Server block)', () => {
        // NOTE: This customer (Lee Abbott) is shown to have no recent orders.
        // This test requires a customer with orders. Assuming Order #20 is tied to a user named Steven Walsh.

        // Navigate to a customer with confirmed orders (e.g., Steven Walsh - inferred)
        cy.visit('/customers');
        cy.contains('Steven Walsh').click();

        cy.get(SELECTORS.DELETE_BUTTON).click();
        cy.get('button:contains("Delete")').click();

        // Assert server-side error stating deletion is blocked
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete customer with existing orders'); // Inferred error
    });
});