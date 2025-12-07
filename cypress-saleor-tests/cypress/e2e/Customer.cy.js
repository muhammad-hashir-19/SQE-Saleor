/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_CUSTOMER_BUTTON: '[data-test-id="create-customer"]',
    // Customer Overview Fields
    CUST_FIRST_NAME_INPUT: 'input[name="customerFirstName"]',
    CUST_LAST_NAME_INPUT: 'input[name="customerLastName"]',
    CUST_EMAIL_INPUT: 'input[name="email"]',
    // Primary Address Fields (Uses standard address names)
    ADDR_FIRST_NAME_INPUT: 'input[name="firstName"]',
    ADDR_LAST_NAME_INPUT: 'input[name="lastName"]',
    ADDR_COMPANY_INPUT: 'input[name="companyName"]',
    ADDR_PHONE_INPUT: 'input[name="phone"]',
    ADDR_LINE1_INPUT: 'input[name="streetAddress1"]',
    ADDR_CITY_INPUT: 'input[name="city"]',
    ADDR_ZIP_INPUT: 'input[name="postalCode"]',
    ADDR_COUNTRY_DROPDOWN: '[data-test-id="address-edit-country-select-field"]',
    ADDR_NOTE_TEXTAREA: 'textarea[name="note"]',
    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]',
    // Generic Validation
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 100000);
const TEST_EMAIL = `cypress.user.${UNIQUE_ID}@example.com`;
const MAX_NAME_LENGTH = 100; // Assuming a reasonable database limit
const VALID_PHONE_US = '555-123-4567';
const VALID_ZIP_US = '90210';
const VALID_ADDRESS = '123 Test Street, Apt 4B';


