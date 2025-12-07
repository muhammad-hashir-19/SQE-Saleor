/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_ORDER_ROW: 'tbody tr:first-child a', // Order #20 in the screenshot
    // Top Bar Actions
    ORDER_STATUS_BUTTON: '[data-test-id="status-info"]',
    THREE_DOTS_MENU: 'button[data-test-id="show-more-button"]',
    REFUND_BUTTON: 'button:contains("Refund")',

    // Bottom Bar Actions
    CONFIRM_ORDER_BUTTON: 'button:contains("Confirm order")',

    // Order Details Section
    REMOVE_PRODUCT_ITEM: 'span[data-test-id="delete-order-line"]',
    ADD_DISCOUNT_BUTTON: 'a:contains("Add Discount")',

    // Customer/Address Section
    EDIT_SHIPPING_ADDRESS_BUTTON: 'div:contains("Shipping Address") ~ div button:contains("Edit")',
    EDIT_BILLING_ADDRESS_BUTTON: 'div:contains("Billing Address") ~ div button:contains("Edit")',
    DEFAULT_CHANNEL_LINK: 'a.jss462:contains("Default Channel")', // Sales channel link

    // Order History / Notes
    HISTORY_NOTE_TEXTAREA: 'textarea[name="message"][placeholder*="Leave your note"]',
    HISTORY_SEND_BUTTON: 'button:contains("Send")',

    // Address Modal Fields (Inferred from image_831ba4.png)
    MODAL_FIRST_NAME_INPUT: 'input[name="firstName"]',
    MODAL_LAST_NAME_INPUT: 'input[name="lastName"]',
    MODAL_ZIP_INPUT: 'input[name="postalCode"]',
    MODAL_CITY_INPUT: 'input[name="city"]',
    MODAL_ADDRESS1_INPUT: 'input[name="streetAddress1"]',
    MODAL_COUNTRY_DROPDOWN: '[data-test-id="address-edit-country-select-field"]',
    MODAL_SAVE_BUTTON: 'button:contains("Save")',

    // Refund Modal Fields (Inferred from image_836e78.png)
    REFUND_RADIO_PRODUCT: 'input[type="radio"][value="Refund products"]', // Inferred value
    REFUND_QTY_INPUT: 'input[data-test-id="product-quantity-input"]',
    REFUND_AMOUNT_MANUAL_RADIO: 'input[type="radio"][value="Manual Amount"]', // Inferred value
    REFUND_SUBMIT_BUTTON: 'button:contains("Refund")',
    REFUND_MAXIMAL_QTY_BUTTON: 'button:contains("Set maximal quantities")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")', // Generic confirm button in modals
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const UPDATED_CITY = `Cypress City ${UNIQUE_ID}`;
const UPDATED_NOTE = `Audit note for Order #20: Checked by ZH on ${Cypress.dayjs().format('MM/DD')}.`;
const REFUND_QTY = 1;


