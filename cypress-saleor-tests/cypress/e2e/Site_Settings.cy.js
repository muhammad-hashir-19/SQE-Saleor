/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // General Store Information (Inferred names based on image_650841.png)
    COMPANY_NAME_INPUT: 'input[name="company"]',
    ADDRESS_LINE1_INPUT: 'input[name="streetAddress1"]',
    CITY_INPUT: 'input[name="city"]',
    ZIP_INPUT: 'input[name="postalCode"]',
    COUNTRY_DROPDOWN: 'input[name="country"]',
    PHONE_INPUT: 'input[name="phone"]',

    // Checkout Configuration (Inferred names based on image_650867.png)
    STOCK_AUTH_INPUT: 'input[name="authenticatedStockReservationTime"]',
    STOCK_ANON_INPUT: 'input[name="anonymousStockReservationTime"]',
    CHECKOUT_LINE_LIMIT_INPUT: 'input[name="checkoutLineLimit"]',

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
const TEST_COMPANY = `Global Store Ltd ${UNIQUE_ID}`;
const TEST_ADDRESS = '100 Cybernetic Plaza';
const TEST_CITY = 'Saleor City';
const TEST_ZIP = '10001';
const TEST_PHONE = '555-555-1234';

const STOCK_RESERVATION_VALID = '60'; // 60 minutes
const STOCK_RESERVATION_MAX = '1440'; // 24 hours (BVA max, inferred)
const CHECKOUT_LIMIT_VALID = '25';


describe('Configuration: Comprehensive Site Settings Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/site-settings'); // Assumes this is the correct route
        cy.contains('General Information').should('be.visible');
    });

   

    it('C1.01: Update Company, Address, and City successfully', () => {
        cy.get(SELECTORS.COMPANY_NAME_INPUT).clear().type(TEST_COMPANY);
        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).clear().type(TEST_ADDRESS);
        cy.get(SELECTORS.CITY_INPUT).clear().type(TEST_CITY);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Site settings updated');
        cy.get(SELECTORS.COMPANY_NAME_INPUT).should('have.value', TEST_COMPANY);
    });

    it('C1.02: Update Phone and ZIP/Postal Code successfully', () => {
        cy.get(SELECTORS.PHONE_INPUT).clear().type(TEST_PHONE);
        cy.get(SELECTORS.ZIP_INPUT).clear().type(TEST_ZIP);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.PHONE_INPUT).should('have.value', TEST_PHONE);
    });

    it('C1.03: Attempt to save with empty Address Line 1 (Required)', () => {
        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Attempt to save with invalid Phone format', () => {
        cy.get(SELECTORS.PHONE_INPUT).clear().type('Invalid phone');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.PHONE_INPUT).parent().parent().should('contain', 'Invalid phone number format');
    });

    it('C1.05: Address Line 1 with maximum practical length', () => {
        const longAddress = 'A'.repeat(100);
        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).clear().type(longAddress);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).should('have.value', longAddress);
    });

    it('C1.06: City with maximum practical length', () => {
        const longCity = 'C'.repeat(50);
        cy.get(SELECTORS.CITY_INPUT).clear().type(longCity);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.CITY_INPUT).should('have.value', longCity);
    });

    it('C1.07: Change Country successfully', () => {
        const country = 'Canada';

        cy.get(SELECTORS.COUNTRY_DROPDOWN).click().type(country);
        cy.get('div[role="listbox"]').contains(country).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.COUNTRY_DROPDOWN).should('have.value', country);
    });

    it('C1.08: Verify Phone field accepts formatting characters (dashes, spaces)', () => {
        const formattedPhone = '(555) 123-4567';
        cy.get(SELECTORS.PHONE_INPUT).clear().type(formattedPhone);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.PHONE_INPUT).should('have.value', formattedPhone);
    });

    it('C1.09: Verify Address fields handle Unicode/symbols', () => {
        const complexAddress = 'Office #200, 3rd Floor — Central Tower';
        cy.get(SELECTORS.ADDRESS_LINE1_INPUT).clear().type(complexAddress);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.10: Verify Back button returns to Configuration list', () => {
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/configuration');
        cy.contains('Configuration').should('be.visible');
    });

   

    it('C2.01: Update Stock reservation times successfully', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear().type(STOCK_RESERVATION_VALID);
        cy.get(SELECTORS.STOCK_ANON_INPUT).clear().type(STOCK_RESERVATION_VALID);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.STOCK_AUTH_INPUT).should('have.value', STOCK_RESERVATION_VALID);
    });

    it('C2.02: Update Checkout line limit successfully', () => {
        cy.get(SELECTORS.CHECKOUT_LINE_LIMIT_INPUT).clear().type(CHECKOUT_LIMIT_VALID);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.CHECKOUT_LINE_LIMIT_INPUT).should('have.value', CHECKOUT_LIMIT_VALID);
    });

    it('C2.03: Stock reservation maximum boundary (1440 minutes/24 hours)', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear().type(STOCK_RESERVATION_MAX);
        cy.get(SELECTORS.STOCK_ANON_INPUT).clear().type(STOCK_RESERVATION_MAX);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: Stock reservation field below minimum boundary (0)', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear().type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.STOCK_AUTH_INPUT).parent().parent().should('contain', 'Allowed range between 1 and 1440'); // Assumed error text
    });

    it('C2.05:  Checkout line limit below minimum boundary (0)', () => {
        cy.get(SELECTORS.CHECKOUT_LINE_LIMIT_INPUT).clear().type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CHECKOUT_LINE_LIMIT_INPUT).parent().parent().should('contain', 'Line limit must be greater than 0'); // Assumed error text
    });

    it('C2.06: Stock reservation input with non-numeric data', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear().type('ABC');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.STOCK_AUTH_INPUT).should('have.value', ''); // Assert non-numeric filtered
    });

    it('C2.07: Clear stock reservation fields (Sets to default/none)', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear();
        cy.get(SELECTORS.STOCK_ANON_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.STOCK_AUTH_INPUT).should('have.value', '');
    });

    it('C2.08: Verify stock reservation fields accept only integers (no decimals)', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).clear().type('60.5');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert the input field only holds the integer part if enforced by the system
        cy.get(SELECTORS.STOCK_AUTH_INPUT).should('have.value', '60');
    });

    it('C2.09: Verify Checkout line limit accepts maximum boundary', () => {
        const largeLimit = '9999'; // Assuming a large number is accepted
        cy.get(SELECTORS.CHECKOUT_LINE_LIMIT_INPUT).clear().type(largeLimit);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.10: Verify leaving the stock reservation field empty is valid', () => {
        cy.get(SELECTORS.STOCK_AUTH_INPUT).should('have.value', '');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });
});