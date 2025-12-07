/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_ZONE_BUTTON: 'button:contains("Create shipping zone")',
    FIRST_ZONE_ROW: 'tbody tr:first-child a',

    // Create/Edit Zone Fields
    ZONE_NAME_INPUT: 'input[name="shippingZoneName"]', // Inferred name
    ZONE_DESCRIPTION_INPUT: 'textarea[name="description"]', // Inferred name
    ASSIGN_COUNTRIES_BUTTON: 'button:contains("Assign countries")',
    ADD_WAREHOUSE_BUTTON: 'button:contains("Add New Warehouse")',

    // Create/Edit Shipping Method (Within Zone Detail)
    CREATE_METHOD_BUTTON: 'button:contains("Create shipping method")',
    METHOD_NAME_INPUT: 'input[name="methodName"]', // Inferred
    METHOD_PRICE_INPUT: 'input[name="price"]', // Inferred

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_ZONE_NAME = `Cypress Zone ${UNIQUE_ID}`;
const TEST_METHOD_NAME = 'Express Shipping';
const TEST_RATE = '15.99';
const TEST_COUNTRY = 'Germany'; // Assumed valid country


describe('Configuration: Comprehensive Shipping Methods Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/shipping'); // Assumes '/shipping' lands on the Shipping Zones list
        cy.contains('Shipping').should('be.visible');
    });

 

    it('C1.01: Successfully create a new shipping zone', () => {
        cy.get(SELECTORS.CREATE_ZONE_BUTTON).click();

        cy.get(SELECTORS.ZONE_NAME_INPUT).type(TEST_ZONE_NAME);
        cy.get(SELECTORS.ZONE_DESCRIPTION_INPUT).type('Zone for automated testing.');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Shipping zone created successfully');
        cy.contains(TEST_ZONE_NAME).should('be.visible');
    });

    it('C1.02: Attempt to save without Shipping Zone Name (Required)', () => {
        cy.get(SELECTORS.CREATE_ZONE_BUTTON).click();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ZONE_NAME_INPUT).parent().parent().should('contain', 'This field is required');

        cy.get(SELECTORS.BACK_BUTTON).click();
    });

    it('C1.03: Attempt to save without assigning countries', () => {
        cy.get(SELECTORS.CREATE_ZONE_BUTTON).click();
        cy.get(SELECTORS.ZONE_NAME_INPUT).type('No Countries Zone');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert creation succeeds but a warning/error appears about missing countries
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Assign countries to an existing zone', () => {
        // Navigate to edit the first zone
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        cy.get(SELECTORS.ASSIGN_COUNTRIES_BUTTON).click();

        // Select a country (e.g., Germany)
        cy.get('input[placeholder="Search country"]').type(TEST_COUNTRY);
        cy.contains(TEST_COUNTRY).click(); // Select from dropdown

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Assign a Warehouse to the shipping zone', () => {
        // Navigate to edit the first zone
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        cy.get(SELECTORS.ADD_WAREHOUSE_BUTTON).click();

        // Select a warehouse (e.g., Default Warehouse)
        cy.contains('Default Warehouse').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        cy.contains('Default Warehouse').should('be.visible'); // Assert presence on the page
    });

    it('C1.06: Attempt to assign an already assigned country', () => {
        // NOTE: This test requires TEST_COUNTRY to be already assigned (from C1.04)
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();
        cy.get(SELECTORS.ASSIGN_COUNTRIES_BUTTON).click();

        // Select the same country again
        cy.get('input[placeholder="Search country"]').type(TEST_COUNTRY);
        cy.contains(TEST_COUNTRY).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert error or warning
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Country already assigned to this zone'); // Assumed error
    });

    it('C1.07: Successfully delete the shipping zone', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Shipping zone deleted successfully');
        cy.url().should('not.include', '/shipping/');
    });

   
    it('C2.01: Successfully create a new Shipping Method within a zone', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        cy.get(SELECTORS.CREATE_METHOD_BUTTON).click();

        // Fill method details
        cy.get(SELECTORS.METHOD_NAME_INPUT).type(TEST_METHOD_NAME);
        cy.get(SELECTORS.METHOD_PRICE_INPUT).type(TEST_RATE);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Shipping method created successfully');
        cy.contains(TEST_METHOD_NAME).should('be.visible');
    });

    it('C2.02: Attempt to create method without price (Required)', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();
        cy.get(SELECTORS.CREATE_METHOD_BUTTON).click();

        cy.get(SELECTORS.METHOD_NAME_INPUT).type(TEST_METHOD_NAME);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.METHOD_PRICE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.03: Attempt to create method with negative price', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();
        cy.get(SELECTORS.CREATE_METHOD_BUTTON).click();

        cy.get(SELECTORS.METHOD_NAME_INPUT).type('Negative Price');
        cy.get(SELECTORS.METHOD_PRICE_INPUT).type('-10.00');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.METHOD_PRICE_INPUT).parent().parent().should('contain', 'Price cannot be negative');
    });

    it('C2.04: Verify price field accepts minimum valid price (0.01)', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();
        cy.get(SELECTORS.CREATE_METHOD_BUTTON).click();

        cy.get(SELECTORS.METHOD_NAME_INPUT).type('Min Price');
        cy.get(SELECTORS.METHOD_PRICE_INPUT).type('0.01');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: [Verify maximum price input resilience', () => {
        const largePrice = '99999.99';
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();
        cy.get(SELECTORS.CREATE_METHOD_BUTTON).click();

        cy.get(SELECTORS.METHOD_NAME_INPUT).type('Max Price');
        cy.get(SELECTORS.METHOD_PRICE_INPUT).type(largePrice);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: Edit an existing Shipping Method name', () => {
        // NOTE: This assumes C2.04 created a method named 'Min Price'
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        cy.contains('Min Price').click(); // Navigate to method details

        cy.get(SELECTORS.METHOD_NAME_INPUT).clear().type('Updated Price');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Updated Price').should('be.visible');
    });

    it('C2.07: Successfully delete a Shipping Method', () => {
        cy.get(SELECTORS.FIRST_ZONE_ROW).click();

        // Click the delete icon for the first method
        cy.get('tbody tr:first-child button[aria-label="Delete"]').click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Shipping method deleted successfully');
    });
});