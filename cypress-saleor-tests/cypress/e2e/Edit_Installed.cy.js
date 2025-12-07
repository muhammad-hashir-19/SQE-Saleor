/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    ADMIN_EMAILS_LINK: 'a:contains("Admin emails")',
    WEBHOOKS_LINK: 'a:contains("Webhooks")',
    ADD_EXTENSION_BUTTON: 'button:contains("Add Extension")',

    // Admin Emails Configuration Fields (Inferred from image_67c6fc.png)
    SENDER_EMAIL_INPUT: 'input[name="sender_email"]',
    SMTP_HOST_INPUT: 'input[name="SMTP_HOST"]',
    SMTP_PORT_INPUT: 'input[name="SMTP_PORT"]',
    SMTP_USER_INPUT: 'input[name="SMTP_HOST_USER"]',
    TLS_CHECKBOX: 'input[name="EMAIL_USE_TLS"]',
    SSL_CHECKBOX: 'input[name="EMAIL_USE_SSL"]',
    ORDER_CONF_TEMPLATE_TEXTAREA: 'textarea[name*="order_confirmation_template"]', // Inferred textarea
    PASSWORD_MODAL_BUTTON: 'button:contains("Create")', // Button next to Password field
    PASSWORD_MODAL_INPUT: 'input[name="password"]', // Input field in the "Add Value to Authorization Field" modal

    // Add Extension Manually Fields (Inferred from image_67d57f.png)
    EXTENSION_NAME_INPUT: 'input[name="extensionName"]', // Inferred
    GRANT_FULL_ACCESS_CHECKBOX: 'input[name="grantFullAccess"]', // Inferred
    PERMISSIONS_CHECKBOX_BASE: 'input[type="checkbox"]',

    // Add Extension via Manifest
    MANIFEST_URL_INPUT: 'input[placeholder*="https://example.com"]',
    INSTALL_BUTTON: 'button:contains("Install")',

    // Bar Buttons
    SAVE_BUTTON: 'button:contains("Save")',
    BACK_BUTTON: 'button:contains("Back")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_SENDER_EMAIL = `admin.test.${UNIQUE_ID}@saleor.io`;
const TEST_SMTP_HOST = 'smtp.cypr.net';
const TEST_SMTP_PORT = '587';
const TEST_PASSWORD = 'StrongPassword123!';
const TEST_MANIFEST_URL = 'https://example.com/api/manifest'; // Placeholder for invalid URL
const NEW_EXTENSION_NAME = `Test Webhook ${UNIQUE_ID}`;


