/// <reference types="cypress" />

// --- RESILIENT SELECTORS (Defined once for use) ---
const SELECTORS = {
    // General Information
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    // Search Engine Optimization (SEO)
    SEO_SLUG_INPUT: 'input[name="slug"]',
    SEO_TITLE_INPUT: 'input[name="seoTitle"]',
    SEO_DESC_TEXTAREA: 'textarea[name="seoDescription"]',
    // Metadata (Public & Private)
    METADATA_ADD_FIELD_BUTTON: 'button[data-test-id="add-field"]',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',
    METADATA_VALUE_INPUT: '[data-test-id="metadata-value-input"]',
    METADATA_DELETE_BUTTON: 'svg[d*="M18.5 8H5.5"]', // Trash can icon SVG path
    // Bar Buttons
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]',
    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const MAX_SEO_TITLE = 70;
const MAX_SEO_DESC = 300;


describe('Category Form: Comprehensive Blackbox Test Suite', () => {

    // --- Setup (Assumes cy.session and cy.manualSocialLogin are available) ---
    before(() => {
        // Creates and saves the authenticated session state before the tests run.
        cy.session('dashboard-user', () => {
            cy.manualSocialLogin();
        });
    });

    beforeEach(() => {
        // Restores session and navigates to the "Add Category" page for each test.
        cy.session('dashboard-user', () => { });
        cy.visit('/categories/add');
        cy.get(SELECTORS.NAME_INPUT).should('be.visible');
    });

    // =================================================================
    // C1: Functional & Happy Path (Successful Creation) - 5 Cases
    // =================================================================

    it('C1.01: Create category with minimal valid data (Name only)', () => {
        const categoryName = `Seasonal Produce ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(categoryName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST)
            .should('be.visible')
            .and('contain', 'Category created successfully');
    });

    it('C1.02: Create category using Name, Description, and full SEO', () => {
        const categoryName = `E-Book Downloads ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(categoryName);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).type('This category contains all digital assets related to reading and learning.');

        // SEO Fields
        cy.get(SELECTORS.SEO_SLUG_INPUT).type('e-book-downloads-digital');
        cy.get(SELECTORS.SEO_TITLE_INPUT).type('Download E-Books and Digital Media');
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type('Official Saleor store for digital content, guides, and manuals in PDF format.');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Create category with Public and Private metadata added', () => {
        const categoryName = `System Category ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(categoryName);

        // Add Public Metadata 
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('public_display_name');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('Visible Name');

        // Add Private Metadata
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('integration_id');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).last().type('ERP_ID_99876');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Check "Back" button correctly aborts creation', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Unsaved Draft Category');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/categories');
        cy.get(SELECTORS.NAME_INPUT).should('not.exist');
    });

    it('C1.05: SEO Preview Section should toggle visibility correctly', () => {
        // Test toggling the collapsible section
        cy.contains('Search Engine Preview').should('be.visible');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('be.visible');

        // Click to collapse
        cy.get('svg[data-macaw-ui-component="Icon"]').first().click();

        // Assert content is hidden (input no longer exists/is detached)
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('not.be.visible');
    });

    // =================================================================
    // C2: Boundary Value Analysis (BVA) & Negative Testing - 7 Cases
    // =================================================================

    it('C2.01: Attempt to save with Category Name empty (BVA: 0 chars)', () => {
        // Test required field validation
        cy.get(SELECTORS.NAME_INPUT).should('have.value', '');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.02: Name input with minimal length (1 character)', () => {
        // BVA: Min Length (1 char) - Must pass
        cy.get(SELECTORS.NAME_INPUT).type('Z');
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: SEO Title field (N=70) maximum length', () => {
        // BVA: Max Length (N=70 chars) - Must pass
        const maxTitle = 'T'.repeat(MAX_SEO_TITLE);
        cy.get(SELECTORS.NAME_INPUT).type(`BVA Title Max ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_TITLE_INPUT).type(maxTitle);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: SEO Title field (N+1) length truncation check', () => {
        // BVA: Max Length + 1 (N+1) - Checks if input truncates automatically
        const excessiveTitle = 'T'.repeat(MAX_SEO_TITLE + 1);
        cy.get(SELECTORS.NAME_INPUT).type(`BVA Title Over ${UNIQUE_ID}`);

        // Input should automatically stop at 70 characters
        cy.get(SELECTORS.SEO_TITLE_INPUT).type(excessiveTitle).should('have.value', 'T'.repeat(MAX_SEO_TITLE));
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: SEO Description field (N=300) maximum length', () => {
        // BVA: Max Length (N=300 chars) - Must pass
        const maxDesc = 'D'.repeat(MAX_SEO_DESC);
        cy.get(SELECTORS.NAME_INPUT).type(`BVA Desc Max ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type(maxDesc);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: SEO Slug field using invalid URL characters (Sanitization check)', () => {
        // ECP: Invalid characters in URL slug
        const name = "Seasonal Flowers & Gifts!";
        const expectedSlug = "seasonal-flowers-gifts"; // Assumes sanitization removes non-alphanumeric and converts to hyphen

        cy.get(SELECTORS.NAME_INPUT).type(name);
        cy.wait(500); // Wait for auto-generation

        cy.get(SELECTORS.SEO_SLUG_INPUT).should('contain.value', expectedSlug);
    });

    it('C2.07: Attempt to save with a non-unique Category Name (Server Validation)', () => {
        // ECP: Invalid Class (Duplicate Name) - Use 'Groceries' from the list screenshot
        const existingName = 'Groceries';

        cy.get(SELECTORS.NAME_INPUT).type(existingName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Check for server-side error message
        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'A category with this name already exists.');
    });

    // =================================================================
    // C3: Cross-Functional & Integration Tests - 4 Cases
    // =================================================================

    it('C3.01: Category Name changes should auto-update the Slug field', () => {
        const initialName = 'Mens Wear';
        const finalName = 'Womens Shoes';

        cy.get(SELECTORS.NAME_INPUT).type(initialName);
        cy.wait(500);
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', 'mens-wear');

        cy.get(SELECTORS.NAME_INPUT).clear().type(finalName);
        cy.wait(500);
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', 'womens-shoes');
    });

    it('C3.02: Manually set Slug should NOT be overridden by Name change', () => {
        const initialName = 'Auto Generate Name';
        const manualSlug = 'manual-category-v1';

        cy.get(SELECTORS.NAME_INPUT).type(initialName);
        // Manually set the slug
        cy.get(SELECTORS.SEO_SLUG_INPUT).clear().type(manualSlug);

        // Change the name again (should not change the slug)
        cy.get(SELECTORS.NAME_INPUT).type(' v2');

        // Assert the slug remains the manually entered value
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', manualSlug);
    });

    it('C3.03: Saving without Description should not interfere with other fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Sparse Category Save');
        cy.get(SELECTORS.SEO_TITLE_INPUT).type('SEO OK');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).should('be.empty');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.04: Verify saving an empty Description field (Explicitly cleared)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Cleared Desc Test');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C4: Metadata and UI Integrity Tests - 5 Cases
    // =================================================================

    it('C4.01: Should dynamically add multiple Public Metadata fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Multi-Metadata Test');

        // Add first field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('key_release');

        // Add second field (target the second visible key input)
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(1).type('key_version');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).eq(1).type('2.1.0');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C4.02: Should successfully delete an added Private Metadata field', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Delete Metadata Test');

        // Add Private Metadata field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('temp_delete_key');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).last().type('mark_for_deletion');

        // Delete the field using the specific delete button selector (trash icon)
        cy.get(SELECTORS.METADATA_DELETE_BUTTON).last().click();

        // Check that the key input field no longer contains the value (or is gone)
        cy.contains('temp_delete_key').should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C4.03: Attempt to save with empty Metadata Key (Negative)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Empty Key Failure');

        // Add Metadata field and leave Key blank
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('some value');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error on the Metadata key field (usually a general form error)
        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Metadata key cannot be empty'); // Assume server error text
    });

    it('C4.04: Attempt to save with duplicate Metadata Keys (Negative)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Duplicate Key Failure');
        const key = 'dup_key';

        // Add first field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type(key);

        // Add second field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(1).type(key);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert server-side error
        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Duplicate metadata keys are not allowed');
    });

    it('C4.05: Verify Private Metadata fields are distinct from Public fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Isolation Check');

        // Add Public field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('PUB_KEY');

        // Add Private field (using the second 'Add Field' button)
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('PRI_KEY');

        // Assert two unique key fields were successfully added (no conflict)
        cy.get(SELECTORS.METADATA_KEY_INPUT).should('have.length', 2);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });
});