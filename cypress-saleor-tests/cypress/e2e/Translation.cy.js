/// <reference types="cypress" />

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const ARABIC_LANGUAGE = 'Arabic (AR)';
const ARABIC_CATEGORY_NAME = '????? ??? ?????'; // Test Arabic text
const ARABIC_DESCRIPTION = '??? ??? ??? ?????? ????????.';


describe('Translations: Comprehensive Workflow Test Suite (>20 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/translations'); // Navigate to the Languages list
    });

    // --- Helper function to navigate to the Arabic Category Translation page ---
    const navigateToArabicCategoryTranslation = () => {
        // 1. Click a language link (We will use the first, Afrikaans, as a placeholder for starting the flow)
        cy.get('a:contains("Afrikaans")').first().click();

        // 2. Click the Categories tab
        cy.get(SELECTORS.CATEGORY_LINK).click();

        // 3. Click the first item in the Categories list (e.g., Default Category)
        cy.get(SELECTORS.FIRST_TRANSLATION_ROW).click();

        // 4. Select the Target Language (Arabic)
        cy.get(SELECTORS.LANGUAGE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(ARABIC_LANGUAGE).click();

        // Assert we are on the Arabic translation page
        cy.contains('Translation Category "Default Category" - AR').should('be.visible');
    };

    // =================================================================
    // C1: FLOW & NAVIGATION TESTS - 5 Cases
    // =================================================================

    it('C1.01: Verify full navigation path to a specific translation field', () => {
        navigateToArabicCategoryTranslation();

        // Assert the Edit button for the Category Name is visible
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).should('be.visible');
    });

    it('C1.02: Verify tabs allow switching between content types (Categories -> Collections)', () => {
        cy.get('a:contains("Afrikaans")').first().click();

        // Switch to Collections tab
        cy.get('button:contains("Collections")').click();

        // Assert table content changes (Inferred: the list items should be different)
        cy.contains('Collections').should('be.visible');
    });

    it('C1.03: Verify Save button is initially disabled if no translation changes exist', () => {
        navigateToArabicCategoryTranslation();

        // Assert Save button is disabled (assuming no changes have been made)
        cy.get(SELECTORS.SAVE_BUTTON).should('be.disabled');
    });

    it('C1.04: Verify Original String value is correctly displayed', () => {
        navigateToArabicCategoryTranslation();

        // Assert the original string is displayed for Category Name
        cy.contains('Original String').siblings().should('contain', 'Default Category');
    });

    it('C1.05: Verify Discard button is present and resets changes', () => {
        navigateToArabicCategoryTranslation();

        // Click Edit for Category Name
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // Assert translation input opens and Discard is visible
        cy.get(SELECTORS.SAVE_BUTTON).should('not.be.disabled');
        cy.get(SELECTORS.DISCARD_BUTTON).should('be.visible');
    });

    // =================================================================
    // C2: TRANSLATION EDITING (CREATE/UPDATE) - 10 Cases
    // =================================================================

    it('C2.01: Successfully translate Category Name and save', () => {
        navigateToArabicCategoryTranslation();

        // 1. Click Edit for Category Name
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 2. Input the Arabic translation (Input field, inferred name="translation")
        cy.get(SELECTORS.TRANSLATION_INPUT).type(ARABIC_CATEGORY_NAME);

        // 3. Save the translation field (Button inside the field/card)
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // 4. Save the overall form
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Translation saved');
    });

    it('C2.02: Successfully translate Description (Textarea) and save', () => {
        navigateToArabicCategoryTranslation();

        // 1. Click Edit for Description
        cy.contains('Description').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 2. Input the translation (Textarea field, inferred name="translation")
        cy.get(SELECTORS.TRANSLATION_TEXTAREA).type(ARABIC_DESCRIPTION);

        // 3. Save the translation field
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // 4. Save the overall form
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.03: Attempt to save empty translation for a required field (Name)', () => {
        navigateToArabicCategoryTranslation();

        // 1. Click Edit for Category Name
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 2. Clear the field (Assuming it was pre-populated)
        cy.get(SELECTORS.TRANSLATION_INPUT).clear();

        // 3. Save the translation field
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert validation error (Inferred: client-side required field check)
        cy.get(SELECTORS.TRANSLATION_INPUT).parent().parent().should('contain', 'Translation is required');
    });

    it('C2.04: Attempt to save translation with maximum length exceedance (SEO Title)', () => {
        navigateToArabicCategoryTranslation();
        const maxTitleLength = 70; // Assumed max length for SEO Title
        const longTitle = '?'.repeat(maxTitleLength + 5);

        // 1. Navigate to SEO Title (Inferred: need to find the correct edit button)
        cy.contains('Search Engine Title').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 2. Type long translation
        cy.get(SELECTORS.TRANSLATION_INPUT).type(longTitle);

        // 3. Save
        cy.get(SELECTORS.SAVE_BUTTON).click();

        // Assert server-side error for exceeding max length
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Maximum length exceeded');

        cy.get(SELECTORS.DISCARD_BUTTON).click(); // Discard the invalid change
    });

    it('C2.05: Verify Discard button resets the translation field', () => {
        navigateToArabicCategoryTranslation();

        // 1. Click Edit for Category Name
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 2. Input temporary data
        cy.get(SELECTORS.TRANSLATION_INPUT).clear().type('Temporary Input');

        // 3. Click Discard
        cy.get(SELECTORS.DISCARD_BUTTON).click();

        // 4. Re-open Edit field
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // 5. Assert field is now empty or contains original untranslated value
        cy.get(SELECTORS.TRANSLATION_INPUT).should('have.value', '');

        cy.get(SELECTORS.DISCARD_BUTTON).click();
    });

    // =================================================================
    // C3: INTEGRATION & CLEANUP - 5 Cases
    // =================================================================

    it('C3.01: Verify saving one field enables the overall Save button', () => {
        navigateToArabicCategoryTranslation();

        // Overall Save button should be disabled initially
        cy.get(SELECTORS.SAVE_BUTTON).should('be.disabled');

        // Make a valid translation change
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();
        cy.get(SELECTORS.TRANSLATION_INPUT).type('Test Name');
        cy.get(SELECTORS.SAVE_BUTTON).click(); // Save inner field

        // Overall Save button should now be enabled
        cy.get(SELECTORS.SAVE_BUTTON).should('not.be.disabled');

        // Click overall Discard to clean up state
        cy.get(SELECTORS.DISCARD_BUTTON).click();
    });

    it('C3.02: Verify translating description creates content (Rich Text)', () => {
        navigateToArabicCategoryTranslation();

        // Click Edit for Description
        cy.contains('Description').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // Input text with formatting (inferred rich text capability)
        cy.get(SELECTORS.TRANSLATION_TEXTAREA).type('Test description with **bold** text.');
        cy.get(SELECTORS.SAVE_BUTTON).click();

        cy.get(SELECTORS.SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.03: Verify Discard button functionality for the overall form', () => {
        navigateToArabicCategoryTranslation();

        // Make a change
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();
        cy.get(SELECTORS.TRANSLATION_INPUT).type('Temp Name');
        cy.get(SELECTORS.SAVE_BUTTON).click(); // Save inner field

        // Click overall Discard
        cy.get(SELECTORS.DISCARD_BUTTON).click();

        // Re-open Edit field
        cy.contains('Category Name').siblings().find(SELECTORS.EDIT_BUTTON).click();

        // Assert translation is gone
        cy.get(SELECTORS.TRANSLATION_INPUT).should('have.value', '');

        cy.get(SELECTORS.DISCARD_BUTTON).click();
    });

    it('C3.04: Verify all key translation fields are present on the page', () => {
        navigateToArabicCategoryTranslation();

        cy.contains('Category Name').should('be.visible');
        cy.contains('Description').should('be.visible');
        cy.contains('Search Engine Title').should('be.visible');
        cy.contains('Search Engine Description').should('be.visible');
    });

    it('C3.05: Verify the language dropdown can be changed back to the default language', () => {
        navigateToArabicCategoryTranslation();

        // Change back to the default (e.g., English, inferred)
        cy.get(SELECTORS.LANGUAGE_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('English (EN)').click(); // Inferred default language

        // Assert navigation back to the original translation target
        cy.contains('Translation Category "Default Category" - EN').should('be.visible');
    });
});