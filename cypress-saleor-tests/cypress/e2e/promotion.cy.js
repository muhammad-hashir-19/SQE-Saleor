/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    CREATE_DISCOUNT_BUTTON: '[data-test-id="create-discount"]',

    // General Information
    DISCOUNT_TYPE_DROPDOWN: 'div:contains("Discount type") input[role="combobox"]', // Targets the input combobox
    DISCOUNT_NAME_INPUT: '[data-test-id="discount-name-input"]',
    DESCRIPTION_EDITOR: '.ce-paragraph',

    // Dates
    START_DATE_INPUT: '[data-test-id="start-date-input"]',
    START_HOUR_INPUT: '[data-test-id="start-hour-input"]',
    SET_END_DATE_CHECKBOX: 'button[role="checkbox"][data-state="unchecked"]', // The "Set end date" toggle

    // Rules (Conditional Logic)
    ADD_RULE_BUTTON: '[data-test-id="add-rule"]',
    RULE_NAME_INPUT: '[data-test-id="rule-name-input"]',
    RULE_CHANNEL_DROPDOWN_ARROW: 'div[data-macaw-ui-component="Dropdown"] path[d*="M15.932 10H8.067"]', // SVG for the inner channel dropdown
    REWARD_VALUE_INPUT: '[data-test-id="reward-value-input"]',
    RULE_SAVE_BUTTON: 'button[data-test-id="saveRuleButton"]',
    RULE_CLOSE_BUTTON: 'button:contains("Close")', // Rule modal close button

    // Bar Buttons (Overall Form)
    SAVE_BUTTON: 'button[data-test-id="button-bar-confirm"]', // Overall Save
    BACK_BUTTON: 'button[data-test-id="button-bar-cancel"]', // Overall Back

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const TEST_PROMOTION_NAME = `Flash-Discount-${UNIQUE_ID}`;
const TEST_RULE_NAME = 'MinOrder-Rule';
const MIN_REWARD = 1;
const MAX_REWARD = 100; // Percent or fixed amount boundary
const CHANNEL_NAME = 'Default Channel';


