/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_WAREHOUSE_BUTTON: 'button:contains("Create Warehouse")',
    FIRST_WAREHOUSE_ROW: 'tbody tr:first-child a',

    // Create/Edit Form Fields
    WAREHOUSE_NAME_INPUT: 'input[name="warehouseName"]', // Inferred name
    WAREHOUSE_EMAIL_INPUT: 'input[name="email"]', // Inferred name

    // Address Information (Inferred names from other address forms)
    ADDR_COMPANY_INPUT: 'input[name="companyName"]',
    ADDR_PHONE_INPUT: 'input[name="phone"]',
    ADDR_LINE1_INPUT: 'input[name="streetAddress1"]',
    ADDR_CITY_INPUT: 'input[name="city"]',
    ADDR_ZIP_INPUT: 'input[name="postalCode"]',
    ADDR_COUNTRY_DROPDOWN: 'input[name="country"]', // Targets the input combobox by name

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_WAREHOUSE_NAME = `Warehouse R-5 ${UNIQUE_ID}`;
const TEST_WAREHOUSE_EMAIL = `warehouse${UNIQUE_ID}@saleor.io`;
const VALID_ADDRESS_US = '100 Logistics Drive, Suite 101';
const VALID_CITY = 'Los Angeles';
const VALID_ZIP = '90001';
const TEST_PHONE = '555-123-4567';


describe('Configuration: Comprehensive Warehouse Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/warehouses');
        cy.contains('All warehouses').should('be.visible');
    });

    // --- Helper Function to Fill a Valid Address ---
    const fillValidAddress = () => {
        cy.get(SELECTORS.ADDR_LINE1_INPUT).type(VALID_ADDRESS_US);
        cy.get(SELECTORS.ADDR_CITY_INPUT).type(VALID_CITY);
        cy.get(SELECTORS.ADDR_ZIP_INPUT).type(VALID_ZIP);

        // Select Country (USA)
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).click().type('United States{enter}');
    };

   
    it('C1.01: Successfully create warehouse with minimal valid data (Name & Address)', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type(TEST_WAREHOUSE_NAME);
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Warehouse created successfully');
        cy.contains(TEST_WAREHOUSE_NAME).should('be.visible');
    });

    it('C1.02: Create warehouse with Email, Company, and Phone', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('Full Spec Warehouse');
        cy.get(SELECTORS.WAREHOUSE_EMAIL_INPUT).type(TEST_WAREHOUSE_EMAIL);

        fillValidAddress();
        cy.get(SELECTORS.ADDR_COMPANY_INPUT).type('Cypress Logistics');
        cy.get(SELECTORS.ADDR_PHONE_INPUT).type(TEST_PHONE);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Attempt to save without Warehouse Name (Required)', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Attempt to save without Address Line 1 (Required)', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('No Address Test');

        // Skip Address Line 1
        cy.get(SELECTORS.ADDR_CITY_INPUT).type(VALID_CITY);
        cy.get(SELECTORS.ADDR_ZIP_INPUT).type(VALID_ZIP);
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).click().type('United States{enter}');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_LINE1_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.05: Attempt to save with invalid Email format', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('Bad Email Test');
        cy.get(SELECTORS.WAREHOUSE_EMAIL_INPUT).type('invalid@email');
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.06: Address Phone field with invalid non-numeric data', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('Bad Phone Test');
        fillValidAddress();

        cy.get(SELECTORS.ADDR_PHONE_INPUT).type('ABC-123-DEF');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_PHONE_INPUT).parent().parent().should('contain', 'Invalid phone number format');
    });

    it('C1.07: Address ZIP code with invalid characters', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('Bad ZIP Test');
        fillValidAddress();

        cy.get(SELECTORS.ADDR_ZIP_INPUT).clear().type('ZIPCODE');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ADDR_ZIP_INPUT).parent().parent().should('contain', 'Invalid postal code format');
    });

    it('C1.08: Warehouse Name with maximum practical length', () => {
        const longName = 'W'.repeat(100);
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type(longName);
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.09: Verify Back button correctly aborts creation', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type('Unsaved Warehouse');

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.contains('Unsaved Warehouse').should('not.exist');
    });

    it('C1.10: Verify Email and Address Line 1 are separate (Input Resilience)', () => {
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_EMAIL_INPUT).type('test@example.com');
        cy.get(SELECTORS.ADDR_LINE1_INPUT).type('123 Main St');

        cy.get(SELECTORS.WAREHOUSE_EMAIL_INPUT).should('have.value', 'test@example.com');
        cy.get(SELECTORS.ADDR_LINE1_INPUT).should('have.value', '123 Main St');
    });

    it('C1.11: Changing Country should update Country Area field (State/Province options)', () => {
        const canadaCountry = 'Canada';
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        // Select Canada
        cy.get(SELECTORS.ADDR_COUNTRY_DROPDOWN).click().type(canadaCountry).wait(500).type('{enter}');

        // Assert Country Area input is visible and ready for province selection
        cy.get('input[name="countryArea"]').should('be.visible');

        cy.get(SELECTORS.BACK_BUTTON).click();
    });

    it('C1.12: Attempt to create warehouse with existing name', () => {
        const existingName = 'Default Warehouse'; // Assuming this exists
        cy.get(SELECTORS.CREATE_WAREHOUSE_BUTTON).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).type(existingName);
        fillValidAddress();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Warehouse with this name already exists');
    });


   
    it('C2.01: Edit Warehouse Name and save successfully', () => {
        const newName = `Updated R-5 ${UNIQUE_ID}`;

        cy.get(SELECTORS.FIRST_WAREHOUSE_ROW).click();

        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).clear().type(newName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Warehouse updated successfully');
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).should('have.value', newName);
    });

    it('C2.02: Edit Warehouse Address Line 1 successfully', () => {
        const newAddress = '999 Fulfillment Center Hwy';

        cy.get(SELECTORS.FIRST_WAREHOUSE_ROW).click();

        cy.get(SELECTORS.ADDR_LINE1_INPUT).clear().type(newAddress);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.ADDR_LINE1_INPUT).should('have.value', newAddress);
    });

    it('C2.03: Successfully delete a non-default warehouse', () => {
        // NOTE: This test requires a newly created warehouse (C1.01) to be deleted.
        // Assuming the first row is the safe-to-delete warehouse.

        cy.get(SELECTORS.FIRST_WAREHOUSE_ROW).parent().find('button[aria-label="Delete"]').click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Warehouse deleted successfully');
    });

    it('C2.04: Attempt to delete Default Warehouse (Server block)', () => {
        cy.contains('Default Warehouse').parent().find('button[aria-label="Delete"]').click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert server-side error
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete default or in-use warehouse');
    });

    it('C2.05: Verify Back button returns to the warehouse list without saving changes', () => {
        cy.get(SELECTORS.FIRST_WAREHOUSE_ROW).click();
        cy.get(SELECTORS.WAREHOUSE_NAME_INPUT).clear().type('Unsaved Change');

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/warehouses');
        cy.contains('Unsaved Change').should('not.exist');
    });
});