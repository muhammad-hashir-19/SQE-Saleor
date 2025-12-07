/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page Elements
    CREATE_BUTTON: 'button:contains("Create collection")', // Assuming on All Collections page
    FIRST_COLLECTION_ROW: 'tbody tr:first-child a', // Click the link (Collection Name) in the first row

    // Detail/Edit Form Elements
    NAME_INPUT: 'input[name="name"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',
    UPLOAD_IMAGE_BUTTON: 'button:contains("Upload image")',
    MANAGE_CHANNELS_BUTTON: 'button:contains("Manage")',
    // SEO & Metadata
    SEO_SLUG_INPUT: 'input[name="slug"]',
    METADATA_ADD_FIELD_BUTTON: 'button[data-test-id="add-field"]',
    METADATA_KEY_INPUT: '[data-test-id="metadata-key-input"]',
    METADATA_VALUE_INPUT: '[data-test-id="metadata-value-input"]',
    METADATA_DELETE_BUTTON: 'svg[d*="M18.5 8H5.5"]', // Trash can icon SVG path

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]',
    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_NAME = `Updated Collection Name ${UNIQUE_ID}`;
const UPDATED_SLUG = `updated-collection-slug-${UNIQUE_ID}`;
const NEW_DESCRIPTION = 'The description has been modified during the update test run.';


describe('Collections: Comprehensive CRUD & Edit Test Suite', () => {

    // --- Setup ---
    before(() => {
        // Create session using the manual social login flow
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });

        // OPTIONAL: Create a collection here to ensure C2.01 always has data to work with.
        // For simplicity, we assume 'Featured Products' exists.
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/collections');
        cy.url().should('include', '/collections');
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).should('exist');
    });

    // =================================================================
    // C1: CREATE NEW COLLECTION (Simplified from previous request)
    // =================================================================
    // Only one test case to ensure the base flow is validated

    it('C1.01: Successfully create a new collection with minimal data', () => {
        const newCollectionName = `New Collection ${UNIQUE_ID}`;

        cy.get(SELECTORS.CREATE_BUTTON).click();
        cy.url().should('include', '/collections/add');

        cy.get(SELECTORS.NAME_INPUT).type(newCollectionName);
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Collection created successfully');
    });

    // =================================================================
    // C2: EDIT/UPDATE (U) & READ (R) - 9 Cases
    // =================================================================

    it('C2.01: Verify existing collection details load correctly on the edit page', () => {
        // Navigate to the first existing collection
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Assert core fields are pre-populated (Read operation)
        cy.get(SELECTORS.NAME_INPUT).should('not.be.empty');
        cy.get(SELECTORS.NAME_INPUT).invoke('val').then(name => {
            // Assert that the header matches the loaded name
            cy.contains('h2', name).should('be.visible');
        });

        // Assert the delete button is available on an existing item
        cy.get(SELECTORS.DELETE_BUTTON).should('be.visible');
    });

    it('C2.02: Change Name and Description successfully', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Update fields
        cy.get(SELECTORS.NAME_INPUT).clear().type(UPDATED_NAME);
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().type(NEW_DESCRIPTION);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert success and persistence
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Collection updated successfully'); // Assume update text
        cy.get(SELECTORS.NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C2.03: Update SEO Slug field successfully', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Update Slug
        cy.get(SELECTORS.SEO_SLUG_INPUT).clear().type(UPDATED_SLUG);

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.SEO_SLUG_INPUT).should('have.value', UPDATED_SLUG);
    });

    it('C2.04: Update Channel Availability (Toggle and Save)', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Open Manage Channels modal
        cy.get(SELECTORS.MANAGE_CHANNELS_BUTTON).click();

        // Toggle the first channel state (Assuming there's a visible channel to interact with)
        cy.contains('Channel-PLN').prev('input[type="checkbox"]').check({ force: true });
        cy.contains('h2', 'Manage Products Channel Availability').parent().find('button:contains("Confirm")').click();

        // Save the change
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Add and delete a Private Metadata field on existing collection', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Add Private Metadata field
        cy.get(SELECTORS.METADATA_ADD_FIELD_BUTTON).last().click();
        cy.get(SELECTORS.METADATA_KEY_INPUT).last().type('temp_key_edit');
        cy.get(SELECTORS.METADATA_VALUE_INPUT).last().type('temp_value_edit');

        // Delete the newly added field
        cy.get(SELECTORS.METADATA_DELETE_BUTTON).last().click();

        // Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert success and persistence (no error/field is gone)
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('temp_key_edit').should('not.exist');
    });

    it('C2.06: Attempt to save with invalid Name (Clear Name field)', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // Clear the required Name field
        cy.get(SELECTORS.NAME_INPUT).clear();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.07: Attempt to save with duplicate Name (Server Validation)', () => {
        // Create a unique temporary name first
        const tempName = `Temp ${UNIQUE_ID}`;
        cy.get(SELECTORS.CREATE_BUTTON).click();
        cy.get(SELECTORS.NAME_INPUT).type(tempName);
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // Go back to the first collection and set its name to the temporary name
        cy.visit('/collections');
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();
        cy.get(SELECTORS.NAME_INPUT).clear().type(tempName);

        // Save and assert conflict error
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.ERROR_ALERT, { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'A collection with this name already exists.');
    });

    // =================================================================
    // C3: DELETE (D) - 1 Case
    // =================================================================

    it('C3.01: Successfully delete an existing collection', () => {
        // Navigate to edit page
        cy.get(SELECTORS.FIRST_COLLECTION_ROW).click();

        // 1. Click Delete button (Red button on the page)
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get('button:contains("Delete")').click(); // Button in modal

        // 3. Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Collection deleted successfully');
        cy.url().should('include', '/collections');
        cy.get('h2').contains('All Collections').should('be.visible');
    });
});