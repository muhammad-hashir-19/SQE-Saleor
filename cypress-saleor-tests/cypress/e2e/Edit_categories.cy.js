/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / General
    CREATE_BUTTON: 'button:contains("Create category")',
    FIRST_CATEGORY_ROW: 'tbody tr:first-child a', // Click the link (Category Name) in the first row
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',

    // Detail/Edit Form Elements
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    UPLOAD_IMAGE_BUTTON: 'button:contains("Upload image")',

    // Subcategory/Product Tabs
    SUBCATEGORIES_TAB: 'button:contains("Subcategories")',
    PRODUCTS_TAB: 'button:contains("Products")',
    CREATE_SUBCATEGORY_BUTTON: 'button:contains("Create subcategory")',

    // Metadata (Public & Private)
    METADATA_ADD_FIELD_BUTTON: 'button[data-test-id="add-field"]',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic Validation
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_NAME = `Updated Apparel ${UNIQUE_ID}`;
const NEW_DESCRIPTION = 'This is the new official description for the Apparel category after review.';
const MAX_SEO_TITLE = 70;


describe('Categories: Comprehensive CRUD & Edit Test Suite', () => {

    // --- Setup ---
    before(() => {
        // Creates and saves the authenticated session state before the tests run.
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/categories');
        cy.url().should('include', '/categories');
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).should('exist');
    });

    // =================================================================
    // C1: READ & UPDATE (U) - Core Functionality - 7 Cases
    // =================================================================

    it('C1.01: Verify clicking category row opens detail/edit page', () => {
        // Navigate to the first existing category (e.g., Apparel)
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Assert the URL changed to the detail page
        cy.url().should('not.include', '/categories?');
        cy.get(SELECTORS.NAME_INPUT).should('be.visible');

        // Assert Delete button is present (Crucial for Edit mode)
        cy.get(SELECTORS.DELETE_BUTTON).should('be.visible');
    });

    it('C1.02: Change Name and Description successfully', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Update Name
        cy.get(SELECTORS.NAME_INPUT).clear().type(UPDATED_NAME);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().type(NEW_DESCRIPTION);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert success and persistence
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Category updated successfully'); // Assume update text
        cy.get(SELECTORS.NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C1.03: Update SEO Title with max length (N=70) successfully', () => {
        const maxTitle = 'T'.repeat(MAX_SEO_TITLE);

        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Update SEO Title
        cy.get('input[name="seoTitle"]').clear().type(maxTitle);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get('input[name="seoTitle"]').should('have.value', maxTitle);
    });

    it('C1.04: Add a Public Metadata field and save', () => {
        const metadataKey = 'integration_tag';
        const metadataValue = 'external_system_id_101';

        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Add Metadata field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(metadataKey);
        cy.get('textarea[data-test-id="metadata-value-input"]').last().type(metadataValue);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Successfully remove an existing Metadata field', () => {
        // NOTE: This test requires a metadata field to exist (assumed from C1.04/initial data)
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Find and click the delete button for the LAST metadata field
        cy.get(SELECTORS.METADATA_DELETE_BUTTON).last().click();

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        // Final assertion would be verifying the count decreased on reload.
    });

    it('C1.06: Attempt to save with cleared Name field', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        cy.get(SELECTORS.NAME_INPUT).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.07: Clear Description field (Test nullability)', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Clear description, assert input is empty
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().should('be.empty');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C2: SUBCATEGORY & PRODUCT TABS - 4 Cases
    // =================================================================

    it('C2.01: Verify Subcategories tab is the default view', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Assert Subcategories tab is active/visible by default
        cy.get(SELECTORS.SUBCATEGORIES_TAB).should('have.attr', 'aria-selected', 'true');
        cy.get(SELECTORS.CREATE_SUBCATEGORY_BUTTON).should('be.visible');
    });

    it('C2.02: Switch to Products tab and assert content change', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // Click Products tab
        cy.get(SELECTORS.PRODUCTS_TAB).click();

        // Assert Products tab is now active
        cy.get(SELECTORS.PRODUCTS_TAB).should('have.attr', 'aria-selected', 'true');

        // Assert product list/search element is visible (no dedicated button)
        cy.contains('Search products').should('be.visible');
    });

    it('C2.03: Verify "Create subcategory" button navigates to the Add Category form', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        cy.get(SELECTORS.CREATE_SUBCATEGORY_BUTTON).click();

        // Assert redirection to the Add Category form, where the parent field should be pre-filled
        cy.url().should('include', '/categories/add');
        cy.contains('Create New Category').should('be.visible');
    });

    it('C2.04: Verify product count in the Products tab (if visible)', () => {
        // This is a test for data integrity read
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();
        cy.get(SELECTORS.PRODUCTS_TAB).click();

        // Assert the table/list of products is visible and contains data (gt 0)
        cy.get('tbody tr').should('exist');
    });

    // =================================================================
    // C3: DELETE OPERATION (D) - 2 Cases
    // =================================================================

    it('C3.01: Successfully delete the edited category', () => {
        // NOTE: This test must run on a category you are safe to delete.

        // Navigate to edit page
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        // 1. Click Delete button
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get('button:contains("Delete")').click();

        // 3. Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Category deleted successfully');
        cy.url().should('include', '/categories');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.FIRST_CATEGORY_ROW).click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        // Assert modal is visible
        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click cancel/back button in the modal
        cy.get('button:contains("Back")').click();

        // Assert modal is closed and we are still on the detail page
        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.NAME_INPUT).should('be.visible');
    });
});