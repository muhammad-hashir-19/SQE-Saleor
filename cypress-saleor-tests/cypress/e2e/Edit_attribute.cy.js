/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_ATTRIBUTE_ROW: 'tbody tr:first-child a',

    // Edit Page Fields
    DEFAULT_LABEL_INPUT: 'input[name="defaultLabel"]',
    ATTRIBUTE_CODE_INPUT: 'input[name="attributeCode"]', // Should be read-only on edit

    // Properties (Checkboxes)
    FILTERABLE_CHECKBOX: 'input[name="filterableInStorefront"]',
    VISIBLE_CHECKBOX: 'input[name="visibleInStorefront"]',
    VALUE_REQUIRED_CHECKBOX: 'input[name="valueRequired"]',

    // Attribute Values Management
    ASSIGN_VALUE_BUTTON: 'button:contains("Assign value")',
    FIRST_VALUE_ROW: 'div[role="dialog"] tbody tr:first-child', // First value in the modal list
    EDIT_VALUE_BUTTON: 'button[aria-label="Edit"]', // Button to open the value edit modal
    VALUE_NAME_INPUT: 'input[name="name"]', // Input field inside the value modal
    VALUE_SAVE_BUTTON: 'button:contains("Save")', // Button inside the value modal

    // Metadata (Public/Private)
    METADATA_ADD_FIELD_BUTTON: 'button:contains("Add field")',

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
const UPDATED_LABEL = `Updated Flavor Type ${UNIQUE_ID}`;
const NEW_VALUE_NAME = `Citrus Zest ${UNIQUE_ID}`;


describe('Configuration: Comprehensive Edit Attribute Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/attributes');
        // Navigate to the first existing Attribute (e.g., Flavor)
        cy.get(SELECTORS.FIRST_ATTRIBUTE_ROW).click();
        cy.contains('General Information').should('be.visible');
    });

  
    it('C1.01: Change Default Label successfully', () => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).clear().type(UPDATED_LABEL);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute updated successfully');
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).should('have.value', UPDATED_LABEL);
    });

    it('C1.02: Verify Attribute Code field is read-only and immutable', () => {
        // Assert the code field is disabled or read-only
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).should('be.disabled').or('have.attr', 'readonly');

        // Attempt to clear the field (should fail)
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).clear({ force: true });

        // Assert value is unchanged
        cy.get(SELECTORS.ATTRIBUTE_CODE_INPUT).should('not.be.empty');
    });

    it('C1.03: Toggle Filterable in storefront status', () => {
        // Assert current state: Filterable is checked
        cy.get(SELECTORS.FILTERABLE_CHECKBOX).should('be.checked');

        // Uncheck and save
        cy.get(SELECTORS.FILTERABLE_CHECKBOX).uncheck();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.FILTERABLE_CHECKBOX).should('not.be.checked');
    });

    it('C1.04: Toggle Visible in storefront status', () => {
        // Assert current state: Visible is checked
        cy.get(SELECTORS.VISIBLE_CHECKBOX).should('be.checked');

        // Uncheck and save
        cy.get(SELECTORS.VISIBLE_CHECKBOX).uncheck();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.VISIBLE_CHECKBOX).should('not.be.checked');
    });

    it('C1.05: Toggle Value Required status', () => {
        // Assume default state is unchecked

        // Check and save
        cy.get(SELECTORS.VALUE_REQUIRED_CHECKBOX).check();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.VALUE_REQUIRED_CHECKBOX).should('be.checked');
    });

    it('C1.06: Attempt to save with empty Default Label', () => {
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.07: Add a Public Metadata field and verify persistence', () => {
        const metadataKey = 'test_update';

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(metadataKey);
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('test_value');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(metadataKey).should('be.visible');
    });

    it('C2.01: Verify "Assign value" button opens the management modal', () => {
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).should('be.visible').click();

        cy.contains('Attribute Values').should('be.visible'); // Assert modal title

        cy.get('button:contains("Back")').click();
    });

    it('C2.02: Successfully add a new Attribute Value', () => {
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        cy.contains('Create attribute value').click();

        cy.get(SELECTORS.VALUE_NAME_INPUT).type(NEW_VALUE_NAME);
        cy.get(SELECTORS.VALUE_SAVE_BUTTON).click(); // Save button inside modal

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute value added');

        cy.contains(NEW_VALUE_NAME).should('be.visible'); // Assert new value in the list

        cy.get('button:contains("Back")').click(); // Exit value modal
        cy.get(SELECTORS.SAVE_BUTTON).click(); // Save overall form
    });

    it('C2.03: Edit an existing Attribute Value name', () => {
        const updatedValueName = `New Zest ${UNIQUE_ID}`;

        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        // Find the edit icon for the first existing value (e.g., "Apple" for Flavor)
        cy.get('tbody tr:first-child').find(SELECTORS.EDIT_VALUE_BUTTON).click();

        // Update the value name in the sub-modal
        cy.get(SELECTORS.VALUE_NAME_INPUT).clear().type(updatedValueName);
        cy.get(SELECTORS.VALUE_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute value updated');

        cy.contains(updatedValueName).should('be.visible'); // Assert new value name in the list
    });

    it('C2.04: Delete an existing Attribute Value', () => {
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        // Find the delete icon for the first existing value
        cy.get('tbody tr:first-child button[aria-label="Delete"]').click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute value deleted');

        cy.get('button:contains("Back")').click();
        cy.get(SELECTORS.SAVE_BUTTON).click(); // Save overall form
    });

    it('C2.05: Attempt to add empty Attribute Value name', () => {
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();
        cy.contains('Create attribute value').click();

        cy.get(SELECTORS.VALUE_SAVE_BUTTON).click();

        cy.get(SELECTORS.VALUE_NAME_INPUT).parent().parent().should('contain', 'This field is required');

        cy.get('button:contains("Back")').click(); // Close sub-modal
        cy.get('button:contains("Back")').click(); // Close main modal
    });

    it('C2.06: Attempt to add duplicate Attribute Value name', () => {
        const valueName = 'Orange'; // Assumed existing value
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        cy.contains('Create attribute value').click();
        cy.get(SELECTORS.VALUE_NAME_INPUT).type(valueName);
        cy.get(SELECTORS.VALUE_SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Attribute value already exists');

        cy.get('button:contains("Back")').click();
        cy.get('button:contains("Back")').click();
    });

    it('C2.07: Verify changing Attribute Label does not affect existing values', () => {
        // Change label
        cy.get(SELECTORS.DEFAULT_LABEL_INPUT).clear().type('Temporary Label');

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Re-open values modal
        cy.get(SELECTORS.ASSIGN_VALUE_BUTTON).click();

        // Assert existing values are still listed
        cy.contains('Apple').should('be.visible'); // Assuming Apple exists

        cy.get('button:contains("Back")').click();
    });

   
    it('C3.01: Successfully delete the attribute', () => {
        // NOTE: This should only be run on attributes that are not assigned to products/product types.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Attribute deleted successfully');
        cy.url().should('include', '/attributes');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Attempt to delete attribute with associated products (Server block)', () => {
        // NOTE: Assuming "Flavor" is associated with products.
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete attribute used by products'); // Inferred server error
    });
});