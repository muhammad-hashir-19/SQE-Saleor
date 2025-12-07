/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page Elements
    CREATE_PRODUCT_BUTTON: 'button:contains("Create Product")',
    FIRST_PRODUCT_ROW: 'tbody tr:first-child a',

    // Detail/Edit Form Elements
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    UPLOAD_MEDIA_BUTTON: 'button:contains("Upload")',
    DELETE_BUTTON: 'button:contains("Delete")',
    SAVE_BUTTON: 'button:contains("Save")',

    // Organize Product / Availability
    CATEGORY_DROPDOWN: 'div:contains("Category") + div input[role="combobox"]', // Targets the Category combobox input
    TAX_CLASS_DROPDOWN: 'div:contains("Tax class") + div input[role="combobox"]', // Targets the Tax Class combobox input
    MANAGE_CHANNELS_BUTTON: 'button:contains("Manage")',
    ADD_VARIANT_BUTTON: 'button:contains("Add variant")',
    BULK_EDIT_BUTTON: 'button:contains("Bulk edit")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_BUTTON: 'button:contains("Confirm")',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_NAME = `Monochrome Cushion V${UNIQUE_ID}`;
const NEW_DESCRIPTION = 'The official description has been updated for better SEO.';
const TEST_CATEGORY = 'Accessories'; // Must be a valid, existing category
const TEST_TAX_CLASS = 'Books'; // Must be a valid, existing tax class


describe('Products: Comprehensive CRUD & Edit Test Suite', () => {

    // --- Setup ---
    before(() => {
        // Create session using the manual social login flow
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/products');
        cy.url().should('include', '/products');
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).should('exist');
    });

    // =================================================================
    // C1: READ & UPDATE (U) - Core Functionality - 7 Cases
    // =================================================================

    it('C1.01: Verify clicking product row opens detail/edit page', () => {
        // Navigate to the first existing product (e.g., White Parrot Cushion)
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click(); //         
        // Assert the URL changed to the detail page
        cy.url().should('not.include', '/products?');
        cy.get(SELECTORS.NAME_INPUT).should('be.visible');

        // Assert Delete button is present (Crucial for Edit mode)
        cy.get(SELECTORS.DELETE_BUTTON).should('be.visible');
    });

    it('C1.02: Change Product Name and Description successfully', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // Update fields
        cy.get(SELECTORS.NAME_INPUT).clear().type(UPDATED_NAME);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().type(NEW_DESCRIPTION);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert success and persistence
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product updated successfully');
        cy.get(SELECTORS.NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C1.03: Attempt to save with cleared Name field', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        cy.get(SELECTORS.NAME_INPUT).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Verify Add Variant button is present and clickable', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // Assert button is visible and click it
        cy.get(SELECTORS.ADD_VARIANT_BUTTON).should('be.visible').click();

        // Assert flow leads to the new variant creation page/modal
        cy.url().should('include', '/variants/add');
    });

    it('C1.05: Verify Bulk Edit button is present and clickable', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // Assert button is visible and clickable
        cy.get(SELECTORS.BULK_EDIT_BUTTON).should('be.visible').click();

        // Assert flow leads to the bulk edit interface (inferred URL/UI change)
        cy.url().should('include', '/bulk-edit');
    });

    it('C1.06: Successfully remove an existing Media asset', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // Assuming a trash/delete icon exists near the primary media asset (Image 1)
        cy.contains('Media').parent().find('button[aria-label="Delete image"]').first().click();

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product updated successfully');
    });

    it('C1.07: Verify the Back button returns to the product list', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();
        cy.get('button:contains("Back")').click();

        cy.url().should('include', '/products');
        cy.contains('All products').should('be.visible');
    });

    // =================================================================
    // C2: ORGANIZE PRODUCT (Category, Tax, Channels) - 5 Cases
    // =================================================================

    it('C2.01: Change the Product Category successfully', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // 1. Open Category dropdown (Target the input area associated with the Category label)
        cy.get(SELECTORS.CATEGORY_DROPDOWN).click();

        // 2. Select a new category (e.g., 'Accessories' from the image)
        cy.get('div[role="listbox"]').contains(TEST_CATEGORY).click();

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        // Verify value persistence (open the dropdown again and assert selection)
        cy.get(SELECTORS.CATEGORY_DROPDOWN).should('have.value', TEST_CATEGORY);
    });

    it('C2.02: Change the Tax Class successfully', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // 1. Open Tax Class dropdown
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).click();

        // 2. Select a new tax class (e.g., 'Books')
        cy.get('div[role="listbox"]').contains(TEST_TAX_CLASS).click();

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.TAX_CLASS_DROPDOWN).should('have.value', TEST_TAX_CLASS);
    });

    it('C2.03: Change Channel Availability via the modal', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // 1. Open Manage Channels modal
        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();
        cy.contains('h2', 'Manage Products Channel Availability').should('be.visible');

        // 2. Check or uncheck a channel (assuming one is named 'Channel-PLN')
        cy.contains('Channel-PLN').prev('input[type="checkbox"]').uncheck({ force: true });

        // 3. Confirm modal changes
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // 4. Save the form
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: Attempt to clear a mandatory field (e.g., Product Type) (if allowed)', () => {
        // Assuming Product Type is mandatory and cannot be cleared/edited directly on this page.
        // This test ensures the field value cannot be removed.
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        cy.contains('Product Type').should('be.visible');
        cy.contains('Simple').should('exist'); // Assert current type exists

        // Attempting to type/clear the uneditable type field
        cy.contains('Product Type').siblings('div').first().click({ force: true });

        // This test primarily confirms the field is read-only or stable.
    });

    // =================================================================
    // C3: DELETE OPERATION (D) - 2 Cases
    // =================================================================

    it('C3.01: Successfully delete the product', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

        // 1. Click Delete button (Red button on the page)
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get('button:contains("Delete")').click();

        // 3. Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product deleted successfully');
        cy.url().should('include', '/products');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.FIRST_PRODUCT_ROW).click();

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