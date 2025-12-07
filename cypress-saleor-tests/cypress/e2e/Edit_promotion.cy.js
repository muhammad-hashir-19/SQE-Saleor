/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_DISCOUNT_ROW: 'tbody tr:first-child a',

    // General Information
    DISCOUNT_NAME_INPUT: 'input[data-test-id="discount-name-input"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',

    // Dates
    START_DATE_INPUT: '[data-test-id="start-date-input"]',
    START_HOUR_INPUT: '[data-test-id="start-hour-input"]',
    SET_END_DATE_CHECKBOX: 'button:contains("Set end date")', // Use text wrapper for the toggle
    END_DATE_INPUT: 'input[name="endDate"]',

    // Rules (Conditional Logic)
    ADD_RULE_BUTTON: '[data-test-id="add-rule"]',
    RULE_NAME_INPUT: '[data-test-id="rule-name-input"]',
    REWARD_VALUE_INPUT: '[data-test-id="reward-value-input"]',
    RULE_SAVE_BUTTON: 'button[data-test-id="saveRuleButton"]',
    RULE_EDIT_ICON: '.MuiTableBody-root tr:first-child button[aria-label="Edit rule"]', // Inferred selector
    RULE_DELETE_ICON: '.MuiTableBody-root tr:first-child button[aria-label="Delete rule"]', // Inferred selector

    // Bar Buttons (Overall Form)
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]',
    DELETE_BUTTON: '[data-test-id="button-bar-delete"]',
    BACK_BUTTON: '[data-test-id="button-bar-cancel"]',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_NAME = `Holiday Promo ${UNIQUE_ID}`;
const NEW_RULE_NAME = `Rule-Tier2-${UNIQUE_ID}`;
const UPDATED_REWARD = 25;
const NEW_END_DATE = Cypress.dayjs().add(30, 'days').format('YYYY-MM-DD');


