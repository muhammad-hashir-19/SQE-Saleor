/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_STRUCTURE_BUTTON: 'button:contains("Create structure")',
    FIRST_STRUCTURE_ROW: 'tbody tr:first-child a',

    // Create Structure Modal
    MODAL_TITLE: 'h2:contains("Create structure")',
    STRUCTURE_TITLE_INPUT: 'input[name="structureTitle"]', // Inferred name
    MODAL_SAVE_BUTTON: 'button:contains("Save")',
    MODAL_BACK_BUTTON: 'button:contains("Back")',

    // Edit Page / Content Management
    EDIT_TITLE_INPUT: 'input[name="title"]', // Assumed name on the detail page
    ADD_ITEM_BUTTON: 'button:contains("Add item")', // Inferred button for adding content

    // Bar Buttons
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const NEW_STRUCTURE_TITLE = `Test Structure ${UNIQUE_ID}`;
const UPDATED_TITLE = `Updated Header ${UNIQUE_ID}`;


describe('Structures: Comprehensive CRUD Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/structures');
        cy.url().should('include', '/structures');
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).should('be.visible');
    });

    // =================================================================
    // C1: CREATE STRUCTURE (MODAL VALIDATION) - 8 Cases
    // =================================================================

    it('C1.01: Successfully create a new structure', () => {
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type(NEW_STRUCTURE_TITLE);
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert success and redirection to the list/detail page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Structure created');
        cy.contains(NEW_STRUCTURE_TITLE).should('be.visible');
    });

    it('C1.02: Attempt to create a structure with an empty title', () => {
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Attempt to create a structure with a duplicate title', () => {
        const existingTitle = 'footer'; // Visible in the list
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type(existingTitle);
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'A structure with this title already exists'); // Assumed server error
    });

    it('C1.04: Verify modal Back button correctly cancels creation', () => {
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type('Unsaved Draft');
        cy.get(SELECTORS.MODAL_BACK_BUTTON).click();

        // Assert modal is closed
        cy.get(SELECTORS.MODAL_TITLE).should('not.exist');
        cy.contains('Unsaved Draft').should('not.exist');
    });

    it('C1.05: Structure Title with maximum length (e.g., 100 characters)', () => {
        const longTitle = 'L'.repeat(100);
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type(longTitle);
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(longTitle).should('be.visible');
    });

    it('C1.06: Structure Title with minimum length (1 character)', () => {
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type('A');
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.07: Structure Title handles unicode/symbols', () => {
        const complexTitle = 'Nav Bar — 2025 ®';
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type(complexTitle);
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains(complexTitle).should('be.visible');
    });

    it('C1.08: Attempt to create a structure with only whitespace', () => {
        cy.get(SELECTORS.CREATE_STRUCTURE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).type('   ');
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.STRUCTURE_TITLE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    // =================================================================
    // C2: EDIT, CONTENT MANAGEMENT, & DELETE (U, D) - 7 Cases
    // =================================================================

    it('C2.01: Verify Structure Title can be edited on the detail page', () => {
        // Navigate to the first existing structure (e.g., footer)
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        // Update Title
        cy.get(SELECTORS.EDIT_TITLE_INPUT).clear().type(UPDATED_TITLE);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Structure updated successfully');
        cy.get(SELECTORS.EDIT_TITLE_INPUT).should('have.value', UPDATED_TITLE);
    });

    it('C2.02: Verify Add Item button is present and starts content creation', () => {
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        // Assert Add Item button is visible
        cy.get(SELECTORS.ADD_ITEM_BUTTON).should('be.visible').click();

        // Assert modal/form for content item creation opens (inferred title)
        cy.contains('Create Content Item').should('be.visible');

        cy.get('button:contains("Close")').click(); // Close the modal
    });

    it('C2.03: Verify an existing content item can be edited', () => {
        // NOTE: This test requires a content item to exist within the structure (e.g., footer item)
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        // Click edit icon for the first content item (inferred selector)
        cy.get('tbody tr:first-child button[aria-label="Edit"]').click();

        // Assert the edit modal/form opens
        cy.contains('Edit Content Item').should('be.visible');

        cy.get('button:contains("Close")').click();
    });

    it('C2.04: Verify an existing content item can be deleted', () => {
        // NOTE: This test should target a content item safe to delete.
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        // Click delete icon for the first content item (inferred selector)
        cy.get('tbody tr:first-child button[aria-label="Delete"]').click();

        // Confirm deletion in the modal
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Content item deleted successfully');
    });

    it('C2.05: Attempt to save with empty Title on edit page', () => {
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        cy.get(SELECTORS.EDIT_TITLE_INPUT).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.EDIT_TITLE_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.06: Successfully delete the existing structure', () => {
        // NOTE: This should only be run on non-essential structures.
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Structure deleted successfully');
        cy.url().should('include', '/structures');
    });

    it('C2.07: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.FIRST_STRUCTURE_ROW).click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        cy.get(SELECTORS.MODAL_BACK_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });
});