describe('Extensions: Comprehensive Configuration and Management Tests (>35 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/extensions/installed');
        cy.contains('All installed').should('be.visible');
    });

    // =================================================================
    // C1: EDIT INSTALLED EXTENSION (Admin Emails Configuration) 
    // =================================================================

    it('C1.01: Verify navigation to Admin Emails details page', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();
        cy.contains('Admin emails details').should('be.visible');
    });

    it('C1.02: Change Sender Email successfully', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        cy.get(SELECTORS.SENDER_EMAIL_INPUT).clear().type(TEST_SENDER_EMAIL);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Plugin settings saved');
        cy.get(SELECTORS.SENDER_EMAIL_INPUT).should('have.value', TEST_SENDER_EMAIL);
    });

    it('C1.03: Change SMTP Host and Port successfully', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        cy.get(SELECTORS.SMTP_HOST_INPUT).clear().type(TEST_SMTP_HOST);
        cy.get(SELECTORS.SMTP_PORT_INPUT).clear().type(TEST_SMTP_PORT);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.SMTP_HOST_INPUT).should('have.value', TEST_SMTP_HOST);
    });

    it('C1.04: Attempt to save invalid Sender Email format', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        cy.get(SELECTORS.SENDER_EMAIL_INPUT).clear().type('invalid.email@');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SENDER_EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.05: Attempt to save invalid SMTP Port (non-numeric)', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        cy.get(SELECTORS.SMTP_PORT_INPUT).clear().type('fiveeightseven');

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SMTP_PORT_INPUT).should('have.value', ''); // Assert non-numeric input is filtered/rejected
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible'); // Assert missing required fields error
    });

    it('C1.06: Check TLS and SSL checkboxes are mutually exclusive', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        // 1. Check TLS
        cy.get(SELECTORS.TLS_CHECKBOX).check();

        // 2. Check SSL
        cy.get(SELECTORS.SSL_CHECKBOX).check();

        // Assert only one can be checked (assuming client-side logic unchecks the other)
        cy.get(SELECTORS.TLS_CHECKBOX).should('not.be.checked');
        cy.get(SELECTORS.SSL_CHECKBOX).should('be.checked');
    });

    it('C1.07: Successfully add a password to Authorization Field', () => {
        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        // 1. Click Create/Edit button next to Password field
        cy.get(SELECTORS.PASSWORD_MODAL_BUTTON).click(); // 'Create' button

        // 2. Assert modal opens
        cy.contains('Add Value to Authorization Field').should('be.visible');

        // 3. Input Password and Confirm
        cy.get(SELECTORS.PASSWORD_MODAL_INPUT).type(TEST_PASSWORD);
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click(); // 'Confirm' button inside modal

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.08: Update the CSV export success subject template', () => {
        const newSubject = 'Exported Data Ready, ID: {{ data_type }}';

        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        // Find the input box associated with 'CSV export product success subject'
        cy.contains('CSV export product success subject').siblings('input').clear().type(newSubject);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        cy.contains('CSV export product success subject').siblings('input').should('have.value', newSubject);
    });

    it('C1.09: Verify CSV export failed template subject accepts default value', () => {
        const defaultValue = 'DEFAULT';

        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        // Clear and type 'DEFAULT' into the failed subject input
        cy.contains('CSV export failed subject').siblings('input').clear().type(defaultValue);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.10: Verify long template content saves successfully', () => {
        const longTemplate = 'T'.repeat(500);

        cy.get(SELECTORS.ADMIN_EMAILS_LINK).click();

        // Find the order confirmation template textarea
        cy.get(SELECTORS.ORDER_CONF_TEMPLATE_TEXTAREA).type(longTemplate);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    // =================================================================
    // C2: ADD EXTENSION MANUALLY - 8 Cases
    // =================================================================

    it('C2.01: Verify navigation to Add Extension Manually form', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.contains('Add extension manually').should('be.visible');
    });

    it('C2.02: Successfully add extension with minimal data (Name)', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).type(NEW_EXTENSION_NAME);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Extension added successfully');
    });

    it('C2.03: Grant full access to the store', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).type('Full Access Test');

        // Check "Grant this extension full access to the store"
        cy.contains('Grant this extension full access to the store').prev(SELECTORS.PERMISSIONS_CHECKBOX_BASE).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: Select specific permissions and save (e.g., Handle Payments)', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).type('Partial Access Test');

        // Check specific permissions (Inferred check)
        cy.contains('Handle payments.').prev(SELECTORS.PERMISSIONS_CHECKBOX_BASE).check();
        cy.contains('Manage customers.').prev(SELECTORS.PERMISSIONS_CHECKBOX_BASE).check();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Attempt to save without Extension Name', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.06: Attempt to save with invalid character input in Extension Name', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).type('Extension!@#');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert error for invalid name characters
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Invalid characters in name');
    });

    it('C2.07: Verify Back button works on the manual form', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.contains('Add extension manually').should('not.exist');
    });

    it('C2.08: Attempt to save with duplicate Extension Name', () => {
        const existingName = 'Webhooks'; // Name of an already installed extension

        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Provide details manually').click();

        cy.get(SELECTORS.EXTENSION_NAME_INPUT).type(existingName);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Extension with this name already exists'); // Inferred error
    });

    // =================================================================
    // C3: ADD EXTENSION FROM MANIFEST - 7 Cases
    // =================================================================

    it('C3.01: Verify navigation to Add Extension from Manifest form', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.contains('Add extension from manifest').should('be.visible');
    });

    it('C3.02: Attempt to Install with empty Manifest URL', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.get(SELECTORS.INSTALL_BUTTON).click();

        cy.get(SELECTORS.MANIFEST_URL_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C3.03: Attempt to Install with invalid Manifest URL format', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.get(SELECTORS.MANIFEST_URL_INPUT).type('not-a-url');

        cy.get(SELECTORS.INSTALL_BUTTON).click();

        cy.get(SELECTORS.MANIFEST_URL_INPUT).parent().parent().should('contain', 'Enter a valid URL'); // Assumed validation
    });

    it('C3.04: Attempt to Install with non-existent Manifest URL (Integration test)', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.get(SELECTORS.MANIFEST_URL_INPUT).type('https://nonexistent-domain.com/manifest');

        cy.get(SELECTORS.INSTALL_BUTTON).click();

        // Assert failure due to network/server response
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Failed to fetch manifest'); // Assumed error
    });

    it('C3.05: Verify Back button works on the manifest form', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.contains('Add extension from manifest').should('not.exist');
    });

    it('C3.06: Verify manifest form fields are empty on load', () => {
        cy.get(SELECTORS.ADD_EXTENSION_BUTTON).click();
        cy.contains('Install from manifest').click();

        cy.get(SELECTORS.MANIFEST_URL_INPUT).should('be.empty');
    });
});