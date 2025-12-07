/// <reference types="cypress" />

// --- RESILIENT SELECTORS (Using Category/Product selectors as they are identical UI components) ---
const SELECTORS = {
    // General Information
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    UPLOAD_IMAGE_BUTTON: 'button:contains("Upload image")',
    MANAGE_CHANNELS_BUTTON: 'button:contains("Manage")',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
    // Search Engine Optimization (SEO)
    SEO_SLUG_INPUT: 'input[name="slug"]',
    SEO_TITLE_INPUT: 'input[name="seoTitle"]',
    SEO_DESC_TEXTAREA: 'textarea[name="seoDescription"]',
    // Metadata (Public & Private)
    METADATA_ADD_FIELD_BUTTON: 'button[data-test-id="add-field"]',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',
    METADATA_VALUE_INPUT: '[data-test-id="metadata-value-input"]',
    METADATA_DELETE_BUTTON: 'svg[d*="M18.5 8H5.5"]',
    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]',
    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const MAX_SEO_TITLE = 70;
const MAX_SEO_DESC = 300;


describe('Collections Form: Comprehensive Blackbox Test Suite', () => {

    // --- Setup (Assumes cy.session and cy.manualSocialLogin are available) ---
    before(() => {
        cy.session('dashboard-user', () => {
            cy.manualSocialLogin();
        });
        // Create a dummy image file for upload testing (Requires 'test-image.png' fixture)
        cy.fixture('test-image.png', 'base64').as('testImage');
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/collections/add');
        cy.get(SELECTORS.NAME_INPUT).should('be.visible');
    });

    // =================================================================
    // C1: Functional & Happy Path (Successful Creation) - 6 Cases
    // =================================================================

    it('C1.01: Create collection with minimal valid data (Name only)', () => {
        const collectionName = `Flash Sale Items ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Collection created successfully');
        cy.url().should('not.include', '/add');
    });

    it('C1.02: Create collection using Name, Description, and full SEO', () => {
        const collectionName = `Seasonal Picks ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).type('A collection curated for the autumn shopping season.');

        cy.get(SELECTORS.SEO_SLUG_INPUT).type('seasonal-picks-2025');
        cy.get(SELECTORS.SEO_TITLE_INPUT).type('Best Seasonal Picks Available Now');
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type('Official Saleor collection featuring top-rated seasonal apparel and accessories.');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Create collection with Public and Private metadata added', () => {
        const collectionName = `System Tags ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('client_tag');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('priority_high');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('inventory_source');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).last().type('warehouse_B_rack_2');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Should select channel availability and save', () => {
        const collectionName = `Channel Test ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);

        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();
        cy.contains('h2', 'Manage Products Channel Availability').should('be.visible');

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Should successfully upload a background image', function () {
        const collectionName = `Media Test ${UNIQUE_ID}`;

        // Selects the dummy image fixture
        cy.get(SELECTORS.UPLOAD_IMAGE_BUTTON)
            .siblings('input[type="file"]')
            .selectFile({
                contents: Cypress.Buffer.from(this.testImage, 'base64'),
                fileName: 'test-image.png',
                mimeType: 'image/png',
                encoding: 'base64',
            }, { force: true });

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Check "Back" button correctly aborts creation', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Unsaved Draft Collection');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/collections');
    });


    // =================================================================
    // C2: Boundary Value Analysis (BVA) & Negative Testing - 9 Cases
    // =================================================================

    it('C2.01: Attempt to save with Name empty (BVA: 0 chars)', () => {
        cy.get(SELECTORS.NAME_INPUT).should('have.value', '');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.02: Attempt to save with non-unique Name (Server Validation)', () => {
        const existingName = 'Featured Products';

        cy.get(SELECTORS.NAME_INPUT).type(existingName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'A collection with this name already exists.');
    });

    it('C2.03: SEO Title field (N=70) maximum length', () => {
        const maxTitle = 'T'.repeat(MAX_SEO_TITLE);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO BVA N ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_TITLE_INPUT).type(maxTitle);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: SEO Title field (N+1) length truncation check', () => {
        const excessiveTitle = 'T'.repeat(MAX_SEO_TITLE + 1);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO BVA N+1 ${UNIQUE_ID}`);

        cy.get(SELECTORS.SEO_TITLE_INPUT).type(excessiveTitle).should('have.value', 'T'.repeat(MAX_SEO_TITLE));
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: SEO Description field (N=300) maximum length', () => {
        const maxDesc = 'D'.repeat(MAX_SEO_DESC);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO Desc N ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type(maxDesc);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: SEO Slug field using invalid URL characters (Sanitization check)', () => {
        const name = "New Deals! % 2025";
        const expectedSlug = "new-deals-2025";

        cy.get(SELECTORS.NAME_INPUT).type(name);
        cy.wait(500);

        cy.get(SELECTORS.SEO_SLUG_INPUT).should('contain.value', expectedSlug);
    });

    it('C2.07: Attempt to save with empty Metadata Key (ECP: Invalid)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Empty Key Failure');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('some value');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Metadata key cannot be empty');
    });

    it('C2.08: Attempt to save with duplicate Metadata Keys (ECP: Invalid)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Duplicate Key Failure');
        const key = 'dup_key';

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type(key);

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(1).type(key);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Duplicate metadata keys are not allowed');
    });

    it('C2.09: Attempt to save with only spaces in Name field (Whitespace validation)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('   ');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    // =================================================================
    // C3: Cross-Functional & Integration Tests - 10 Cases
    // =================================================================

    it('C3.01: Name change should auto-update Slug, then manually override', () => {
        const newName = 'Spring Launch Products';
        const finalSlug = 'spring-launch-final-v3';

        cy.get(SELECTORS.NAME_INPUT).type('Old Name');
        cy.wait(500);

        cy.get(SELECTORS.NAME_INPUT).clear().type(newName);
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', 'spring-launch-products');

        cy.get(SELECTORS.SEO_SLUG_INPUT).clear().type(finalSlug);
        cy.get(SELECTORS.NAME_INPUT).type(' FINAL');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', finalSlug);
    });

    it('C3.02: Manually set Slug should NOT be overridden by Name change', () => {
        const initialName = 'Auto Generate Name';
        const manualSlug = 'manual-collection-v1';

        cy.get(SELECTORS.NAME_INPUT).type(initialName);
        cy.get(SELECTORS.SEO_SLUG_INPUT).clear().type(manualSlug);

        cy.get(SELECTORS.NAME_INPUT).type(' (updated)');

        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', manualSlug);
    });

    it('C3.03: Saving without Description should not interfere with other fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Sparse Collection Save');
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

    it('C3.05: Should dynamically add multiple Public Metadata fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Multi-Metadata');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('key_one');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(1).type('key_two');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).eq(1).type('value_two');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.06: Should successfully delete an added Private Metadata field', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Delete Metadata Test');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('temp_delete_key');

        cy.get(SELECTORS.METADATA_DELETE_BUTTON).last().click();

        cy.contains('temp_delete_key').should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.07: Attempt to save with empty Metadata Value (Passes if Value is optional)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Empty Value Test');

        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('key_value_empty');
        // Value field is left empty

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // This test asserts the value field is optional. If successful, it passes.
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.08: Test Name field with excessive special characters', () => {
        const excessiveName = 'Test!@#%^&*()_+-=[]\\{}|;:\'"<>,./?`~';

        cy.get(SELECTORS.NAME_INPUT).type(excessiveName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Check if the server accepts the name but sanitizes the slug
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.url().should('not.contain', '@');
    });

    it('C3.09: Verify all fields are empty/default on page load', () => {
        cy.get(SELECTORS.NAME_INPUT).should('have.value', '');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).should('be.empty');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', '');
        cy.get(SELECTORS.SEO_TITLE_INPUT).should('have.value', '');
    });

    it('C3.10: Test Name field with long input (beyond visual boundary)', () => {
        const longName = 'L'.repeat(200);

        cy.get(SELECTORS.NAME_INPUT).type(longName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        // Verify the long name was saved successfully
        cy.get(SELECTORS.NAME_INPUT).should('have.value', longName);
    });
});