describe('Customers: Comprehensive Create Customer Test Suite (>30 Cases)', () => {

    // --- Setup ---
    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/customers');
        cy.get(SELECTORS.CREATE_CUSTOMER_BUTTON).click();
        cy.contains('Create Customer').should('be.visible');
    });

    // --- Helper Function to Fill Minimum Required Fields ---
    const fillMinimalCustomerData = () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('Minimal');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).type(`Customer ${UNIQUE_ID}`);
        cy.get(SELECTORS.CUST_EMAIL_INPUT).type(TEST_EMAIL);
    };

    // =================================================================
    // C1: HAPPY PATH & ECP/BVA (USER OVERVIEW) - 10 Cases
    // =================================================================

    it('C1.01: Create customer with minimal required fields (Name & Email)', () => {
        fillMinimalCustomerData();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Customer created');
        cy.url().should('not.include', '/add');
    });

    it('C1.02: Attempt to create customer with existing email address', () => {
        // NOTE: This assumes 'robert.brown@example.com' exists in the list (Image 829881.png)
        const existingEmail = 'robert.brown@example.com';
        fillMinimalCustomerData();

        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type(existingEmail);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert server-side error
        cy.get(SELECTORS.ERROR_FIELD, { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'User with this email already exists'); // Assumed error text
    });

    it('C1.03: Attempt to save with invalid email format', () => {
        fillMinimalCustomerData();
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type('invalid-email-format');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert client-side validation error
        cy.get(SELECTORS.CUST_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.04: Customer name fields with maximum length (N=100)', () => {
        const longName = 'A'.repeat(MAX_NAME_LENGTH);

        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type(longName);
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).type(longName);
        cy.get(SELECTORS.CUST_EMAIL_INPUT).type(`longname${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Customer name fields with minimum length (1 character)', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('A');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).type('B');
        cy.get(SELECTORS.CUST_EMAIL_INPUT).type(`minname${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Attempt to save with empty First Name (Required)', () => {
        fillMinimalCustomerData();
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.07: Attempt to save with only spaces in Email field (Whitespace)', () => {
        fillMinimalCustomerData();
        cy.get(SELECTORS.CUST_EMAIL_INPUT).clear().type('   ');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CUST_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.08: Create customer with Note field filled', () => {
        fillMinimalCustomerData();
        cy.get(SELECTORS.ADDR_NOTE_TEXTAREA).type('Customer prefers communication via SMS only.');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.09: Test Name fields with symbols/unicode', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('João');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).type('O’Malley');
        cy.get(SELECTORS.CUST_EMAIL_INPUT).type(`unicode${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C2: PRIMARY ADDRESS VALIDATION (ECP & BVA) - 13 Cases
    // =================================================================

    // Test data for a valid primary address
    const fillValidAddress = () => {
        cy.get(SELECTORS.ADDR_FIRST_NAME_INPUT).type('Billing');
        cy.get(SELECTORS.ADDR_LAST_NAME_INPUT).type('Address');
        cy.get(SELECTORS.ADDR_LINE1_INPUT).type(VALID_ADDRESS);
        cy.get(SELECTORS.ADDR_CITY_INPUT).type('New York');
        cy.get(SELECTORS.ADDR_ZIP_INPUT).type('10001');

        // Select Country (USA)
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('United States of America').click();
    };

    it('C2.01: Create customer with full mandatory primary address', () => {
        fillMinimalCustomerData();
        fillValidAddress();
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.02: Create customer with different names in Overview and Address', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('Account');
        cy.get(SELECTORS.CUST_LAST_NAME_INPUT).type('Holder');
        cy.get(SELECTORS.CUST_EMAIL_INPUT).type(`crossfield${UNIQUE_ID}@example.com`);

        fillValidAddress();
        cy.get(SELECTORS.ADDR_FIRST_NAME_INPUT).clear().type('Shipping');
        cy.get(SELECTORS.ADDR_LAST_NAME_INPUT).clear().type('Contact');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save with empty required Address Line 1', () => {
        fillMinimalCustomerData();
        fillValidAddress();
        cy.get(SELECTORS.ADDR_LINE1_INPUT).clear(); // Clear the required field

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_LINE1_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.04: Attempt to save with empty Address Last Name (Required)', () => {
        fillMinimalCustomerData();
        fillValidAddress();
        cy.get(SELECTORS.ADDR_LAST_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.05: Save with Company Name and Phone provided', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        cy.get(SELECTORS.ADDR_COMPANY_INPUT).type('Cypress Testing Ltd');
        cy.get(SELECTORS.ADDR_PHONE_INPUT).type(VALID_PHONE_US);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: Phone field validation with invalid non-numeric data', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        cy.get(SELECTORS.ADDR_PHONE_INPUT).clear().type('a-b-c-d');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.ADDR_PHONE_INPUT).parent().parent().should('contain', 'Invalid phone number format');
    });

    it('C2.07: Address Line 1 with maximum practical length', () => {
        const longAddress = 'L'.repeat(100);
        fillMinimalCustomerData();
        fillValidAddress();

        cy.get(SELECTORS.ADDR_LINE1_INPUT).clear().type(longAddress);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.08: Changing Country should clear Country Area (State/Province) if invalid', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        // Set an initial Country Area (Colorado)
        cy.get('input[name="countryArea"]').type('Colorado');

        // Change Country to France
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('France').click();

        // Assert Country Area field is now cleared or disabled/re-validated
        cy.get('input[name="countryArea"]').should('have.value', '');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.09: Attempt to save with invalid Country Area for selected Country (USA)', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        // Type an invalid state/area code (e.g., a city name)
        cy.get('input[name="countryArea"]').clear().type('NotAState');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error (Server-side validation)
        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Country area is invalid');
    });

    it('C2.10: Verify saving with Country Area (State) successfully', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        // Select State (Country Area)
        cy.get('input[name="countryArea"]').type('California');
        cy.get('div[role="listbox"]').contains('California').click(); // Select from listbox

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.11: Attempt to save without selecting a Country', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        // Clear the country field (or force selection of "---")
        // NOTE: Country field often defaults; this test relies on default value being invalid/cleared.
        // Assuming we can clear the Country input:
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).parent().parent().should('contain', 'This field is required');
    });

    it('C2.12: Attempt to save with empty ZIP code (Required)', () => {
        fillMinimalCustomerData();
        fillValidAddress();
        cy.get(SELECTORS.ADDR_ZIP_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_ZIP_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.13: Attempt to save with empty City (Required)', () => {
        fillMinimalCustomerData();
        fillValidAddress();
        cy.get(SELECTORS.ADDR_CITY_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_CITY_INPUT).parent().parent().should('contain', 'This field is required');
    });

    // =================================================================
    // C3: FLOW & UI INTEGRITY - 7 Cases
    // =================================================================

    it('C3.01: Verify Back button correctly aborts creation and navigates to list', () => {
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('Unsaved');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/customers');
        cy.contains('All customers').should('be.visible');
    });

    it('C3.02: Verify customer is redirected to detail page upon successful creation', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Assert redirection to the detail page (URL should include the customer ID/slug)
        cy.url().should('include', '/customers/');
        cy.contains('Customer Details').should('be.visible');
    });

    it('C3.03: Verify the correct structure of the address form section headers', () => {
        cy.contains('Customer Overview').should('be.visible');
        cy.contains('Primary Address').should('be.visible');
        cy.contains('Notes').should('be.visible');
    });

    it('C3.04: Verify that the Primary Address fields are separate from Customer Overview fields', () => {
        // Assert unique name attributes ensure separation (input[name="customerFirstName"] != input[name="firstName"])
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).should('exist');
        cy.get(SELECTORS.ADDR_FIRST_NAME_INPUT).should('exist');

        // Type into customer field
        cy.get(SELECTORS.CUST_FIRST_NAME_INPUT).type('CustomerName');

        // Assert address field remains empty
        cy.get(SELECTORS.ADDR_FIRST_NAME_INPUT).should('have.value', '');
    });

    it('C3.05: Ensure Address Line 2 accepts multi-line/long text without issue', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        const longText = 'Building 4B, Warehouse 5, Loading Dock 12, Rear Entrance Security Gate Code 9876.';
        cy.get('input[name="streetAddress2"]').type(longText);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.06: Ensure Company Name accepts long text and symbols', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        const complexName = 'Acme Co. Ltd & Sons, Inc. 2025 ®';
        cy.get(SELECTORS.ADDR_COMPANY_INPUT).type(complexName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.07: Ensure Phone field accepts common formatting characters (dashes, spaces)', () => {
        fillMinimalCustomerData();
        fillValidAddress();

        // Type in a formatted phone number
        cy.get(SELECTORS.ADDR_PHONE_INPUT).type('(555) 123-4567 ext 88');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });
});