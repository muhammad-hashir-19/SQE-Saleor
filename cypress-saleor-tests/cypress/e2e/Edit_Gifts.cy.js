/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / General
    ISSUE_CARD_BUTTON: 'button:contains("Issue card")',
    FIRST_GIFT_CARD_ROW: 'tbody tr:first-child a', // Click the link in the first row
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',

    // Modal: Issue Gift Card
    MODAL_TITLE: 'h2:contains("Issue gift card")',
    ISSUE_BUTTON: 'button:contains("Issue")',
    AMOUNT_INPUT: 'input[name="balanceAmount"]',
    TAGS_INPUT: '[data-test-id="gift-card-tag-select-field"]',
    NOTE_TEXTAREA: 'textarea[name="note"]',
    SEND_TO_CUSTOMER_CHECKBOX: 'input[type="checkbox"][name="sendToCustomer"]', // Inferred name
    SET_EXPIRY_DATE_CHECKBOX: 'input[type="checkbox"][name="setExpiryDate"]', // Inferred name
    REQUIRES_ACTIVATION_CHECKBOX: 'input[type="checkbox"][name="requiresActivation"]', // Inferred name/default input
    CURRENCY_DROPDOWN: 'div:contains("USD")', // Target parent div by current value
    PLN_OPTION: 'li[data-value="PLN"]',

    // Detail Page (Read/Update/Delete)
    DEACTIVATE_BUTTON: 'button:contains("Deactivate")',
    RESEND_CODE_BUTTON: 'button:contains("Resend code")',
    SET_BALANCE_BUTTON: 'button:contains("Set Balance")',
    DELETE_BUTTON: 'button:contains("Delete")',
    SAVE_BUTTON_DETAIL: 'button:contains("Save")',
    EXPIRATION_DATE_INPUT: 'input[name="expirationDate"]', // Inferred
    // Tags field on Detail Page (Tag *Optional* box)
    TAG_INPUT_DETAIL: 'div:contains("Card Tag") + div input[placeholder="Add item"]',
};

// --- CONCRETE TEST DATA ---
const GIFT_TEST_DATA = {
    INITIAL_AMOUNT: 50,
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 99999,
    INVALID_AMOUNT_ZERO: 0,
    VALID_TAG: 'issued-loyalty-card',
    NOTE: 'Issued for Q4 customer retention program.',
    UPDATED_TAG: 'tag-updated',
};


