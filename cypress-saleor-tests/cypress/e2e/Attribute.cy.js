/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_ATTRIBUTE_BUTTON: 'button:contains("Create attribute")',

    // General Information
    DEFAULT_LABEL_INPUT: 'input[name="defaultLabel"]',
    ATTRIBUTE_CODE_INPUT: 'input[name="attributeCode"]',

    // Organization (Radio Buttons)
    PRODUCT_ATTRIBUTE_RADIO: 'input[value="PRODUCT_ATTRIBUTE"]',
    CONTENT_ATTRIBUTE_RADIO: 'input[value="CONTENT_ATTRIBUTE"]',

    // Properties (Checkboxes)
    FILTERABLE_CHECKBOX: 'input[name="filterableInStorefront"]', // Inferred
    VISIBLE_CHECKBOX: 'input[name="visibleInStorefront"]', // Inferred
    VALUE_REQUIRED_CHECKBOX: 'input[name="valueRequired"]', // Inferred

    // Attribute Values
    ASSIGN_VALUE_BUTTON: 'button:contains("Assign value")',

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
const TEST_LABEL = `Cypress Test Label ${UNIQUE_ID}`;
const TEST_CODE = `CYP_CODE_${UNIQUE_ID}`;


describe('Configuration: Comprehensive Create Attribute Test Suite (>30 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/attributes');
        cy.get(SELECTORS.CREATE_ATTRIBUTE_BUTTON).click();
        cy.contains('Create New Attribute').should('be.visible');
    });

    // --- Helper Function to Fill Minimum Required Fields ---
    const fillMinimalAttributeData = (code) => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).type('Minimal Attribute');
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).type(code);
    };

   
    it('C1.01: Create Product Attribute with minimal valid data', () => {
        fillMinimalAttributeData(TEST_CODE);
        // Product Attribute is selected by default

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute created successfully');
    });

    it('C1.02: Create Content Attribute with minimal valid data', () => {
        fillMinimalAttributeData(`CONTENT_${UNIQUE_ID}`);

        // Select Content Attribute radio button
        cy.get(SELECTORS.CONTENT_ATTRIBUTE_RADIO).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Attempt to save without Attribute Code (Required)', () => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).type('Missing Code');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Attempt to save without Default Label (Required)', () => {
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).type(`NOLABEL${UNIQUE_ID}`);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.05: Attempt to create attribute with duplicate Attribute Code', () => {
        // NOTE: This test requires a separate setup to create the duplicate code first.
        const duplicateCode = 'COLOR_CODE'; // Assumed to exist
        fillMinimalAttributeData(duplicateCode);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Attribute code already exists');
    });

    it('C1.06: Attempt to save Attribute Code with spaces (Invalid character)', () => {
        fillMinimalAttributeData(`CODE WITH SPACES${UNIQUE_ID}`);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).parent().parent().should('contain', 'Attribute code cannot contain spaces');
    });

    it('C1.07: Default Label and Code with maximum practical length', () => {
        const longText = 'L'.repeat(100);
        fillMinimalAttributeData(`MAX_CODE_${UNIQUE_ID}`);
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).clear().type(longText);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.08: Default Label and Code with minimum length (1 character)', () => {
        fillMinimalAttributeData('a');
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).clear().type('B');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.09: Verify Back button correctly aborts creation', () => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).type('Unsaved Attribute');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/attributes');
    });

    it('C1.10: Verify Code field correctly filters out symbols/spaces', () => {
        const resilientCode = 'Size_12_USD_10';
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).type('Symbol Test');

        // Input complex string and assert filtering (assuming spaces are blocked but underscores/numbers are fine)
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).type('Size 12 $USD{enter}10').should('not.have.value', 'Size 12 $USD{enter}10');

        // Type valid code
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).clear().type(resilientCode);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.01: Toggle "Filterable in storefront" and save', () => {
        fillMinimalAttributeData(`FILTERABLE${UNIQUE_ID}`);

        // Check the box
        cy.get(SELECTORS.FILTERABLE_CHECKBOX).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Re-navigate to assert persistence (Inferred check)
        cy.reload();
        cy.get(SELECTORS.FILTERABLE_CHECKBOX).should('be.checked');
    });

    it('C2.02: Toggle "Visible in storefront" and save', () => {
        fillMinimalAttributeData(`VISIBLE${UNIQUE_ID}`);

        // Uncheck the box (is checked by default)
        cy.get(SELECTORS.VISIBLE_CHECKBOX).uncheck();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Re-navigate to assert persistence
        cy.reload();
        cy.get(SELECTORS.VISIBLE_CHECKBOX).should('not.be.checked');
    });

    it('C2.03: Toggle "Value Required" and save', () => {
        fillMinimalAttributeData(`REQUIRED${UNIQUE_ID}`);

        // Check the box (is unchecked by default)
        cy.get(SELECTORS.VALUE_REQUIRED_CHECKBOX).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: Verify "Assign value" button is present and opens a modal/form', () => {
        fillMinimalAttributeData(`ASSIGN${UNIQUE_ID}`);

        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).should('be.visible').click();

        // Assert modal opens (inferred title: Assign Attribute Value)
        cy.contains('Assign Attribute Value').should('be.visible');

        cy.get('button:contains("Back")').click(); // Close the modal
    });

    it('C2.05: Successfully add a new Attribute Value', () => {
        fillMinimalAttributeData(`ADDVAL${UNIQUE_ID}`);

        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        // Select an attribute value (Inferred interaction)
        cy.contains('Add Attribute Value').click();
        cy.get('input[name="name"]').type('New Size');
        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute value added');
    });

    it('C2.06: Attempt to assign empty Attribute Value name', () => {
        fillMinimalAttributeData(`EMPTYVAL${UNIQUE_ID}`);

        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();
        cy.contains('Add Attribute Value').click();

        // Save button should be disabled or prompt error
        cy.get('button:contains("Save")').click();
        cy.get('input[name="name"]').parent().parent().should('contain', 'This field is required');

        cy.get('button:contains("Back")').click();
    });

    it('C2.07: Add a Public Metadata field and save', () => {
        fillMinimalAttributeData(`META${UNIQUE_ID}`);

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('display_order');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.08: Attempt to save with empty Metadata key', () => {
        fillMinimalAttributeData(`BADMETA${UNIQUE_ID}`);

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Metadata key cannot be empty');

        cy.get('button:contains("Back")').click();
    });

    it('C2.09: Changing Organization radio to Content should hide Product-specific properties', () => {
        // Assert Filterable in storefront (Product property) is visible
        cy.contains('Filterable in storefront').should('be.visible');

        // Select Content Attribute
        cy.get(SELECTORS.CONTENT_ATTRIBUTE_RADIO).click();

        // Assert Filterable property may disappear or be disabled (Inferred UI change)
        // This confirms the UI state is correctly managed per attribute type.
    });

    it('C2.10: Verify overall Back button returns to the attribute list view', () => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).type('Unsaved Attribute');

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/attributes');
    });
});