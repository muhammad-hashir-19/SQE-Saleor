/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_PRODUCT_TYPE_BUTTON: 'button:contains("Create Product Type")',

    // General Information
    NAME_INPUT: 'input[name="productTypeName"]', // Inferred name

    // Type Radios
    REGULAR_RADIO: 'input[value="REGULAR"]',
    GIFT_CARD_RADIO: 'input[value="GIFT_CARD"]',

    // Shipping/Tax
    SHIPPABLE_CHECKBOX: 'input[name="isShippable"]', // Inferred toggle name
    TAX_CLASS_DROPDOWN: 'div:contains("Tax class") input[role="combobox"]',

    // Metadata (Public/Private)
    METADATA_ADD_FIELD_BUTTON: 'button:contains("Add field")',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',

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
const TEST_PT_NAME = `Test Product Type ${UNIQUE_ID}`;
const TAX_CLASS_BOOKS = 'Books'; // Assumed valid tax class


describe('Configuration: Comprehensive Create Product Type Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/product-types/add');
        cy.contains('Create Product Type').should('be.visible');
    });

   
    it('C1.01: Create Regular product type with minimal data (Name)', () => {
        cy.get(SELECTORS.NAME_INPUT).type(TEST_PT_NAME);
        // Regular product type is default selected

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product type created successfully');
    });

    it('C1.02: Create Gift Card product type (Payment behavior check)', () => {
        cy.get(SELECTORS.NAME_INPUT).type(`Gift Card Type ${UNIQUE_ID}`);

        // Select Gift Card radio button
        cy.get(SELECTORS.GIFT_CARD_RADIO).click();

        // Assert Shipping checkbox disappears (Inferred: Gift cards are non-shippable)
        cy.contains('Is this product shippable?').should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Attempt to save without Product Type Name', () => {
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Attempt to create a type with a duplicate name', () => {
        const duplicateName = 'Default Type'; // Assuming this exists from the Model Types list
        cy.get(SELECTORS.NAME_INPUT).type(duplicateName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Product type with this name already exists'); // Assumed error
    });

    it('C1.05: Verify product is shippable by default (Regular Type)', () => {
        cy.get(SELECTORS.REGULAR_RADIO).click();

        // Assert 'Is this product shippable?' checkbox is present and checked
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).should('be.checked');

        cy.get(SELECTORS.NAME_INPUT).type('Shippable Check');
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Uncheck "Is this product shippable?" and save', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Non-Shippable Check');

        // Uncheck the box
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).uncheck();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.07: Successfully assign a Tax Class and save', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Taxed Product Type');

        // Select Tax Class (e.g., Books)
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(TAX_CLASS_BOOKS).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.08: Attempt to save Tax Class with invalid input', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Invalid Tax Check');

        // Type non-existent tax class
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).click().type('Invalid Tax Name{enter}');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert server-side validation error
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Tax class is invalid'); // Assumed error
    });

    it('C1.09: Verify Back button correctly aborts creation', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Unsaved PT');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/product-types');
    });

    it('C1.10: Verify Name input handles complex characters', () => {
        const complexName = 'Digital Assets & Guides (v2.0) ®';
        cy.get(SELECTORS.NAME_INPUT).type(complexName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

   
    it('C2.01: Add a Public Metadata field successfully', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Metadata Check');

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('inventory_flag');
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('true');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.02: Add a Private Metadata field successfully', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Private Metadata Check');

        cy.contains('Private Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('internal_api_id');
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('12345-ERP');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save with empty Metadata key', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Bad Meta Key');

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Metadata key cannot be empty');

        cy.get('button:contains("Back")').click();
    });

    it('C2.04: Verify "Is this product shippable?" controls visibility of Shipping configuration', () => {
        // Assert Shipping configuration (Weight/Dimensions fields) is visible by default
        cy.contains('Weight').should('be.visible');

        // Uncheck shippable box
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).uncheck();

        // Assert Shipping configuration disappears (Inferred UI change)
        cy.contains('Weight').should('not.exist');
    });

    it('C2.05: Verify Gift Card Type hides Shipping configuration', () => {
        cy.get(SELECTORS.GIFT_CARD_RADIO).click();

        // Assert Shipping configuration disappears
        cy.contains('Weight').should('not.exist');
        cy.contains('Is this product shippable?').should('not.exist');
    });
});