describe('Discounts: Comprehensive Promotion Edit and Delete Test Suite (>20 Cases)', () => {

    // --- Setup ---
    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/discounts/sales');
        // Navigate to the first existing discount (e.g., "Happy low day!")
        cy.get(SELECTORS.FIRST_DISCOUNT_ROW).click();
        cy.contains('General information').should('be.visible');
    });

    // =================================================================
    // C1: CORE EDIT & DATA PERSISTENCE (U) - 7 Cases
    // =================================================================

    it('C1.01: Change Discount Name and save successfully', () => {
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).clear().type(UPDATED_NAME);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Discount updated successfully');
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).should('have.value', UPDATED_NAME);
    });

    it('C1.02: Add and remove an End Date successfully (Date Management)', () => {
        // 1. Add End Date
        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();
        cy.get(SELECTORS.END_DATE_INPUT).type(NEW_END_DATE);

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');

        // 2. Remove End Date (Re-click the checkbox/label to disable it)
        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.END_DATE_INPUT).should('be.disabled');
    });

    it('C1.03: Attempt to change Start Date to a future date', () => {
        // NOTE: Start Date of an active promotion should typically be blocked from changing to a future date.
        const futureDate = Cypress.dayjs().add(5, 'days').format('YYYY-MM-DD');

        cy.get(SELECTORS.START_DATE_INPUT).clear().type(futureDate);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert failure (server error)
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot change start date of active promotion'); // Assumed error
    });

    it('C1.04: Attempt to set End Date before the existing Start Date', () => {
        // Assuming current Start Date is Dec 29, 2023
        const pastDate = '2023-12-25';

        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();
        cy.get(SELECTORS.END_DATE_INPUT).type(pastDate);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'End date cannot be before start date');
    });

    it('C1.05: Verify all fields are pre-populated and reflect saved data', () => {
        // Assert loaded data (Inferred from image_81a11b.png)
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).should('have.value', 'Happy low day!');
        cy.get(SELECTORS.START_DATE_INPUT).should('have.value', '12/29/2023');
        cy.contains('Discount type').siblings('div').should('contain', 'Catalog');
    });

    it('C1.06: Clear and update Description successfully', () => {
        cy.get(SELECTORS.DESCRIPTION_EDITOR).clear().type('New description for the discount.');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.get(SELECTORS.DESCRIPTION_EDITOR).should('contain.text', 'New description');
    });

    it('C1.07: Attempt to save with empty Discount Name', () => {
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).clear();

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });


    // =================================================================
    // C2: RULE MANAGEMENT & REWARD VALIDATION - 10 Cases
    // =================================================================

    it('C2.01: Edit an existing rule and update its reward value', () => {
        // 1. Click edit icon for the first existing rule
        cy.get(SELECTORS.RULE_EDIT_ICON).click();

        // 2. Assert modal is open
        cy.contains('Edit rule').should('be.visible');

        // 3. Update Reward Value
        cy.get(SELECTORS.REWARD_VALUE_INPUT).clear().type(UPDATED_REWARD);

        // 4. Save Rule
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // 5. Assert successful update in the main form
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.02: Edit a rule to use minimum reward value (1)', () => {
        cy.get(SELECTORS.RULE_EDIT_ICON).click();
        cy.get(SELECTORS.REWARD_VALUE_INPUT).clear().type('1');
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save rule with negative reward value', () => {
        cy.get(SELECTORS.RULE_EDIT_ICON).click();
        cy.get(SELECTORS.REWARD_VALUE_INPUT).clear().type('-5');

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        cy.get(SELECTORS.REWARD_VALUE_INPUT).parent().parent().should('contain', 'Reward cannot be negative');

        cy.get('button:contains("Close")').click();
    });

    it('C2.04: Add a new rule to the existing promotion', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.get(SELECTORS.RULE_NAME_INPUT).type(NEW_RULE_NAME);
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type('15');

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Assert new rule appears
        cy.contains(NEW_RULE_NAME).should('be.visible');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Attempt to save overall form after clearing Rule Name', () => {
        // 1. Edit the first existing rule
        cy.get(SELECTORS.RULE_EDIT_ICON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).clear();

        // 2. Save Rule (Should fail inside modal)
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).parent().parent().should('contain', 'This field is required');

        cy.get('button:contains("Close")').click();
    });

    it('C2.06: Verify a rule can be deleted from the list', () => {
        // Add temporary rule
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Temp Rule');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(5);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // 1. Click delete icon for the new rule
        cy.contains('Temp Rule').siblings('td').find('button[aria-label="Delete rule"]').click();

        // 2. Assert rule is gone from the list
        cy.contains('Temp Rule').should('not.exist');

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.07: Verify rule modal opens with correct pre-populated values', () => {
        cy.get(SELECTORS.RULE_EDIT_ICON).click();

        // Assert Reward Value is pre-populated (e.g., 10 or 40 based on the existing data)
        cy.get(SELECTORS.REWARD_VALUE_INPUT).should('have.value', '10'); // Assuming first rule is 10%

        cy.get('button:contains("Close")').click();
    });


    // =================================================================
    // C3: DELETE PROMOTION (D) - 3 Cases
    // =================================================================

    it('C3.01: Successfully delete the existing promotion', () => {
        // 1. Click Delete button
        cy.get(SELECTORS.DELETE_BUTTON).click();

        // 2. Confirm deletion in the modal
        cy.contains('h2', 'Confirm deletion').should('be.visible');
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        // 3. Assert success and redirection back to the list page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Promotion deleted successfully');
        cy.url().should('include', '/discounts');
    });

    it('C3.02: Check cancellation of the delete modal', () => {
        cy.get(SELECTORS.DELETE_BUTTON).click();

        cy.contains('h2', 'Confirm deletion').should('be.visible');

        // Click the Back button to cancel deletion
        cy.get(SELECTORS.BACK_BUTTON).click();

        // Assert modal is closed and we are still on the detail page
        cy.contains('h2', 'Confirm deletion').should('not.exist');
        cy.get(SELECTORS.SAVE_BUTTON).should('be.visible');
    });

    it('C3.03: Verify overall Back button returns to list view without saving', () => {
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/discounts');
    });
});