describe('Gift Cards: Comprehensive CRUD Test Suite', () => {

    // --- Setup ---
    before(() => {
        // Creates and saves the authenticated session state before the tests run.
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/gift-cards');
    });

    // =================================================================
    // C1: ISSUE GIFT CARD (CREATE) - 10 Cases
    // =================================================================

    it('C1.01: Issue card with minimal valid data (Amount > 0)', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.MODAL_TITLE).should('be.visible');

        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(GIFT_TEST_DATA.INITIAL_AMOUNT);
        cy.get(SELECTORS.ISSUE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card issued successfully');
    });

    it('C1.02: Issue card with Tags, Note, and required activation', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(GIFT_TEST_DATA.INITIAL_AMOUNT);

        // Tags
        cy.get(SELECTORS.TAGS_INPUT).type(GIFT_TEST_DATA.VALID_TAG + '{enter}');

        // Note
        cy.get(SELECTORS.NOTE_TEXTAREA).type(GIFT_TEST_DATA.NOTE);

        // Ensure "Requires activation" is checked by default
        cy.contains('Requires activation').prev('input[type="checkbox"]').should('be.checked');

        cy.get(SELECTORS.ISSUE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.03: [Currency] Issue card with alternative currency (PLN)', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(25);

        // Click the currency dropdown and select PLN
        cy.get(SELECTORS.CURRENCY_DROPDOWN).click();
        cy.get(SELECTORS.PLN_OPTION).click();

        cy.get(SELECTORS.ISSUE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Issue card with minimum valid amount (1)', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(GIFT_TEST_DATA.MIN_AMOUNT);
        cy.get(SELECTORS.ISSUE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.05: Issue card with maximum practical amount (99999)', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(GIFT_TEST_DATA.MAX_AMOUNT);
        cy.get(SELECTORS.ISSUE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.06: Attempt to issue card with zero amount', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(GIFT_TEST_DATA.INVALID_AMOUNT_ZERO);
        cy.get(SELECTORS.ISSUE_BUTTON).click();

        // Assert error
        cy.get(SELECTORS.AMOUNT_INPUT).parent().parent().should('contain', 'Amount must be greater than 0');
    });

    it('C1.07: Attempt to issue card with invalid decimal precision (e.g., three decimal places)', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.AMOUNT_INPUT).clear().type('10.123'); // Attempt three decimals
        cy.get(SELECTORS.ISSUE_BUTTON).click();

        // Assert server rejects or client truncates (checking the input value)
        cy.get(SELECTORS.AMOUNT_INPUT).should('not.contain.value', '10.123');
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible'); // Assuming truncation and successful save
    });

    it('C1.08: Verify "Set expiry date" checkbox toggles and opens date picker', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();

        cy.contains('Set gift card expiry date').click();

        // Assert date picker is visible
        cy.get('.MuiPickersCalendarHeader-root, .react-datepicker__header').should('be.visible');

        // Close modal
        cy.get(SELECTORS.BACK_BUTTON).click();
    });

    it('C1.09: Check Note field accepts maximum length (N=300 chars)', () => {
        const longNote = 'N'.repeat(300);
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();

        cy.get(SELECTORS.AMOUNT_INPUT).clear().type(10);
        cy.get(SELECTORS.NOTE_TEXTAREA).type(longNote).should('have.value', longNote);

        cy.get(SELECTORS.ISSUE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.10: Verify Back button correctly closes modal', () => {
        cy.get(SELECTORS.ISSUE_CARD_BUTTON).click();
        cy.get(SELECTORS.BACK_BUTTON).click();
        cy.get(SELECTORS.MODAL_TITLE).should('not.exist');
    });

    // =================================================================
    // C2: DETAIL PAGE CRUD (READ, UPDATE, DELETE) - 7 Cases
    // =================================================================

    it('C2.01: Verify clicking card in list opens detail page', () => {
        // Assumes a card exists (see C1.01)
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        // Assert basic elements on detail page are visible
        cy.contains('Details').should('be.visible');
        cy.contains('Card Balance').should('be.visible');
    });

    it('C2.02: Update Card Tag successfully', () => {
        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        // Update tag field (assuming tags are editable/removable on detail page)
        // Click inside the tag box to interact/remove existing tags if necessary
        cy.get(SELECTORS.TAG_INPUT_DETAIL).type(GIFT_TEST_DATA.UPDATED_TAG + '{enter}');

        cy.get(SELECTORS.SAVE_BUTTON_DETAIL).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card updated successfully');
    });

    it('C2.03: Deactivate/Reactivate Card status', () => {
        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        // 1. Deactivate
        cy.get(SELECTORS.DEACTIVATE_BUTTON).click();
        // Assuming modal confirmation is required
        cy.get('button').contains('Confirm Deactivation').click(); // Inferred
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card deactivated');

        // 2. Reactivate (Button changes to Activate)
        cy.get('button:contains("Activate")').click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card activated');
    });

    it('C2.04: Check "Set Balance" button opens balance modal', () => {
        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        cy.get(SELECTORS.SET_BALANCE_BUTTON).click();

        // Assert balance modal is visible
        cy.contains('h2', 'Set gift card balance').should('be.visible');

        // Close modal without changing
        cy.get(SELECTORS.BACK_BUTTON).click();
    });

    it('C2.05: Add/Remove Expiration Date', () => {
        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        // 1. Check the box to add an expiration date
        cy.contains('Gift card expires').click();

        // Select a date (Placeholder interaction)
        cy.get(SELECTORS.EXPIRATION_DATE_INPUT).type(Cypress.dayjs().add(3, 'month').format('YYYY-MM-DD'));

        cy.get(SELECTORS.SAVE_BUTTON_DETAIL).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // 2. Uncheck the box to remove it
        cy.contains('Gift card expires').click();
        cy.get(SELECTORS.SAVE_BUTTON_DETAIL).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.06: Resend Code button triggers communication/toast', () => {
        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        cy.get(SELECTORS.RESEND_CODE_BUTTON).click();

        // Assert toast confirmation
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Code resent successfully');
    });

    it('C2.07: Should successfully delete an existing gift card', () => {
        // NOTE: This must be run on a newly created card if using CI to avoid deleting production data.

        // Navigate to detail page
        cy.get(SELECTORS.FIRST_GIFT_CARD_ROW).click();

        // 1. Click Delete button
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible'); // Inferred modal title
        cy.get('button').contains('Delete').click(); // Button in modal

        // 3. Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Gift card deleted successfully');
        cy.url().should('include', '/gift-cards');
    });
});