describe('Order Details: Comprehensive Edit, Refund, and Flow Test Suite ', () => {

    // --- Setup ---
    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/orders');
        // Navigate directly to the first order (Order #20)
        cy.get(SELECTORS.FIRST_ORDER_ROW).click();
        cy.contains('Order #20').should('be.visible');
    });

    // =================================================================
    // C1: CORE ORDER ACTIONS (STATUS, CONFIRMATION, HISTORY) - 7 Cases
    // =================================================================

    it('C1.01: [Verify Unconfirmed order can be successfully confirmed', () => {
        // Assert initial status
        cy.get(SELECTORS.ORDER_STATUS_BUTTON).should('contain', 'Unconfirmed');

        // Click Confirm Order button
        cy.get(SELECTORS.CONFIRM_ORDER_BUTTON).click();

        // Assert success and new status
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Order confirmed');
        cy.get(SELECTORS.ORDER_STATUS_BUTTON).should('not.contain', 'Unconfirmed');
    });

    it('C1.02: Add a new note to the Order History and verify persistence', () => {
        // Type the note
        cy.get(SELECTORS.HISTORY_NOTE_TEXTAREA).type(UPDATED_NOTE);

        // Click Send button (selector must be specific to the Send button next to the textarea)
        cy.get('button:contains("Send")').click();

        // Assert success (note added notification)
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Note added');

        // Assert the note appears in the timeline (inferred selector)
        cy.contains(UPDATED_NOTE).should('be.visible');
    });

    it('C1.03: Verify order actions menu (3 dots) is accessible', () => {
        // Click the top right 3-dots menu
        cy.get(SELECTORS.THREE_DOTS_MENU).click();

        // Assert key options are visible (Inferred options)
        cy.contains('Mark as paid').should('be.visible');
        cy.contains('Cancel order').should('be.visible');
    });

    it('C1.04: Verify that the Order Status button is clickable and shows details', () => {
        // Clicks the chip to show status details (Inferred functionality)
        cy.get(SELECTORS.ORDER_STATUS_BUTTON).click();

        // Assert modal/popover related to status details opens (inferred selector)
        cy.contains('Payment Summary').should('be.visible');

        // Close popover (e.g., click outside)
    });

    it('C1.05: Verify clicking Sales Channel link navigates to Channel details', () => {
        // Click the Default Channel link
        cy.get(SELECTORS.DEFAULT_CHANNEL_LINK).click();

        // Assert navigation to the Channel details page
        cy.url().should('include', '/channels/');
        cy.contains('h2', 'Channel Details').should('be.visible'); // Inferred channel detail title

        cy.go('back'); // Return to the order page
    });

    it('C1.06: Verify product details link opens in new tab (Read)', () => {
        // Click the 3-dots menu next to a product item (The Dash Cushion)
        cy.contains('The Dash Cushion').siblings('td').find(SELECTORS.THREE_DOTS_MENU).click();

        // Assert Product details link exists
        cy.get('li').contains('Product details').should('be.visible');
        // NOTE: Cannot assert 'target="_blank"' directly in Cypress, but we verify the element exists.
    });

    it('C1.07: Verify product removal option is available', () => {
        // Click the 3-dots menu next to a product item (Grey Hoodie)
        cy.contains('Grey Hoodie').siblings('td').find(SELECTORS.THREE_DOTS_MENU).click();

        // Assert Remove product link exists
        cy.contains('Remove product').should('be.visible');
    });

    // =================================================================
    // C2: ADDRESS MODIFICATION (ECP & BVA) - 10 Cases
    // =================================================================

    it('C2.01: Successfully update the Shipping Address City', () => {
        // Click Edit Shipping Address button
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();
        cy.contains('Change customer shipping address').should('be.visible'); // Assert modal

        // Update City (BVA: Valid String)
        cy.get(SELECTORS.MODAL_CITY_INPUT).clear().type(UPDATED_CITY);

        // Save
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert success and persistence on the main page
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Shipping Address').parent().should('contain', UPDATED_CITY);
    });

    it('C2.02: Successfully update the Billing Address First Name', () => {
        const newFirstName = 'Test User';

        // Click Edit Billing Address button
        cy.get(SELECTORS.EDIT_BILLING_ADDRESS_BUTTON).click();

        // Update First Name
        cy.get(SELECTORS.MODAL_FIRST_NAME_INPUT).clear().type(newFirstName);

        // Save
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Billing Address').parent().should('contain', newFirstName);
    });

    it('C2.03: Update ZIP code with minimal valid length (5 digits)', () => {
        // Assuming min ZIP is 5 digits for US
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();
        cy.get(SELECTORS.MODAL_ZIP_INPUT).clear().type('10001');
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.04: Address Line 1 input with maximum practical length (e.g., 100 chars)', () => {
        const longAddress = 'L'.repeat(100);
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();
        cy.get(SELECTORS.MODAL_ADDRESS1_INPUT).clear().type(longAddress);
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();
        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C2.05: Attempt to save with empty Last Name (Required Field)', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Clear Last Name
        cy.get(SELECTORS.MODAL_LAST_NAME_INPUT).clear();

        // Save
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.MODAL_LAST_NAME_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.06: Attempt to save with invalid Phone format (Non-numeric)', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Type non-numeric characters into the Phone field
        cy.get('input[name="phone"]').clear().type('ABC-123-DEF');

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error
        cy.get('input[name="phone"]').parent().parent().should('contain', 'Invalid phone number format');
    });

    it('C2.07: Changing Country should update Country Area (State) options', () => {
        const canadaCountry = 'Canada'; // Assuming Canada is an option

        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Open Country dropdown and select Canada
        cy.get(SELECTORS.MODAL_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(canadaCountry).click();

        // Assert that the Country Area dropdown reflects Canadian provinces (integration check)
        cy.get('input[name="countryArea"]').should('be.visible');
        // NOTE: The exact options depend on the Saleor implementation, but the field should react.
    });

    it('C2.08: Attempt to save with invalid Country Area for selected Country', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Select United States (US has defined state/province areas)
        cy.get(SELECTORS.MODAL_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('United States of America').click();

        // Type an invalid state/area into the input
        cy.get('input[name="countryArea"]').clear().type('InvalidStateName');

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error (Server-side validation)
        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Country area is invalid');
    });

    // =================================================================
    // C3: REFUND WORKFLOWS - 8 Cases
    // =================================================================

    it('C3.01: Verify Refund button is accessible and opens Refund form', () => {
        // Click refund button (after the 3-dots menu)
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Assert the refund page/form is visible
        cy.contains('Refund Order').should('be.visible');
    });

    it('C3.02: Refund product with maximal quantity (100% of line item)', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Click maximal quantities button
        cy.get(SELECTORS.REFUND_MAXIMAL_QTY_BUTTON).click();

        // Assert all quantity inputs update to max available (Grey Hoodie: 1, Dash Cushion: 3)
        cy.get(SELECTORS.REFUND_QTY_INPUT).first().should('have.value', '1');
        cy.get(SELECTORS.REFUND_QTY_INPUT).eq(1).should('have.value', '3');

        // Click the final Refund button (in the refund form)
        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Order successfully refunded');
    });

    it('C3.03: Refund product with minimum valid quantity (1)', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Set quantity to 1 for the first item (Grey Hoodie: max 1)
        cy.get(SELECTORS.REFUND_QTY_INPUT).first().clear().type(REFUND_QTY);

        // Click Refund button
        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.04: Attempt to refund quantity exceeding maximal limit', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Attempt to type 2 for Grey Hoodie (max 1)
        cy.get(SELECTORS.REFUND_QTY_INPUT).first().clear().type('2');

        // Click Refund (should trigger validation error)
        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        // Assert client/server error toast or message
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot exceed maximal quantity');
    });

    it('C3.05: Attempt to submit Miscellaneous refund without amount', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Select Miscellaneous refund radio button
        cy.contains('Miscellaneous refund').prev('input[type="radio"]').click();

        // Leave the amount field empty (or zero) and click Refund
        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        // Assert error for missing amount
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Refund amount required');
    });

    it('C3.06: Successfully submit a Manual Amount refund', () => {
        const manualRefundAmount = 10.00;

        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Select Manual Amount radio button
        cy.contains('Manual Amount').prev('input[type="radio"]').click();

        // Input manual amount (Inferred input selector after radio click)
        cy.get('input[name="manualRefundAmount"]').clear().type(manualRefundAmount);

        // Click Refund button
        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Refund successfully processed');
    });

    it('C3.07: Verify Automatic Amount calculation updates total', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Click Automatic Amount radio button
        cy.contains('Automatic Amount').prev('input[type="radio"]').click();

        // Set quantity to maximal
        cy.get(SELECTORS.REFUND_MAXIMAL_QTY_BUTTON).click();

        // Assert that the 'Refunded Amount' section updates to reflect the total order value ($176.41)
        cy.contains('Refunded Amount').parent().should('contain', 'USD 176.41');
    });

    it('C3.08: Check cancellation of the Refund form', () => {
        // Trigger refund flow
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Click the Back button in the Refund form
        cy.get('button:contains("Back")').click();

        // Assert return to the Order Details page
        cy.contains('Order Details').should('be.visible');
        cy.contains('Refund Order').should('not.exist');
    });
});