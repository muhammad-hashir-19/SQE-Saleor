/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: '[data-test-id="button-bar-delete"]',
    BACK_BUTTON: '[data-test-id="button-bar-cancel"]',
    CATEGORY_INPUT: 'input[name="category"]',
    FLAVOR_INPUT: 'input[name="attribute:Flavor"]',
    MANAGE_CHANNELS_BUTTON: '[data-test-id="channels-availability-manage-button"]',
    CONFIRM_BUTTON: 'button:contains("Confirm")',
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess', // Target for success alert

    // SEO & Metadata
    SLUG_INPUT: 'input[name="slug"]',
    SEO_TITLE_INPUT: 'input[name="seoTitle"]',
    SEO_DESC_TEXTAREA: 'textarea[name="seoDescription"]',
    ADD_METADATA_KEY: '[data-test-id="metadata-key-input"]',
    ADD_METADATA_VALUE: '[data-test-id="metadata-value-input"]',
};
// --- Test Data ---
// Use a function to generate a stable, unique timestamp for test data
const TIMESTAMP = new Date().getTime();

const TEST_DATA = {
    VALID_EMAIL: 'zakihaider7860@gmail.com',
    VALID_PASSWORD: '1033614@ZA',
    TEST_PRODUCT_URL: '/products/UHJvZHVjdDoxNjQ%3D',
    // FIX: Use native Date or a simple unique number (like timestamp)
    NEW_PRODUCT_NAME: `Cypress Test Product ${TIMESTAMP}`,
    NEW_SLUG: `cypress-test-slug-${TIMESTAMP}`,
    FLAVOR_OPTION: 'Orange',
    UPDATED_DESCRIPTION: 'This description was updated by a Cypress automation test.',
};

