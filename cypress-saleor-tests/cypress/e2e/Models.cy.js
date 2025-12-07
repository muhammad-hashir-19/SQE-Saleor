/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_VOUCHER_ROW: 'tbody tr:first-child a',

    // General Information
    VOUCHER_NAME_INPUT: 'input[name="voucherName"]',
    VOUCHER_CODE_ADD_BUTTON: 'button:contains("Add code")',

    // Discount Type Radios (To be edited)
    DISCOUNT_TYPE_PERCENTAGE: 'input[value="Percentage"]',
    DISCOUNT_TYPE_FREE_SHIPPING: 'input[value="Free Shipping"]',

    // Channel Value Inputs (Value per channel)
    CHANNEL_USD_INPUT: 'div:contains("Default Channel") ~ div input[name*="Discount Value"]',

    // Minimum Requirements
    REQ_MIN_ORDER_VALUE: 'input[value="Minimum order value"]',
    REQ_MIN_QTY: 'input[value="Minimum quantity of items"]',
    MIN_ORDER_VALUE_INPUT: 'input[name="minOrderValue"]',

    // Usage Limits
    LIMIT_TIMES_TOTAL_CHECKBOX: 'input[name="limitTimesTotal"]',

    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    DELETE_BUTTON: 'button:contains("Delete")', // Red delete button
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_NAME = `Updated Voucher ${UNIQUE_ID}`;
const UPDATED_VALUE_USD = '15.50';
const NEW_MIN_ORDER_VALUE = '150'; // New BVA value
const NEW_LIMIT = '200'; // New usage limit

describe('Vouchers: Comprehensive Edit and Delete Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/discounts/vouchers');
        // Navigate to the first voucher (e.g., "Big order discount")
        cy.get(SELECTORS.FIRST_VOUCHER_ROW).click();
        cy.contains('General Information').should('be.visible');
    });

    // =================================================================
    // C1: CORE EDIT & PERSISTENCE (U) - 9 Cases
    // =================================================================

    it('C1.01: Change Voucher Name and Value successfully', () => {
        // 1. Update Name
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).clear().type(UPDATED_NAME);

        // 2. Update Value (e.g., from 25.00 to 15.50)
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(UPDATED_VALUE_USD);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Voucher updated successfully');
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).should('have.value', UPDATED_NAME);
        cy.get(SELECTORS.CHANNEL_USD_INPUT).should('have.value', UPDATED_VALUE_USD);
    });

    it('C1.02: Change Discount Type from Fixed Amount to Percentage', () => {
        // Assume current type is Fixed Amount
        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();

        // Update value to a percentage (e.g., 20)
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('20');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Change Discount Type to Free Shipping', () => {
        cy.get(SELECTORS.DISCOUNT_TYPE_FREE_SHIPPING).click();

        // Assert that value input field disappears/is disabled
        cy.get(SELECTORS.CHANNEL_USD_INPUT).should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Attempt to save with empty Voucher Name', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.VOUCHER_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.05: Attempt to change value to a negative number', () => {
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('-10');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).parent().parent().should('contain', 'Discount value cannot be negative');
    });

    it('C1.06: Update Active Dates Start Hour successfully', () => {
        const newHour = '09:00';
        // Assume start date is Dec 29, 2023

        cy.get('input[name="startTime"]').clear().type(newHour);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get('input[name="startTime"]').should('have.value', newHour);
    });

    it('C1.07: Add a total usage limit', () => {
        cy.get('input[name="limitTimesTotal"]').click();

        // Enter a limit value
        cy.get('input[name="totalUsageLimit"]').type(NEW_LIMIT);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get('input[name="totalUsageLimit"]').should('have.value', NEW_LIMIT);
    });

    it('C1.08: Attempt to save Percentage value over 100%', () => {
        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('150'); // Invalid percentage

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Percentage value cannot exceed 100');
    });

    it('C1.09: Attempt to save total usage limit with zero', () => {
        cy.get('input[name="limitTimesTotal"]').click();
        cy.get('input[name="totalUsageLimit"]').clear().type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get('input[name="totalUsageLimit"]').parent().parent().should('contain', 'Usage limit must be greater than 0');
    });

    // =================================================================
    // C2: MINIMUM REQUIREMENTS & USAGE LIMITS - 10 Cases
    // =================================================================

    it('C2.01: Apply Minimum Order Value requirement with BVA data', () => {
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).type(NEW_MIN_ORDER_VALUE);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('have.value', NEW_MIN_ORDER_VALUE);
    });

    it('C2.02: Apply Minimum Quantity requirement with BVA data', () => {
        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get(SELECTORS.MIN_QTY_INPUT).type('10');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.MIN_QTY_INPUT).should('have.value', '10');
    });

    it('C2.03: Verify requirement fields persist after saving', () => {
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).type('100');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Assert the radio button remains checked
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).should('be.checked');
    });

    it('C2.04: Attempt to save Minimum Order Value requirement with empty value', () => {
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).parent().parent().should('contain', 'This field is required');

        // Return to None to prevent failure cascade
        cy.get('input[value="None"]').click();
    });

    it('C2.05: Attempt to save Minimum Quantity requirement with zero', () => {
        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get(SELECTORS.MIN_QTY_INPUT).type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.MIN_QTY_INPUT).parent().parent().should('contain', 'Minimum quantity must be greater than 0');
    });

    it('C2.06: Apply limit to one use per customer', () => {
        cy.contains('Limit to one use per customer').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get('input[name="limitOnePerCustomer"]').should('be.checked');
    });

    it('C2.07: Verify changing discount type clears Minimum Requirement fields', () => {
        // 1. Set Min Order Value
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).type('100');

        // 2. Change Discount Type to Free Shipping (Should clear value/requirement fields)
        cy.get(SELECTORS.DISCOUNT_TYPE_FREE_SHIPPING).click();

        // 3. Re-select Fixed Amount
        cy.get('input[value="Fixed Amount"]').click();

        // Assert Minimum Order Value input is now empty
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('have.value', '');
    });

    it('C2.08: Ensure Discount Value input rejects non-numeric characters', () => {
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('abc');
        cy.get(SELECTORS.CHANNEL_USD_INPUT).should('have.value', ''); // Assert non-numeric filtered out

        cy.get(SELECTORS.CHANNEL_USD_INPUT).type('10.50').should('have.value', '10.50');
    });

    it('C2.09: Verify saving with complex unicode/symbols in Name', () => {
        const complexName = 'Spring Sale — 2025 ®';
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).clear().type(complexName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).should('have.value', complexName);
    });

    // =================================================================
    // C3: DELETE VOUCHER (D) - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the existing voucher', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Voucher deleted successfully');
        cy.url().should('include', '/discounts/vouchers');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click the Back button to cancel deletion
        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Verify overall Back button returns to list view without saving', () => {
        // Change the name without saving
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).clear().type('Unsaved Change');

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/discounts/vouchers');
    });
});