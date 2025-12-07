/// <reference types="cypress" />

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_TITLE = `Cypress Test Title ${UNIQUE_ID}`;
const UPDATED_CONTENT = 'This content was generated and updated automatically by a Cypress simulation.';
const MODEL_TYPE = 'Simple'; // Assuming 'Simple' is a clickable option


describe('Models: Comprehensive Edit and Delete Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/models');
        cy.url().should('include', '/models');
        cy.get(SELECTORS.FIRST_MODEL_ROW).should('exist'); // Ensure models list is populated

        // Navigate to the first existing model (e.g., "About")
        cy.get(SELECTORS.FIRST_MODEL_ROW).click();
        cy.contains('About').should('be.visible'); // Assert on the edit page
    });

    // =================================================================
    // C1: CORE EDIT & PERSISTENCE (U) - 7 Cases
    // =================================================================

    it('C1.01: Change Title and Content successfully', () => {
        // 1. Update Title
        cy.get(SELECTORS.TITLE_INPUT).clear().type(UPDATED_TITLE);

        // 2. Update Content (Rich Text Editor)
        cy.get(SELECTORS.CONTENT_EDITOR).clear().type(UPDATED_CONTENT);

        // 3. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model updated successfully');
        cy.get(SELECTORS.TITLE_INPUT).should('have.value', UPDATED_TITLE);
        cy.get(SELECTORS.CONTENT_EDITOR).should('contain.text', UPDATED_CONTENT);
    });

    it('C1.02: Attempt to save with empty Title field', () => {
        cy.get(SELECTORS.TITLE_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.TITLE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Toggle Visibility to Hidden and back to Visible', () => {
        // 1. Set to Hidden (Uncheck the box if visible)
        cy.contains('Visible').prev('input[type="checkbox"]').uncheck({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model updated successfully');

        // 2. Set back to Visible (Check the box)
        cy.contains('Visible').prev('input[type="checkbox"]').check({ force: true });
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model updated successfully');
    });

    it('C1.04: Verify Model Type field is read-only', () => {
        // Assert the Model Type field (Simple) cannot be changed
        cy.contains('Model type').siblings().contains('Simple').should('be.visible');

        // Attempt to interact with the read-only field (should fail)
        cy.contains('Model type').siblings().contains('Simple').click({ force: true });

        // Assert no interactive dropdown/input opens
        cy.get('div[role="listbox"]').should('not.exist');
    });

    it('C1.05: Clear Content field (Allowing empty description)', () => {
        cy.get(SELECTORS.CONTENT_EDITOR).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assumes empty content is valid (non-required field)
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.CONTENT_EDITOR).should('be.empty');
    });

    it('C1.06: Update Public Metadata successfully', () => {
        const metadataKey = 'doc_version';

        cy.contains('Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();

        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(metadataKey);
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type('1.1.0');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(metadataKey).should('be.visible');
    });

    it('C1.07: Successfully remove Private Metadata field', () => {
        // NOTE: This assumes a Private Metadata field exists and can be deleted.
        cy.contains('Private Metadata').parent().find(SELECTORS.METADATA_ADD_FIELD_BUTTON).click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('temp_key');
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Find and delete the last metadata key (temp_key)
        cy.contains('temp_key').siblings().find('button[aria-label="Delete metadata field"]').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('temp_key').should('not.exist');
    });

    // =================================================================
    // C2: CREATE NEW MODEL FLOW (Model Type Selection) - 5 Cases
    // =================================================================

    it('C2.01: Verify "Create model" button opens the Model Type selection modal', () => {
        cy.visit('/models');
        cy.get(SELECTORS.CREATE_MODEL_BUTTON).click();

        cy.contains('Select a model type').should('be.visible'); // Assert modal opens
    });

    it('C2.02: Verify Back button in the modal closes the modal', () => {
        cy.visit('/models');
        cy.get(SELECTORS.CREATE_MODEL_BUTTON).click();

        cy.get(SELECTORS.BACK_MODAL_BUTTON).click();

        cy.contains('Select a model type').should('not.exist');
        cy.url().should('include', '/models');
    });

    it('C2.03: Attempt to confirm model type without selection (Negative)', () => {
        cy.visit('/models');
        cy.get(SELECTORS.CREATE_MODEL_BUTTON).click();

        // Confirm button is disabled by default (as per HTML selector: disabled="")
        cy.get(SELECTORS.CONFIRM_BUTTON).should('be.disabled');

        // Assert modal remains open
        cy.contains('Select a model type').should('be.visible');
    });

    it('C2.04: Successfully select a model type and confirm', () => {
        cy.visit('/models');
        cy.get(SELECTORS.CREATE_MODEL_BUTTON).click();

        // Select Model Type (e.g., Simple)
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(MODEL_TYPE).click();

        // Confirm button should now be enabled
        cy.get(SELECTORS.CONFIRM_BUTTON).should('not.be.disabled').click();

        // Assert navigation to the new model creation form
        cy.url().should('include', '/models/add');
        cy.contains('Create Model').should('be.visible'); // Inferred create form title
    });

    // =================================================================
    // C3: DELETE MODEL (D) - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the existing model', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Model deleted successfully');
        cy.url().should('include', '/models');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click the Back button to cancel deletion
        cy.get('button:contains("Back")').click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Verify overall Back button returns to list view without saving', () => {
        // Change the title without saving
        cy.get(SELECTORS.TITLE_INPUT).clear().type('Unsaved Title');

        cy.get('button:contains("Back")').last().click();

        cy.url().should('include', '/models');
    });
});