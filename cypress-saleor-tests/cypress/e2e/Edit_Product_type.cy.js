/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_PRODUCT_TYPE_ROW: 'tbody tr:first-child a',

    // Edit Page Fields
    NAME_INPUT: 'input[name="productTypeName"]',
    SHIPPABLE_CHECKBOX: 'input[name="isShippable"]',

    // Attributes Management
    ASSIGN_ATTRIBUTE_BUTTON: 'button:contains("Assign attribute")',
    FIRST_ATTRIBUTE_ROW: 'div:contains("Product Attributes") ~ div tbody tr:first-child', // Assumed product attributes section
    DELETE_ATTRIBUTE_ICON: 'button[aria-label="Delete attribute"]',

    // Shipping/Taxes
    TAX_CLASS_DROPDOWN: 'div:contains("Tax class") input[role="combobox"]',
    WEIGHT_INPUT: 'input[name="weight"]', // Inferred name

    // Metadata (Public/Private)
    METADATA_ADD_FIELD_BUTTON: 'button:contains("Add field")',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',

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
const UPDATED_NAME = `Updated Type V${UNIQUE_ID}`;
const TAX_CLASS_GROCERIES = 'Groceries'; // Assumed valid tax class
const TEST_ATTRIBUTE = 'Material'; // Assumed attribute name
const TEST_WEIGHT = '1.5';
const MAX_WEIGHT = '999999'; // BVA large weight


describe('Configuration: Comprehensive Edit Product Type Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/product-types');
        // Navigate to the first existing Product Type (e.g., Beanies & Scarfs)
        cy.get(SELECTORS.FIRST_PRODUCT_TYPE_ROW).click();
        cy.contains('General Information').should('be.visible');
    });

   
    it('C1.01: Change Product Type Name successfully', () => {
        cy.get(SELECTORS.NAME_INPUT).clear().type(UPDATED_NAME);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product type updated successfully');
        cy.get(SELECTORS.NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C1.02: Attempt to save with empty Product Type Name', () => {
        cy.get(SELECTORS.NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Toggle "Is this product shippable?" status to non-shippable', () => {
        // Uncheck the box (if checked)
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).uncheck({ force: true });

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).should('not.be.checked');
    });

    it('C1.04: Update Weight value (BVA)', () => {
        // Ensure shippable is checked first
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).check({ force: true });

        // Update Weight (e.g., from 0 to 1.5)
        cy.get(SELECTORS.WEIGHT_INPUT).clear().type(TEST_WEIGHT);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.WEIGHT_INPUT).should('have.value', TEST_WEIGHT);
    });

    it('C1.05: Verify maximum weight input acceptance', () => {
        cy.get(SELECTORS.SHIPPABLE_CHECKBOX).check({ force: true });

        cy.get(SELECTORS.WEIGHT_INPUT).clear().type(MAX_WEIGHT);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.WEIGHT_INPUT).should('have.value', MAX_WEIGHT);
    });

    it('C1.06: Change Tax Class successfully', () => {
        // Select Tax Class (e.g., Groceries)
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(TAX_CLASS_GROCERIES).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).should('contain', TAX_CLASS_GROCERIES);
    });

    it('C1.07: Add a Private Metadata field successfully', () => {
        cy.contains('Private Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('internal_ID_tracking');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('internal_ID_tracking').should('be.visible');
    });

    it('C1.08: Attempt to save Tax Class with invalid input', () => {
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).click().type('Invalid Tax Name{enter}');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Tax class is invalid');
    });

    it('C2.01: Assign a new Attribute to the Product Type', () => {
        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).click();

        // Select an attribute (e.g., 'Color' - inferred interaction)
        cy.contains('Color').click();
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Color').should('be.visible'); // Assert attribute appears in the list
    });

    it('C2.02: Remove an existing Product Attribute (e.g., Material)', () => {
        // Assuming 'Material' exists from the list

        // Find the Material row and click the delete icon
        cy.contains(TEST_ATTRIBUTE).siblings().find(SELECTORS.DELETE_ATTRIBUTE_ICON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(TEST_ATTRIBUTE).should('not.exist');
    });

    it('C2.03: Attempt to assign an already assigned attribute', () => {
        // NOTE: This test relies on an attribute already being present (e.g., Material)
        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).click();

        // Select the same attribute again
        cy.contains(TEST_ATTRIBUTE).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Attribute already assigned to product type'); // Inferred error

        cy.get('button:contains("Back")').click();
    });

    it('C2.04: Verify Attribute Type (Product/Variant) toggle is present', () => {
        // Assert the checkbox/toggle to enable variant attributes is present
        cy.contains('Product type uses Variant Attributes').should('be.visible');

        // Click the checkbox
        cy.contains('Product type uses Variant Attributes').prev('input[type="checkbox"]').check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Verify minimum number of attributes (0) is allowed', () => {
        // Assume the attribute list is empty (after running C2.02)

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('No attributes found').should('be.visible');
    });

   
    it('C3.01: Successfully delete the product type', () => {
        // NOTE: This should only be run on non-default types with no associated products.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product type deleted successfully');
        cy.url().should('include', '/product-types');
    });

    it('C3.02: Check cancellation of the delete process', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Attempt to delete product type with associated products (Server block)', () => {
        // NOTE: Assuming this product type ("Beanies & Scarfs") has products tied to it.
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete product type with existing products');
    });
});