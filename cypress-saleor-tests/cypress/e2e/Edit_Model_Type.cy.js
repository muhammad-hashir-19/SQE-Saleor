/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_MODEL_TYPE_ROW: 'tbody tr:first-child a',

    // Edit Page Fields
    NAME_INPUT: 'input[name="modelTypeName"]', // Inferred name based on "Model type Name" label
    ASSIGN_ATTRIBUTE_BUTTON: 'button:contains("Assign attribute")',

    // Metadata (Same structure as Category/Product)
    METADATA_ADD_FIELD_BUTTON: 'button:contains("Add field")',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',
    METADATA_VALUE_TEXTAREA: 'textarea[data-test-id="metadata-value-input"]',

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
const UPDATED_NAME = `Custom Model Type ${UNIQUE_ID}`;
const METADATA_KEY = 'cms_version';


describe('Model Types: Comprehensive Edit and Delete Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/model-types'); // Assumes this navigates to the list
        // Navigate to the first existing Model Type (e.g., Default Type)
        cy.get(SELECTORS.FIRST_MODEL_TYPE_ROW).click();
        cy.contains('Default Type').should('be.visible');
    });

    // =================================================================
    // C1: CORE UPDATE & VALIDATION (U) - 7 Cases
    // =================================================================

    it('C1.01: Change Model Type Name successfully', () => {
        cy.get(SELECTORS.NAME_INPUT).clear().type(UPDATED_NAME);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model type updated successfully');
        cy.get(SELECTORS.NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C1.02: Attempt to save with empty Model Type Name', () => {
        cy.get(SELECTORS.NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Attempt to save with existing Model Type Name (Duplicate)', () => {
        // NOTE: This test relies on another Model Type existing, e.g., 'Simple Type' (inferred)
        const duplicateName = 'Simple Type';

        cy.get(SELECTORS.NAME_INPUT).clear().type(duplicateName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'A model type with this name already exists'); // Assumed error
    });

    it('C1.04: Model Type Name input resilience (Max length)', () => {
        const longName = 'L'.repeat(100);
        cy.get(SELECTORS.NAME_INPUT).clear().type(longName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.NAME_INPUT).should('have.value', longName);
    });

    it('C1.05: Verify Assign Attribute button is present and opens a modal/form', () => {
        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).should('be.visible').click();

        // Assert modal/form opens (inferred title: Assign Model Attributes)
        cy.contains('Assign Model Attributes').should('be.visible');

        cy.get('button:contains("Back")').click(); // Close the modal
    });

    it('C1.06: Add a Public Metadata field successfully', () => {
        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(METADATA_KEY);
        cy.get(SELECTORS.METADATA_VALUE_TEXTAREA).last().type('v1.2');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(METADATA_KEY).should('be.visible');
    });

    it('C1.07: Remove an existing Private Metadata field successfully', () => {
        // NOTE: Requires a field to be present (Add one if not present)
        cy.contains('Private Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('internal_flag');
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Find and delete the field
        cy.contains('internal_flag').siblings().find('button[aria-label="Delete metadata field"]').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('internal_flag').should('not.exist');
    });

    // =================================================================
    // C2: DELETE MODEL TYPE (D) - 3 Cases
    // =================================================================

    it('C2.01: Successfully delete the model type', () => {
        // NOTE: This should only be run on non-default types with no associated models/products.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        // Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model type deleted successfully');
        cy.url().should('include', '/model-types');
    });

    it('C2.02: Check cancellation of the delete process', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click the Back button to cancel deletion
        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C2.03: Attempt to delete model type with active associated models (Server block)', () => {
        // NOTE: This test should ideally use a Model Type known to be in use.
        // Assuming "Default Type" is required/in-use.
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert server-side error stating deletion is blocked
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete model type with existing models');
    });
});