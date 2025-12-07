/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_VOUCHER_ROW: 'tbody tr:first-child a', // Click the link (Voucher Name)

    // General Information
    VOUCHER_NAME_INPUT: 'input[name="voucherName"]',
    VOUCHER_CODE_ADD_BUTTON: 'button:contains("Add code")', // Button to add new code

    // Discount Type Radios
    DISCOUNT_TYPE_FIXED: 'input[value="Fixed Amount"]',
    DISCOUNT_TYPE_PERCENTAGE: 'input[value="Percentage"]',
    DISCOUNT_TYPE_FREE_SHIPPING: 'input[value="Free Shipping"]',

    // Channel Value Inputs
    CHANNEL_USD_INPUT: 'div:contains("Default Channel") ~ div input[name*="Discount Value"]',

    // Minimum Requirements
    REQ_MIN_ORDER_VALUE: 'input[value="Minimum order value"]',
    MIN_ORDER_VALUE_INPUT: 'input[name="minOrderValue"]',

    // Usage Limits
    LIMIT_TIMES_TOTAL_CHECKBOX: 'input[name="limitTimesTotal"]',

    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    DELETE_BUTTON: 'button:contains("Delete")',
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
const NEW_MIN_ORDER_VALUE = '150';
const NEW_LIMIT = '200';
const UPDATED_CODE = `NEWCODE${UNIQUE_ID}`;

describe('Vouchers: Comprehensive Edit and Delete Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/discounts/vouchers');
        // Navigate to the first existing voucher (e.g., "Big order discount")
        cy.get(SELECTORS.FIRST_VOUCHER_ROW).click();
        cy.contains('General Information').should('be.visible');
    });

    // =================================================================
    // C1: CORE EDIT & PERSISTENCE (U) - 10 Cases
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

    it('C1.02: Attempt to save with empty Voucher Name', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.VOUCHER_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Change Discount Type to Percentage and save', () => {
        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();

        // Update value to a percentage (e.g., 20)
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('20');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Change Discount Type to Free Shipping and save', () => {
        cy.get(SELECTORS.DISCOUNT_TYPE_FREE_SHIPPING).click();

        // Assert that value input field disappears/is disabled
        cy.get(SELECTORS.CHANNEL_USD_INPUT).should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Attempt to save Percentage value over 100%', () => {
        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('150'); // Invalid percentage

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Percentage value cannot exceed 100');
    });

    it('C1.06: Add a new Voucher Code successfully', () => {
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get('input[name="code"]').type(UPDATED_CODE); // Input field inside modal
        cy.get('button:contains("Confirm")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Code added successfully'); // Inferred success toast
        cy.contains(UPDATED_CODE).should('be.visible');
    });

    it('C1.07: Attempt to add a duplicate Voucher Code', () => {
        const existingCode = 'DISCOUNT'; // Code visible in the table

        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get('input[name="code"]').type(existingCode);
        cy.get('button:contains("Confirm")').click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Voucher code already exists'); // Inferred error
    });

    it('C1.08: Delete an existing Voucher Code', () => {
        const existingCode = 'DISCOUNT'; // Code visible in the table

        // Find the Delete icon for the first code
        cy.contains(existingCode).siblings().find('button[aria-label="Delete code"]').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Code deleted successfully'); // Inferred success toast
        cy.contains(existingCode).should('not.exist');
    });

    it('C1.09: Attempt to change value to a negative number', () => {
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('-10');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).parent().parent().should('contain', 'Discount value cannot be negative');
    });

    it('C1.10: [Attempt to save without any Voucher Codes present', () => {
        // Requires deleting all existing codes first (assuming only one, DISCOUNT, exists)
        cy.contains('DISCOUNT').siblings().find('button[aria-label="Delete code"]').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'At least one voucher code is required');
    });

    // =================================================================
    // C2: MINIMUM REQUIREMENTS & USAGE LIMITS - 9 Cases
    // =================================================================

    it('C2.01: Update Minimum Order Value requirement with BVA data', () => {
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).clear().type(NEW_MIN_ORDER_VALUE);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('have.value', NEW_MIN_ORDER_VALUE);
    });

    it('C2.02: Apply and save Minimum Quantity requirement', () => {
        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get('input[name="minQuantity"]').type('10');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save Minimum Order Value requirement with empty value', () => {
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).parent().parent().should('contain', 'This field is required');

        // Restore to 'None'
        cy.get('input[value="None"]').click();
    });

    it('C2.04: Update total usage limit successfully', () => {
        cy.contains('Limit number of times this discount can be used in total').click();

        // Enter a limit value
        cy.get('input[name="totalUsageLimit"]').type(NEW_LIMIT);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Apply and save limit to one use per customer', () => {
        cy.contains('Limit to one use per customer').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get('input[name="limitOnePerCustomer"]').should('be.checked');
    });

    it('C2.06: Verify changing requirement type clears the previous value', () => {
        // 1. Set Min Order Value
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).type('100');

        // 2. Change to Min Quantity
        cy.get(SELECTORS.REQ_MIN_QTY).click();

        // 3. Assert Min Order Value input is now cleared
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('have.value', '');

        // Return to None
        cy.get('input[value="None"]').click();
    });

    it('C2.07: Attempt to save total usage limit with negative value', () => {
        cy.get('input[name="limitTimesTotal"]').click();
        cy.get('input[name="totalUsageLimit"]').clear().type('-10');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get('input[name="totalUsageLimit"]').parent().parent().should('contain', 'Usage limit cannot be negative');
    });

    it('C2.08: Attempt to save Minimum Quantity requirement with negative value', () => {
        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get('input[name="minQuantity"]').type('-1');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get('input[name="minQuantity"]').parent().parent().should('contain', 'Minimum quantity must be positive');
    });

    it('C2.09: Verify removing all usage limits (unchecking boxes)', () => {
        cy.contains('Limit to one use per customer').uncheck({ force: true });
        cy.contains('Limit number of times this discount can be used in total').uncheck({ force: true });

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C3: DELETE VOUCHER (D) - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the existing voucher', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Voucher deleted successfully');
        cy.url().should('include', '/discounts/vouchers');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Verify overall Back button returns to list view without saving', () => {
        cy.get('button:contains("Back")').last().click();

        cy.url().should('include', '/discounts/vouchers');
    });
});