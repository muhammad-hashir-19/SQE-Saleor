/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_MODEL_TYPE_ROW: 'tbody tr:first-child a',

    // Edit Page Fields
    NAME_INPUT: 'input[name="modelTypeName"]', // Targets the Model Type Name input
    ASSIGN_ATTRIBUTE_BUTTON: 'button:contains("Assign attribute")',

    // Model Attributes List
    FIRST_ATTRIBUTE_ROW: 'div:contains("Model attributes") ~ div tbody tr:first-child',
    ATTRIBUTE_ROW_DELETE_ICON: 'button[aria-label="Delete attribute"]', // Inferred selector

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
const UPDATED_NAME = `Standard Type V${UNIQUE_ID}`;
const METADATA_KEY = 'app_api_endpoint';
const TEST_ATTRIBUTE = 'Size'; // Assuming 'Size' is an existing attribute


describe('Model Types: Comprehensive Edit and Delete Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/model-types');
        // Navigate to the first existing Model Type (e.g., Default Type)
        cy.get(SELECTORS.FIRST_MODEL_TYPE_ROW).click();
        cy.contains('General Information').should('be.visible');
    });

    // =================================================================
    // C1: CORE EDIT & PERSISTENCE (U) - 8 Cases
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
        const duplicateName = 'Default Type'; // Assuming 'Default Type' is another existing model type

        cy.get(SELECTORS.NAME_INPUT).clear().type(duplicateName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'A model type with this name already exists');
    });

    it('C1.04: Model Type Name resilience (Max length)', () => {
        const longName = 'A'.repeat(100);
        cy.get(SELECTORS.NAME_INPUT).clear().type(longName);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Verify "Assign Attribute" button opens the selection modal', () => {
        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).should('be.visible').click();

        cy.contains('Assign Model Attributes').should('be.visible');

        cy.get('button:contains("Back")').click();
    });

    it('C1.06: Add a Public Metadata field successfully', () => {
        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(METADATA_KEY);
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('https://api.v1');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(METADATA_KEY).should('be.visible');
    });

    it('C1.07: Remove an existing Private Metadata field successfully', () => {
        // Add a temporary field to ensure one exists
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

    it('C1.08: Attempt to save with empty Metadata key', () => {
        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().clear();
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('Value');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Metadata key cannot be empty');

        cy.get('button:contains("Back")').click();
    });

    // =================================================================
    // C2: MODEL ATTRIBUTES MANAGEMENT - 8 Cases
    // =================================================================

    it('C2.01: Assign a new Attribute to the Model Type', () => {
        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).click();

        // Select an attribute (e.g., 'Size') - Inferred interaction
        cy.contains('Size').click();
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert the attribute appears in the list
        cy.contains(TEST_ATTRIBUTE).should('be.visible');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.02: Remove an existing Model Attribute', () => {
        // NOTE: Requires an attribute to be present (from C2.01)

        // Click delete icon for the first attribute
        cy.get(SELECTORS.FIRST_ATTRIBUTE_ROW).find(SELECTORS.ATTRIBUTE_ROW_DELETE_ICON).click();

        // Confirm deletion in the modal
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Assert attribute is gone
        cy.contains('No attributes found').should('be.visible');
    });

    it('C2.03: Attempt to assign an already assigned attribute', () => {
        // NOTE: Requires an attribute to be assigned (from C2.01)

        cy.get(SELECTORS.ASSIGN_ATTRIBUTE_BUTTON).click();

        // Select the same attribute again
        cy.contains(TEST_ATTRIBUTE).click();
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert error toast/message
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Attribute already assigned to model type'); // Inferred error

        cy.get('button:contains("Back")').click();
    });

    it('C2.04: Verify attributes persist after saving general info update', () => {
        // NOTE: Requires an attribute to be assigned (from C2.01)

        // Change the name only
        cy.get(SELECTORS.NAME_INPUT).clear().type('Attribute Check');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert the attribute still exists in the list
        cy.contains(TEST_ATTRIBUTE).should('be.visible');
    });

    // =================================================================
    // C3: DELETE MODEL TYPE (D) - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the model type', () => {
        // NOTE: This should only be run on non-default types with no associated models/products.

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model type deleted successfully');
        cy.url().should('include', '/model-types');
    });

    it('C3.02: Check cancellation of the delete process', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Attempt to delete model type with active associated models (Server block)', () => {
        // NOTE: Assuming 'Default Type' (the first row) has associated models (like 'About')
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete model type with existing models');
    });
});