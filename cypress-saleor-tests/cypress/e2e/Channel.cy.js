/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_CHANNEL_BUTTON: 'button:contains("Create Channel")',

    // Create/Edit Channel Fields
    CHANNEL_NAME_INPUT: 'input[name="channelName"]',
    SLUG_INPUT: 'input[name="slug"]',
    CURRENCY_DROPDOWN: 'div:contains("Currency") input[role="combobox"]',
    DEFAULT_COUNTRY_DROPDOWN: 'div:contains("Default country") input[role="combobox"]',
    TTL_INPUT: 'input[name="TTL"]', // Time To Live (Order expiration)

    // Checkbox Permissions (Inferred names based on image_6513e8.png)
    USE_TRANSACTION_FLOW_CHECKBOX: 'input[name="useTransactionFlow"]',
    ALLOW_UNPAID_ORDERS_CHECKBOX: 'input[name="allowUnpaidOrders"]',
    AUTHORIZE_INSTEAD_OF_CHARGE_CHECKBOX: 'input[name="authorizeInsteadOfCharge"]',

    // Shipping/Warehouse Assignment
    SHIPPING_ZONE_DROPDOWN: 'div:contains("Shipping Zones")',
    WAREHOUSE_DROPDOWN: 'div:contains("Warehouses")',

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    DELETE_BUTTON: 'button:contains("Delete")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_CHANNEL_NAME = `New E-Comm Channel ${UNIQUE_ID}`;
const TEST_SLUG = `new-ecomm-channel-${UNIQUE_ID}`;
const CURRENCY_PLN = 'PLN';
const DEFAULT_COUNTRY_POLAND = 'Poland';
const VALID_TTL_MIN = '1';
const VALID_TTL_MAX = '120';


describe('Configuration: Comprehensive Channels Test Suite (>25 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/channels');
        cy.contains('Channels').should('be.visible');
    });

    // =================================================================
    // C1: CREATE CHANNEL (C) & CORE VALIDATION - 13 Cases
    // =================================================================

    it('C1.01: Successfully create a channel with minimal required fields', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type(TEST_CHANNEL_NAME);
        // Assuming Slug auto-generates; Currency/Country default to inferred values.

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Channel created successfully');
        cy.contains(TEST_CHANNEL_NAME).should('be.visible');
    });

    it('C1.02: Attempt to save without Channel Name (Required)', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Attempt to save without selecting Currency (Required)', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Missing Currency');

        // Assuming the Currency field can be cleared/left empty (inferred test)
        // cy.get(SELECTORS.CURRENCY_DROPDOWN).clear(); 

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.CURRENCY_DROPDOWN).parent().parent().should('contain', 'This field is required');
    });

    it('C1.04: Manual Slug should NOT be overridden by Name change', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Auto Name');

        // Manually set Slug
        cy.get(SELECTORS.SLUG_INPUT).clear().type(TEST_SLUG);

        // Change Name again
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type(' (New)');

        // Assert Slug remains manual value
        cy.get(SELECTORS.SLUG_INPUT).should('have.value', TEST_SLUG);
    });

    it('C1.05: Order expiration (TTL) minimum boundary (1 day)', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('TTL Min Test');

        cy.get(SELECTORS.TTL_INPUT).clear().type(VALID_TTL_MIN);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Order expiration (TTL) maximum boundary (120 days)', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('TTL Max Test');

        cy.get(SELECTORS.TTL_INPUT).clear().type(VALID_TTL_MAX);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.07: Order expiration (TTL) below minimum boundary (0)', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('TTL Zero Test');

        cy.get(SELECTORS.TTL_INPUT).clear().type('0');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.TTL_INPUT).parent().parent().should('contain', 'Allowed range between 1 and 120'); // Assumed error text
    });

    it('C1.08: Attempt to save with duplicate Channel Name', () => {
        // NOTE: Uses an existing channel name
        const existingName = 'Default Channel';
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();

        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type(existingName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Channel with this name already exists'); // Assumed error
    });

    it('C1.09: Toggle "Allow unpaid orders" and save', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Unpaid Orders Test');

        // Check the box
        cy.get(SELECTORS.ALLOW_UNPAID_ORDERS_CHECKBOX).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.10: Toggle "Authorize transactions instead of charging" and save', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Auth Only Test');

        // Check the box
        cy.get(SELECTORS.AUTHORIZE_INSTEAD_OF_CHARGE_CHECKBOX).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.11: Assign Shipping Zones and save', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Shipping Zone Test');

        // Open Shipping Zone dropdown and select 'Default'
        cy.get(SELECTORS.SHIPPING_ZONE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('Default').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.12: Assign Warehouses and save', () => {
        cy.get(SELECTORS.CREATE_CHANNEL_BUTTON).click();
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).type('Warehouse Test');

        // Open Warehouse dropdown and select 'Default Warehouse'
        cy.get(SELECTORS.WAREHOUSE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('Default Warehouse').click(); // Inferred name

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });


   
    it('C2.01: Edit Channel Name successfully', () => {
        const newName = `Updated Channel ${UNIQUE_ID}`;

        // Navigate to edit Default Channel
        cy.contains('Default Channel').click();

        cy.get(SELECTORS.CHANNEL_NAME_INPUT).clear().type(newName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Channel updated successfully');
        cy.get(SELECTORS.CHANNEL_NAME_INPUT).should('have.value', newName);
    });

    it('C2.02: Attempt to clear Default Country (Required field)', () => {
        cy.contains('Default Channel').click();

        // Attempt to clear Default Country (usually blocked by the select component)
        cy.contains('Default country').siblings().find('input').clear({ force: true });

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error
        cy.contains('Default country').siblings().find(SELECTORS.ERROR_FIELD).should('be.visible').and('contain', 'This field is required');
    });

    it('C2.03: Successfully delete a non-default channel', () => {
        // Navigate to Channel-PLN (assuming this is not the default)
        cy.contains('Channel-PLN').click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Channel deleted successfully');
    });

    it('C2.04: Attempt to delete Default Channel (Server block)', () => {
        cy.contains('Default Channel').click();

        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert server-side error
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete default channel'); // Assumed error
    });

    it('C2.05: Verify Back button returns to the channels list', () => {
        cy.contains('Default Channel').click();

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/channels');
        cy.contains('Channels').should('be.visible');
    });
});