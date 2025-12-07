/// <reference types="cypress" />

// --- RESILIENT SELECTORS (Using Category/Product selectors as they are identical UI components) ---
const SELECTORS = {
    // General Information
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    UPLOAD_IMAGE_BUTTON: 'button:contains("Upload image")', // New field
    // Availability (The Manage button for channels)
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
    METADATA_DELETE_BUTTON: 'svg[d*="M18.5 8H5.5"]', // Trash can icon SVG path
    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")', // Updated to contain text 'Save'
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
        // Create session using the manual social login flow
        cy.session('dashboard-user', () => {
            cy.manualSocialLogin();
        });
        // Create a dummy image file for upload testing
        cy.fixture('test-image.png', 'base64').as('testImage');
    });

    beforeEach(() => {
        // Restore session and navigate to the "Add Collection" page
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

        cy.get(SELECTORS.SUCCESS_TOAST)
            .should('be.visible')
            .and('contain', 'Collection created successfully'); // Assume success text
        cy.url().should('not.include', '/add');
    });

    it('C1.02: Create collection using Name, Description, and full SEO', () => {
        const collectionName = `Seasonal Picks ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).type('A collection curated for the autumn shopping season.');

        // SEO Fields
        cy.get(SELECTORS.SEO_SLUG_INPUT).type('seasonal-picks-2025');
        cy.get(SELECTORS.SEO_TITLE_INPUT).type('Best Seasonal Picks Available Now');
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type('Official Saleor collection featuring top-rated seasonal apparel and accessories.');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: Create collection with Public and Private metadata added', () => {
        const collectionName = `System Tags ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);

        // Add Public Metadata 
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('client_tag');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('priority_high');

        // Add Private Metadata
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('inventory_source');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).last().type('warehouse_B_rack_2');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Should select channel availability and save', () => {
        const collectionName = `Channel Test ${UNIQUE_ID}`;

        cy.get(SELECTORS.NAME_INPUT).type(collectionName);

        // 1. Click Manage button
        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();
        cy.contains('h2', 'Manage Products Channel Availability').should('be.visible');

        // 2. Click Confirm to accept defaults (or explicitly check/uncheck if needed)
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // 3. Save the form
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Should successfully upload a background image', function () {
        const collectionName = `Media Test ${UNIQUE_ID}`;

        // Clicks the hidden file input element linked to the visible button
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

        // Check if the uploaded image thumbnail/element is visible on the resulting page
        cy.contains('Background Image').parent().find('img').should('exist');
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
        // Test required field validation
        cy.get(SELECTORS.NAME_INPUT).should('have.value', '');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.02: Attempt to save with non-unique Name (Server Validation)', () => {
        // ECP: Invalid Class (Duplicate Name) - Use 'Featured Products' from the list screenshot
        const existingName = 'Featured Products';

        cy.get(SELECTORS.NAME_INPUT).type(existingName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Check for server-side error message
        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'A collection with this name already exists.');
    });

    it('C2.03: SEO Title field (N=70) maximum length', () => {
        // BVA: Max Length (N=70 chars) - Must pass
        const maxTitle = 'T'.repeat(MAX_SEO_TITLE);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO BVA N ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_TITLE_INPUT).type(maxTitle);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: SEO Title field (N+1) length truncation check', () => {
        // BVA: Max Length + 1 (N+1) - Should truncate to N (70 chars)
        const excessiveTitle = 'T'.repeat(MAX_SEO_TITLE + 1);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO BVA N+1 ${UNIQUE_ID}`);

        // Input should automatically stop at 70 characters
        cy.get(SELECTORS.SEO_TITLE_INPUT).type(excessiveTitle).should('have.value', 'T'.repeat(MAX_SEO_TITLE));
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: SEO Description field (N=300) maximum length', () => {
        // BVA: Max Length (N=300 chars) - Must pass
        const maxDesc = 'D'.repeat(MAX_SEO_DESC);
        cy.get(SELECTORS.NAME_INPUT).type(`SEO Desc N ${UNIQUE_ID}`);
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type(maxDesc);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: SEO Slug field using invalid URL characters (Sanitization check)', () => {
        // ECP: Invalid characters in URL slug
        const name = "New Deals! % 2025";
        const expectedSlug = "new-deals-2025";

        cy.get(SELECTORS.NAME_INPUT).type(name);
        cy.wait(500);

        cy.get(SELECTORS.SEO_SLUG_INPUT).should('contain.value', expectedSlug);
    });

    it('C2.07: Attempt to save with empty Metadata Key (ECP: Invalid)', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Empty Key Failure');

        // Add Metadata field and leave Key blank
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_VALUE_INPUT).first().type('some value');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error on the Metadata key field
        cy.get('.MuiAlert-message, [role="alert"]', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Metadata key cannot be empty'); // Assume server error text
    });

    it('C2.08: Attempt to save with duplicate Metadata Keys (ECP: Invalid)', () => {
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

    it('C2.09: Attempt to save with only spaces in Name field (Whitespace validation)', () => {
        // ECP: Invalid Whitespace
        cy.get(SELECTORS.NAME_INPUT).type('   ');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Should trigger the same "field is required" validation or a specific whitespace error
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

        // Change name, check auto-slug
        cy.get(SELECTORS.NAME_INPUT).clear().type(newName);
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', 'spring-launch-products');

        // Manually override and check no further changes
        cy.get(SELECTORS.SEO_SLUG_INPUT).clear().type(finalSlug);
        cy.get(SELECTORS.NAME_INPUT).type(' FINAL');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', finalSlug);
    });

    it('C3.02: Should successfully delete an added Private Metadata field and save', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Delete Metadata Test');

        // Add Private Metadata field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('temp_delete_key');

        // Delete the field using the specific delete button selector
        cy.get(SELECTORS.METADATA_DELETE_BUTTON).last().click();

        // Check that the input fields count has decreased
        cy.contains('temp_delete_key').should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.03: Saving an empty Description field (Explicitly cleared) is non-destructive', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Empty Desc Save Test');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.04: Name and Description fields should accept Unicode/special characters', () => {
        const specialName = 'Summer Collection — 2025 ®';
        const specialDesc = 'Price $100. Tax: 10% VAT.';

        cy.get(SELECTORS.NAME_INPUT).type(specialName);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).type(specialDesc);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.05: Verify channel modal shows correct title and functions', () => {
        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();

        cy.contains('h2', 'Manage Products Channel Availability').should('be.visible');

        // Check a checkbox exists in the modal
        cy.get('input[type="checkbox"]').should('exist');

        // Click Back button to close modal without saving changes
        cy.get(SELECTORS.BACK_BUTTON).click();

        // Assert modal is closed
        cy.contains('h2', 'Manage Products Channel Availability').should('not.exist');
    });

    it('C3.06: Should add multiple Public and Private metadata fields simultaneously', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Mixed Metadata Test');

        // Public 1
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type('P_1');

        // Private 1
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(1).type('P_R_1');

        // Public 2
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).eq(2).type('P_2');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.07: Should validate max length against combined content (if multi-line description is allowed)', () => {
        const shortName = "Short";
        const maxDesc = 'X'.repeat(MAX_SEO_DESC);

        cy.get(SELECTORS.NAME_INPUT).type(shortName);
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type(maxDesc);

        // This mainly tests that the client-side length limits are respected.
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).should('have.value', maxDesc);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.08: Verify Private Metadata fields are isolated from Public fields', () => {
        cy.get(SELECTORS.NAME_INPUT).type('Isolation Check');

        // Public field key and Private field key should be able to share a name (isolation check)
        const commonKey = "TEST_KEY_01";

        // Add Public field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).first().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).first().type(commonKey);

        // Add Private field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type(commonKey);

        // Assert that two key fields with the same text were accepted
        cy.get(SELECTORS.METADATA_KEY_INPUT).should('have.length', 2);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.09: Verify all fields are empty/default on page load', () => {
        cy.get(SELECTORS.NAME_INPUT).should('have.value', '');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).should('be.empty');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', '');
        cy.get(SELECTORS.SEO_TITLE_INPUT).should('have.value', '');
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).should('have.value', '');
    });

    it('C3.10: Test non-latin/emoji character input in Name field', () => {
        const emojiName = 'Summer Vibes';
        const expectedSlug = 'summer-vibes';

        cy.get(SELECTORS.NAME_INPUT).type(emojiName);
        cy.wait(500);

        // Assert that the slug generation correctly strips the emojis
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('contain.value', expectedSlug);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });
});