describe('Product Detail Page: Full CRUD and Form Interaction', () => {

    before(() => {
        // 1. CREATE SESSION: Use the manual social login command.
        cy.session('dashboard-user', () => {
            // This executes the manual login flow and waits for the user to resume.
            cy.manualSocialLogin();
        });

        // 2. ASSERT THE FINAL STATE: Assert the application landed on the dashboard
        // This runs only ONCE after the first successful, manual login + resume.
        cy.visit('/'); // Visit the base URL (which should be the dashboard)
        cy.url().should('include', '/dashboard');
        cy.get('input[name="name"]', { timeout: 20000 }).should('exist'); // Assert a known dashboard element exists
    });

    beforeEach(() => {
        // Restore session and navigate to the existing product detail page
        cy.session('dashboard-user', () => { });

        cy.visit(TEST_DATA.TEST_PRODUCT_URL);
        // ... rest of the beforeEach hook remains the same
    });
    // ... rest of the tests ...
    // =================================================================
    // C1: CORE UPDATE (U) & RESILIENCY TESTS
    // =================================================================

    it('C1.1: should successfully update product Name and Description', () => {
        const updatedName = `Updated Name ${Cypress.dayjs().format('HHmmss')}`;

        // 1. Update Name
        cy.get(SELECTORS.NAME_INPUT).clear().type(updatedName);

        // 2. Update Description (Content Editable Div)
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().type(TEST_DATA.UPDATED_DESCRIPTION);

        // 3. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // 4. Assertion: Success Toast and Data Persistence
        cy.get(SELECTORS.SUCCESS_TOAST)
            .should('be.visible')
            .and('contain', 'Product successfully updated');

        // Verify data persistence on page
        cy.get(SELECTORS.NAME_INPUT).should('have.value', updatedName);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).should('have.text', TEST_DATA.UPDATED_DESCRIPTION);
    });

    it('C1.2: should display error when saving with a required field cleared (Negative)', () => {

        // 1. Clear the Product Name (required field)
        cy.get(SELECTORS.NAME_INPUT).clear();

        // 2. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // 3. Assertion: Error message near the field
        cy.get('label:contains("Name")').parent().should('contain', 'This field is required');
    });

    // =================================================================
    // C2: PRODUCT ATTRIBUTE, TYPE, & AVAILABILITY TESTS
    // =================================================================

    it('C2.1: should correctly set Product Category (Juices)', () => {
        const newCategory = 'Juices';

        // 1. Click the Category input to open the dropdown
        cy.get(SELECTORS.CATEGORY_INPUT).click();

        // 2. Select the option by visible text
        cy.get('div').contains(newCategory).click();

        // 3. Save and assert success
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.2: should select a Flavor Attribute (Orange)', () => {

        // 1. Click the Flavor input (Combobox) to open the options
        cy.get(SELECTORS.FLAVOR_INPUT).click();

        // 2. Select 'Orange' from the available list of flavors
        cy.get('div').contains(TEST_DATA.FLAVOR_OPTION).click();

        // 3. Save and assert success
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // 4. Verify selection is reflected
        cy.get(SELECTORS.FLAVOR_INPUT).should('have.value', TEST_DATA.FLAVOR_OPTION);
    });

    it('C2.3: should update Channel Availability (Toggle)', () => {

        // 1. Click the "Manage" button to open the modal
        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();

        // 2. Check the modal is open 
        cy.contains('h2', 'Manage Products Channel Availability').should('be.visible');

        // 3. Toggle 'Select All Channels' (to ensure change)
        cy.get('input[type="checkbox"]').contains('Select All Channels').check();
        cy.get('input[type="checkbox"]').contains('Select All Channels').uncheck();

        // 4. Click Confirm button
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // 5. Assert modal closes and save
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C3: SEO, MEDIA, AND METADATA TESTS
    // =================================================================

    it('C3.1: should update all SEO fields and save successfully', () => {
        const newTitle = 'Juicy Apple SEO Title for Automation Test';
        const newDesc = 'This is a dedicated description for search engine optimization.';

        // 1. Update SEO Slug
        cy.get(SELECTORS.SLUG_INPUT).clear().type(TEST_DATA.NEW_SLUG);

        // 2. Update SEO Title
        cy.get(SELECTORS.SEO_TITLE_INPUT).clear().type(newTitle);

        // 3. Update SEO Description
        cy.get(SELECTORS.SEO_DESC_TEXTAREA).type(newDesc);

        // 4. Save and assert success
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // 5. Verification: Check data persistence
        cy.get(SELECTORS.SLUG_INPUT).should('have.value', TEST_DATA.NEW_SLUG);
    });

    it('C3.2: should add and remove public Metadata fields', () => {
        const metadataKey = `cypress_test_key_${Cypress.dayjs().format('HHmmss')}`;
        const metadataValue = 'Cypress Metadata Value';

        // 1. Scroll to the Metadata section and click 'Add Field'
        cy.contains('h2', 'Metadata').scrollIntoView();
        cy.contains('button', 'Add field').click();

        // 2. Fill in the new Public Metadata key and value
        cy.get(SELECTORS.ADD_METADATA_KEY).last().type(metadataKey);
        cy.get(SELECTORS.ADD_METADATA_VALUE).last().type(metadataValue);

        // 3. Save and assert success
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // 4. Test Deletion: Click the delete button for the new field
        cy.get('button[aria-label="Delete metadata field"]').last().click();
        cy.get(SELECTORS.CONFIRM_BUTTON).click(); // Confirm deletion

        // 5. Save and assert success
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.3: should handle media upload interaction (UI Test)', () => {
        // Test that the button correctly triggers the file selection dialog.

        // 1. Click the Upload button
        cy.get('[data-test-id="button-upload-image"]').click();

        // 2. Assert that the file input dialog is present
        cy.get('input[type="file"]').should('exist');
    });

    // =================================================================
    // C4: NAVIGATION & DELETION (D) TESTS
    // =================================================================

    it('C4.1: should navigate back to the product list using the "Back" button', () => {
        // 1. Click the Back button
        cy.get(SELECTORS.BACK_BUTTON).contains('Back').click();

        // 2. Assert redirection to the product list page
        cy.url().should('include', '/products');
        cy.url().should('not.include', TEST_DATA.TEST_PRODUCT_URL);
    });

    it('C4.2: should successfully delete the product and redirect to the list', () => {
        // NOTE: This test should ideally be run on a freshly created product to avoid data loss.

        // 1. Click the Delete button
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Assert and confirm the deletion modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_BUTTON).click();

        // 3. Assertion: Success Toast and Redirection
        cy.get(SELECTORS.SUCCESS_TOAST)
            .should('be.visible')
            .and('contain', 'Product successfully deleted');

        cy.url().should('include', '/products');
    });
});