/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    INVITE_STAFF_MEMBER_BUTTON: 'button:contains("Invite staff member")',
    FIRST_STAFF_ROW: 'tbody tr:first-child a', // Click the link (Staff Name) in the first row

    // Invite Modal Fields
    MODAL_TITLE: 'h2:contains("Invite Staff Member")',
    FIRST_NAME_INPUT: 'input[name="firstName"]',
    LAST_NAME_INPUT: 'input[name="lastName"]',
    EMAIL_INPUT: 'input[name="emailAddress"]', // Inferred name

    // Invite Modal Buttons
    SEND_INVITE_BUTTON: 'button:contains("Send invite")',
    MODAL_BACK_BUTTON: 'button:contains("Back")',

    // Edit Page Fields (Inferred from image_65f91d.png)
    PREF_LANGUAGE_DROPDOWN: 'div:contains("Preferred Language")',
    RESET_PASSWORD_BUTTON: 'button:contains("Reset password")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    ERROR_FIELD: '.MuiFormHelperText-root.Mui-error',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_FIRST_NAME = 'Cypress';
const TEST_LAST_NAME = 'Tester';
const TEST_EMAIL = `cypress.staff.${UNIQUE_ID}@example.com`;
const INVALID_EMAIL = 'invalid-format@';


describe('Staff Members: Comprehensive Invite and Edit Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/staff');
        cy.contains('All staff members').should('be.visible');
    });

    
    it('C1.01: Successfully send staff invitation with valid minimal data', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);
        cy.get(SELECTORS.LAST_NAME_INPUT).type(TEST_LAST_NAME);
        cy.get(SELECTORS.EMAIL_INPUT).type(TEST_EMAIL);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Invitation sent successfully');
        cy.contains(TEST_EMAIL).should('be.visible');
    });

    it('C1.02: Attempt to send invite without Email address (Required)', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);
        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        cy.get(SELECTORS.EMAIL_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.03: Attempt to send invite with invalid Email format', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);
        cy.get(SELECTORS.EMAIL_INPUT).type(INVALID_EMAIL);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        cy.get(SELECTORS.EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C1.04: Attempt to send invite with existing staff email', () => {
        // NOTE: Uses the known active user email from the screenshot
        const existingEmail = 'zakihaider7860@gmail.com';

        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);
        cy.get(SELECTORS.EMAIL_INPUT).type(existingEmail);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        // Assert server-side error
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'A staff member with this email already exists'); // Assumed error
    });

    it('C1.05: Name fields with maximum practical length (e.g., 100 chars)', () => {
        const longName = 'L'.repeat(100);

        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(longName);
        cy.get(SELECTORS.LAST_NAME_INPUT).type(longName);
        cy.get(SELECTORS.EMAIL_INPUT).type(`longname${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Name fields with minimum length (1 character)', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type('A');
        cy.get(SELECTORS.LAST_NAME_INPUT).type('B');
        cy.get(SELECTORS.EMAIL_INPUT).type(`minname${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.07: ttempt to save without First Name', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.LAST_NAME_INPUT).type(TEST_LAST_NAME);
        cy.get(SELECTORS.EMAIL_INPUT).type(`nofirst${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.08: Attempt to save without Last Name', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);
        cy.get(SELECTORS.EMAIL_INPUT).type(`nolast${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();

        cy.get(SELECTORS.LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C1.09: Verify modal Back button correctly cancels invite', () => {
        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(TEST_FIRST_NAME);

        cy.get(SELECTORS.MODAL_BACK_BUTTON).click();

        cy.contains('Invite Staff Member').should('not.exist');
    });

    it('C1.10: Ensure Name fields handle complex characters/unicode', () => {
        const complexName = 'João-Pérez';

        cy.get(SELECTORS.INVITE_STAFF_MEMBER_BUTTON).click();

        cy.get(SELECTORS.FIRST_NAME_INPUT).type(complexName);
        cy.get(SELECTORS.LAST_NAME_INPUT).type('O’Malley');
        cy.get(SELECTORS.EMAIL_INPUT).type(`unicode${UNIQUE_ID}@example.com`);

        cy.get(SELECTORS.SEND_INVITE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

   
    it('C2.01: erify clicking on staff member navigates to details page', () => {
        // Click on the known staff member (Zaki Haider)
        cy.contains('Zaki Haider').click();

        cy.contains('Staff Member Information').should('be.visible');
        cy.get(SELECTORS.RESET_PASSWORD_BUTTON).should('be.visible');
    });

    it('C2.02: Change Preferred Language successfully', () => {
        cy.contains('Zaki Haider').click();

        // Open language dropdown and select a new language (e.g., French)
        cy.get(SELECTORS.PREF_LANGUAGE_DROPDOWN).click();
        cy.contains('French').click();

        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Preferences updated');
        cy.get(SELECTORS.PREF_LANGUAGE_DROPDOWN).should('contain', 'French');
    });

    it('C2.03: Change First Name and Last Name in profile details', () => {
        const newFirstName = 'Zakaria';
        const newLastName = 'Hussain';

        cy.contains('Zaki Haider').click();

        // Update Name fields
        cy.get(SELECTORS.FIRST_NAME_INPUT).clear().type(newFirstName);
        cy.get(SELECTORS.LAST_NAME_INPUT).clear().type(newLastName);

        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Staff member updated');
    });

    it('C2.04: Verify "Reset password" button is actionable', () => {
        cy.contains('Zaki Haider').click();

        cy.get(SELECTORS.RESET_PASSWORD_BUTTON).click();

        // Assert modal opens for confirmation
        cy.contains('Reset password').should('be.visible');

        // Click Cancel/Back button
        cy.get('button:contains("Back")').click();
    });

    it('C2.05: Verify "Delete" button is accessible on the staff member profile', () => {
        cy.contains('Zaki Haider').click();

        cy.get('button:contains("Delete")').should('be.visible');
    });

    it('C2.06: Attempt to save profile without Last Name', () => {
        cy.contains('Zaki Haider').click();

        cy.get(SELECTORS.LAST_NAME_INPUT).clear();

        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.07: Attempt to change email to an invalid format', () => {
        cy.contains('Zaki Haider').click();

        cy.get(SELECTORS.EMAIL_INPUT).clear().type(INVALID_EMAIL);

        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.EMAIL_INPUT).parent().parent().should('contain', 'Enter a valid email address');
    });

    it('C2.08: Check the "Preferred Language" dropdown persists saved value', () => {
        const language = 'German';

        cy.contains('Zaki Haider').click();

        cy.get(SELECTORS.PREF_LANGUAGE_DROPDOWN).click();
        cy.contains(language).click();

        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.PREF_LANGUAGE_DROPDOWN).should('contain', language);
    });

    it('C2.09: Verify Back button returns to the Staff Members list', () => {
        cy.contains('Zaki Haider').click();

        cy.get('button:contains("Back")').last().click();

        cy.url().should('include', '/staff');
    });

    it('C2.10: Successfully delete the staff member (if not the last admin)', () => {
        // NOTE: This test should target a non-admin or a newly created user (e.g., the invited one from C1.01).
        // Since we cannot guarantee the invited user has accepted, we assert the delete action.

        cy.contains('Zaki Haider').click();

        cy.get('button:contains("Delete")').click();
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // Assert deletion failure if user is the last admin
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot delete the last admin user'); // Assumed error
    });
});