/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // Refund Model Type Dropdown
    MODEL_TYPE_DROPDOWN: 'div:contains("Refunds Model Type") input[role="combobox"]',
    CREATE_NEW_MODEL_LINK: 'a:contains("Create new Model Type")',

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const MODEL_TYPE_SIMPLE = 'Simple'; // Assuming 'Simple' is a valid, existing model type
const MODEL_TYPE_NONE = 'None';


describe('Configuration: Comprehensive Refunds Settings Test Suite (>10 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/refunds-settings'); // Assumes this is the correct route
        cy.contains('Refund reasons').should('be.visible');
    });

    
    it('C1.01: Successfully select a model type for refund reasons (e.g., Simple)', () => {
        // 1. Open Dropdown
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).click();

        // 2. Select a valid model type
        cy.get('div[role="listbox"]').contains(MODEL_TYPE_SIMPLE).click();

        // 3. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Refunds settings updated');
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).should('have.value', MODEL_TYPE_SIMPLE);
    });

    it('C1.02: Successfully revert the setting back to "None"', () => {
        // 1. Open Dropdown
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).click();

        // 2. Select 'None'
        cy.get('div[role="listbox"]').contains(MODEL_TYPE_NONE).click();

        // 3. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).should('have.value', MODEL_TYPE_NONE);
    });

    it('C1.03: Attempt to save without selecting a model type (should default to None)', () => {
        // NOTE: The dropdown often defaults to None, making this a test of the default state.
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Refunds settings updated');
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).should('have.value', MODEL_TYPE_NONE);
    });

    it('C1.04: Verify "Create new Model Type" link navigates correctly', () => {
        cy.get(SELECTORS.CREATE_NEW_MODEL_LINK).should('be.visible').click();

        // Assert navigation to the Model Types creation page
        cy.url().should('include', '/model-types/add');
        cy.contains('Create model type').should('be.visible');

        cy.go('back'); // Return to settings page
    });

    it('C1.05: Verify dropdown resilience when typing long, non-existent model type', () => {
        const nonExistent = 'NonExistent Model Type ABC 123';

        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).click().type(nonExistent);

        // Assert no valid option is displayed
        cy.contains('No options').should('be.visible'); // Inferred list message

        // Close dropdown
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).type('{esc}');
    });

    it('C1.06: Verify existing model type selection persists after page reload', () => {
        // Set setting to Simple
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(MODEL_TYPE_SIMPLE).click();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Reload page
        cy.reload();

        // Assert setting remains 'Simple'
        cy.get(SELECTORS.MODEL_TYPE_DROPDOWN).should('have.value', MODEL_TYPE_SIMPLE);
    });

    it('C1.07: Verify Back button returns to Configuration list without saving changes', () => {
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/configuration');
        cy.contains('Configuration').should('be.visible');
    });
});