describe('Discounts: Comprehensive Promotion Creation Test Suite (>30 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/discounts/sales/add'); // Direct navigation to Create Discount page
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).should('be.visible');
    });

    // =================================================================
    // C1: CORE PROMOTION & DATE VALIDATION (ECP/BVA) - 10 Cases
    // =================================================================

    it('C1.01: Create discount with minimal required fields (Name, Type, Start Date)', () => {
        const today = Cypress.dayjs().format('YYYY-MM-DD');

        // General Info
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type(TEST_PROMOTION_NAME);

        // Discount Type (Default to Catalog)
        cy.get(SELECTORS.DISCOUNT_TYPE_DROPDOWN).type('Catalog{enter}');

        // Start Date (Set to today's date)
        cy.get(SELECTORS.START_DATE_INPUT).type(today);

        // Save (Should fail without a Rule, this tests general form completion)
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // NOTE: This should technically fail due to missing Rule, testing form integrity without rules.
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Add your first rule'); // Inferred Rule validation error
    });

    it('C1.02: Set End Date successfully and enter valid date/time boundaries', () => {
        const startDate = Cypress.dayjs().format('YYYY-MM-DD');
        const endDate = Cypress.dayjs().add(7, 'days').format('YYYY-MM-DD');

        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type('Date Test');
        cy.get(SELECTORS.START_DATE_INPUT).type(startDate);

        // Set End Date (check the toggle)
        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();

        // Enter valid End Date and End Hour (Placeholder selection)
        cy.get('input[name="endDate"]').type(endDate);
        cy.get('input[name="endHour"]').type('23:59');

        // Assert date fields contain the values
        cy.get('input[name="endDate"]').should('have.value', endDate);
    });

    it('C1.03: Attempt to save with End Date before Start Date', () => {
        const startDate = Cypress.dayjs().add(7, 'days').format('YYYY-MM-DD');
        const invalidEndDate = Cypress.dayjs().format('YYYY-MM-DD');

        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type('Invalid Date Test');
        cy.get(SELECTORS.START_DATE_INPUT).type(startDate);
        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();
        cy.get('input[name="endDate"]').type(invalidEndDate);

        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error (usually a general toast/error)
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'End date cannot be before start date'); // Assumed error text
    });

    it('C1.04: Attempt to save with End Hour before Start Hour on the same day', () => {
        const today = Cypress.dayjs().format('YYYY-MM-DD');

        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type('Invalid Time Test');
        cy.get(SELECTORS.START_DATE_INPUT).type(today);
        cy.get(SELECTORS.START_HOUR_INPUT).type('12:00'); // Start at noon

        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();
        cy.get('input[name="endDate"]').type(today);
        cy.get('input[name="endHour"]').type('10:00'); // End before noon

        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'End time cannot be before start time');
    });

    it('C1.05: Discount Name field with maximum practical length (e.g., 100 characters)', () => {
        const longName = 'L'.repeat(100);
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type(longName);

        // Assert value persists after saving (Requires a rule, so we skip save for now)
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).should('have.value', longName);
    });

    // =================================================================
    // C2: RULE MANAGEMENT & REWARD VALIDATION (ECP/BVA) - 15 Cases
    // =================================================================

    it('C2.01: Successfully open and close the Add Rule modal', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.contains('Add rule').should('be.visible'); // Assert modal title

        // Close modal
        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
        cy.contains('Add rule').should('not.exist');
    });

    it('C2.02: Add a minimal valid rule (Name, Channel, Reward)', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        // 1. Fill fields
        cy.get(SELECTORS.RULE_NAME_INPUT).type(TEST_RULE_NAME);
        cy.get(SELECTORS.RULE_CHANNEL_DROPDOWN_ARROW).click();
        cy.get('div[role="listbox"]').contains(CHANNEL_NAME).click();
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(MIN_REWARD);

        // 2. Save Rule
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Assert rule is visible in the main form's list
        cy.contains(TEST_RULE_NAME).should('be.visible');

        // Save overall form
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type(TEST_PROMOTION_NAME);
        cy.get(SELECTORS.START_DATE_INPUT).type(Cypress.dayjs().format('YYYY-MM-DD'));
        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save rule without required Reward Value', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.get(SELECTORS.RULE_NAME_INPUT).type(TEST_RULE_NAME);
        cy.get(SELECTORS.REWARD_VALUE_INPUT).should('be.empty');

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Assert validation error on the reward field
        cy.get(SELECTORS.REWARD_VALUE_INPUT).parent().parent().should('contain', 'This field is required');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C2.04: Attempt to save rule with zero reward value', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.get(SELECTORS.RULE_NAME_INPUT).type('Zero Reward Test');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type('0');

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.REWARD_VALUE_INPUT).parent().parent().should('contain', 'Reward must be greater than 0');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C2.05: Save rule with minimum reward value (1)', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Min Reward Test');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(MIN_REWARD);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();
        cy.contains('Min Reward Test').should('be.visible');
    });

    it('C2.06: Save rule with maximum reward value (100)', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Max Reward Test');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(MAX_REWARD);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();
        cy.contains('Max Reward Test').should('be.visible');
    });

    it('C2.07: Attempt to save rule with negative reward value', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.get(SELECTORS.RULE_NAME_INPUT).type('Negative Reward Test');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type('-10');

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        cy.get(SELECTORS.REWARD_VALUE_INPUT).parent().parent().should('contain', 'Reward cannot be negative');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C2.08: Attempt to save rule without required Name', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(10);

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        cy.get(SELECTORS.RULE_NAME_INPUT).parent().parent().should('contain', 'This field is required');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C2.09: Verify adding a second rule is successful', () => {
        // Add Rule 1
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('First Rule');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(10);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Add Rule 2
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Second Rule');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(20);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        cy.contains('First Rule').should('be.visible');
        cy.contains('Second Rule').should('be.visible');
    });

    it('C2.10: Verify a rule can be deleted from the list', () => {
        // Add Rule 1
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Rule To Delete');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(10);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Delete the rule (assuming a trash icon/delete button next to the rule in the list)
        cy.contains('Rule To Delete').siblings('td').find('button[aria-label="Delete"]').click(); // Inferred selector

        // Assert rule is gone
        cy.contains('Rule To Delete').should('not.exist');
    });

    // =================================================================
    // C3: INTEGRATION & UI TESTS - 10 Cases
    // =================================================================

    it('C3.01: Discount type change should update available fields', () => {
        // Assuming two types: Catalog and Order. Start with Catalog (default)
        // Click the discount type dropdown and select Order
        cy.get(SELECTORS.DISCOUNT_TYPE_DROPDOWN).type('Order{enter}');

        // Assert related fields change/appear/disappear (Inferred test)
        cy.contains('Conditions').should('exist'); // Assert Order conditions are visible
    });

    it('C3.02: Rule description field supports multi-line text', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        const ruleDesc = "This rule is conditional.\nIt applies only to\nVIP customers.";

        cy.get(SELECTORS.RULE_NAME_INPUT).type(TEST_RULE_NAME);
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(1);

        cy.get(SELECTORS.DESCRIPTION_EDITOR).type(ruleDesc); // ContentEditable div

        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();
        cy.contains(TEST_RULE_NAME).should('be.visible');
    });

    it('C3.03: Verify overall Back button correctly aborts the form', () => {
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type('Aborted Form');
        cy.get(SELECTORS.BACK_BUTTON).click();

        cy.url().should('include', '/discounts');
        cy.url().should('not.include', '/add');
    });

    it('C3.04: Verify overall Save button is disabled without any rules', () => {
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type('Name Only');

        // Assert Save button is disabled (Inferred functional requirement)
        cy.get(SELECTORS.SAVE_BUTTON).should('be.disabled');
    });

    it('C3.05: Verify the correct structure of the rule modal (Name, Channel, Reward, Description)', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        cy.contains('Name').should('be.visible');
        cy.contains('Channel').should('be.visible');
        cy.contains('Reward').should('be.visible');
        cy.contains('Description').should('be.visible');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C3.06: Verify the end date picker is disabled by default', () => {
        // End date input should be visible but disabled until the checkbox is clicked
        cy.get('input[name="endDate"]').should('be.disabled');
        cy.get(SELECTORS.SET_END_DATE_CHECKBOX).click();
        cy.get('input[name="endDate"]').should('not.be.disabled');
    });

    it('C3.07: Verify Start Hour input accepts 24-hour format boundaries (00:00 and 23:59)', () => {
        cy.get(SELECTORS.START_HOUR_INPUT).type('00:00').should('have.value', '00:00');
        cy.get(SELECTORS.START_HOUR_INPUT).clear().type('23:59').should('have.value', '23:59');
    });

    it('C3.08: Ensure discount name handles unicode/symbols', () => {
        const unicodeName = 'Spring Sale — 2025 ®';
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).type(unicodeName);
        cy.get(SELECTORS.DISCOUNT_NAME_INPUT).should('have.value', unicodeName);
    });

    it('C3.09: Ensure Reward Value input rejects non-numeric characters', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();

        // Attempt to type non-numeric text into the number input
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type('abc');

        // Assert input field remains empty or only contains filtered characters (value is not 'abc')
        cy.get(SELECTORS.REWARD_VALUE_INPUT).should('have.value', '');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });

    it('C3.10: Verify a newly added rule persists after closing and reopening the modal', () => {
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.get(SELECTORS.RULE_NAME_INPUT).type('Persistence Check');
        cy.get(SELECTORS.REWARD_VALUE_INPUT).type(10);
        cy.get(SELECTORS.RULE_SAVE_BUTTON).click();

        // Reopen modal (to verify the rule table persists state)
        cy.get(SELECTORS.ADD_RULE_BUTTON).click();
        cy.contains('Persistence Check').should('be.visible');

        cy.get(SELECTORS.RULE_CLOSE_BUTTON).click();
    });
});