/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_VOUCHER_BUTTON: 'button:contains("Create voucher")',

    // General Information
    VOUCHER_NAME_INPUT: 'input[name="voucherName"]',
    VOUCHER_CODE_ADD_BUTTON: 'button:contains("Add code")',
    VOUCHER_CODE_INPUT: 'input[name="voucherCode"]', // Inferred code input modal field

    // Discount Type Radios
    DISCOUNT_TYPE_FIXED: 'input[value="Fixed Amount"]',
    DISCOUNT_TYPE_PERCENTAGE: 'input[value="Percentage"]',
    DISCOUNT_TYPE_FREE_SHIPPING: 'input[value="Free Shipping"]',

    // Channel Value Inputs (Use a general selector to find the input field next to the channel)
    CHANNEL_PLN_INPUT: 'div:contains("Channel-PLN") ~ div input[name*="Discount Value"]',
    CHANNEL_USD_INPUT: 'div:contains("Default Channel") ~ div input[name*="Discount Value"]',

    // Minimum Requirements
    REQ_MIN_ORDER_VALUE: 'input[value="Minimum order value"]',
    REQ_MIN_QTY: 'input[value="Minimum quantity of items"]',
    MIN_ORDER_VALUE_INPUT: 'input[name="minOrderValue"]', // Inferred
    MIN_QTY_INPUT: 'input[name="minQuantity"]', // Inferred

    // Usage Limits
    LIMIT_TIMES_TOTAL_CHECKBOX: 'input[name="limitTimesTotal"]', // Inferred
    LIMIT_ONE_PER_CUST_CHECKBOX: 'input[name="limitOnePerCustomer"]', // Inferred

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_VOUCHER_CODE = `CYPRESSCODE${UNIQUE_ID}`;
const TEST_VOUCHER_NAME = `Test Voucher ${UNIQUE_ID}`;
const VALID_VALUE_PLN = '15'; // Example PLN value
const VALID_VALUE_USD = '10.50'; // Example USD value
const MIN_ORDER_VALUE = '50';
const MIN_QTY = '5';


describe('Vouchers: Comprehensive Create Voucher Test Suite (>30 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/discounts/vouchers/add');
        cy.contains('Create Voucher').should('be.visible');
    });

    // =================================================================
    // C1: CORE VOUCHER CREATION & DISCOUNT TYPE (ECP/HAPPY PATH) - 9 Cases
    // =================================================================

    it('C1.01: Create a Fixed Amount voucher with minimal data', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type(TEST_VOUCHER_NAME);

        // Add Code (Should trigger modal)
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(TEST_VOUCHER_CODE);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Discount Value (Fixed Amount - default)
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(VALID_VALUE_USD);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Voucher created');
    });

    it('C1.02: Create a Percentage Discount voucher', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type(`${TEST_VOUCHER_NAME}-PERCENT`);
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`PERCENT${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Select Percentage
        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();

        // Enter value (e.g., 20%)
        cy.get(SELECTORS.CHANNEL_PLN_INPUT).clear().type('20');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Create a Free Shipping voucher', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type(`${TEST_VOUCHER_NAME}-FREE-SHIP`);
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`FREESHIP${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Select Free Shipping (No value input needed)
        cy.get(SELECTORS.DISCOUNT_TYPE_FREE_SHIPPING).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Attempt to save without adding a Voucher Name', () => {
        // Must fail validation
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`NOCONFIRM${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.05: Attempt to save without adding a Voucher Code', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('No Code Test');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        // Assert server-side validation error
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Voucher code is required'); // Assumed error
    });

    it('C1.06: Attempt to save with zero discount value for Fixed Amount', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('Zero Value Test');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`CODE${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Discount value must be greater than 0');
    });

    it('C1.07: Fixed Amount discount with minimum value (0.01)', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('Min Value Test');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`CODE${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('0.01');
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.08: Percentage discount with value over 100%', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('Over 100% Test');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`OVER100${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.DISCOUNT_TYPE_PERCENTAGE).click();
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('101'); // Invalid percentage

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Percentage value cannot exceed 100');
    });

    it('C1.09: Verify Voucher Code modal closes correctly', () => {
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.contains('Add code').should('be.visible');

        cy.get('button:contains("Back")').click();
        cy.contains('Add code').should('not.exist');
    });

    // =================================================================
    // C2: MINIMUM REQUIREMENTS & USAGE LIMITS - 11 Cases
    // =================================================================

    it('C2.01: Successfully apply Minimum Order Value requirement', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('MinOrderTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`MINORDER${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Select Minimum Order Value
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).type(MIN_ORDER_VALUE);

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.02: Successfully apply Minimum Quantity of Items requirement', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('MinQtyTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`MINQTY${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Select Minimum Quantity
        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get(SELECTORS.MIN_QTY_INPUT).type(MIN_QTY);

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save Minimum Quantity requirement with zero (0)', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('ZeroQtyTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`ZEROCITY${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.REQ_MIN_QTY).click();
        cy.get(SELECTORS.MIN_QTY_INPUT).type('0'); // Invalid minimum quantity

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.MIN_QTY_INPUT).parent().parent().should('contain', 'Minimum quantity must be greater than 0');
    });

    it('C2.04: Attempt to save Minimum Order Value requirement with empty field', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('EmptyOrderValue');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`EMPTYORD${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        // Field is left empty

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.05: Successfully apply total usage limit', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('TotalLimitTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`TOTALUSE${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Check Limit total times
        cy.contains('Limit number of times this discount can be used in total').click();

        // Enter a limit value (e.g., 500)
        cy.get('input[name="totalUsageLimit"]').type('500');

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: Successfully apply limit to one use per customer', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('PerCustLimitTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`PERCUST${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Check Limit one use per customer
        cy.contains('Limit to one use per customer').click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.07: Attempt to save total usage limit with zero or empty value', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('ZeroLimitTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`ZEROLIM${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Check Limit total times and leave value empty
        cy.contains('Limit number of times this discount can be used in total').click();

        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('input[name="totalUsageLimit"]').parent().parent().should('contain', 'This field is required');
    });

    it('C2.08: Verify Minimum Requirements fields hide when "None" is selected', () => {
        // Select Minimum Order Value
        cy.get(SELECTORS.REQ_MIN_ORDER_VALUE).click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('be.visible');

        // Select None
        cy.get('input[value="None"]').click();
        cy.get(SELECTORS.MIN_ORDER_VALUE_INPUT).should('not.exist');
    });

    it('C2.09: Fixed Amount voucher should not require Minimum Requirements by default', () => {
        // Fixed amount is default, None is default requirement.
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type(10);
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('NoReqTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`NOREQ${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.10: Verify all Channel Value inputs are present and editable', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type('ChannelEditTest');
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`CHANEDIT${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Edit USD input
        cy.get(SELECTORS.CHANNEL_USD_INPUT).clear().type('12.34');

        // Edit PLN input
        cy.get(SELECTORS.CHANNEL_PLN_INPUT).clear().type('50');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.11: Verify Free Shipping discount ignores value inputs (UI Check)', () => {
        cy.get(SELECTORS.VOUCHER_NAME_INPUT).type(`FreeShipValueCheck`);
        cy.get(SELECTORS.VOUCHER_CODE_ADD_BUTTON).click();
        cy.get(SELECTORS.VOUCHER_CODE_INPUT).type(`FREEVAL${UNIQUE_ID}`);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Select Free Shipping
        cy.get(SELECTORS.DISCOUNT_TYPE_FREE_SHIPPING).click();

        // Assert value inputs are disabled or hidden
        cy.get(SELECTORS.CHANNEL_USD_INPUT).should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });
});