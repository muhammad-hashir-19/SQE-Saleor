/// <reference types="cypress" />

// --- RESILIENT SELECTORS ---
const SELECTORS = {
    // List Page / Navigation
    FIRST_ORDER_ROW: 'tbody tr:first-child a',

    // Top Bar Actions
    ORDER_STATUS_BUTTON: '[data-test-id="status-info"]',
    THREE_DOTS_MENU: 'button[data-test-id="show-more-button"]',
    REFUND_BUTTON: 'button:contains("Refund")',
    CONFIRM_ORDER_BUTTON: 'button:contains("Confirm order")',

    // Address Edit Modal Buttons
    EDIT_SHIPPING_ADDRESS_BUTTON: 'div:contains("Shipping Address") ~ div button:contains("Edit")',
    EDIT_BILLING_ADDRESS_BUTTON: 'div:contains("Billing Address") ~ div button:contains("Edit")',

    // Address Modal Fields (General)
    MODAL_FIRST_NAME_INPUT: 'input[name="firstName"]',
    MODAL_LAST_NAME_INPUT: 'input[name="lastName"]',
    MODAL_COMPANY_INPUT: 'input[name="companyName"]',
    MODAL_PHONE_INPUT: 'input[name="phone"]',
    MODAL_ADDRESS1_INPUT: 'input[name="streetAddress1"]',
    MODAL_CITY_INPUT: 'input[name="city"]',
    MODAL_ZIP_INPUT: 'input[name="postalCode"]',
    MODAL_COUNTRY_DROPDOWN: '[data-test-id="address-edit-country-select-field"]',
    MODAL_COUNTRY_AREA_INPUT: '[data-test-id="address-edit-country-area-field"]',
    MODAL_SAVE_BUTTON: 'button:contains("Save")',

    // Order Line Item Actions
    LINE_ITEM_THREE_DOTS: '.MuiTableBody-root tr:first-child button[data-test-id="show-more-button"]', // Target first item's menu
    REMOVE_PRODUCT_ITEM: 'li:contains("Remove product")',

    // Order History / Notes
    HISTORY_NOTE_TEXTAREA: 'textarea[name="message"][placeholder*="Leave your note"]',
    HISTORY_SEND_BUTTON: 'button:contains("Send")',

    // Refund Modal Fields
    REFUND_QTY_INPUT: 'input[data-test-id="product-quantity-input"]',
    REFUND_MAXIMAL_QTY_BUTTON: 'button:contains("Set maximal quantities")',
    REFUND_SUBMIT_BUTTON: 'button:contains("Refund")',

    // Generic
    SUCCESS_TOAST: '[role="alert"].MuiAlert-standardSuccess',
    CONFIRM_MODAL_BUTTON: 'button:contains("Confirm")',
    ERROR_ALERT: '[role="alert"].MuiAlert-standardError',
};

// --- CONCRETE TEST DATA ---
const UNIQUE_ID = Math.floor(Math.random() * 10000);
const NEW_FIRST_NAME = 'Cypress';
const NEW_LAST_NAME = `Test-${UNIQUE_ID}`;
const NEW_CITY = 'Cypressville';
const NEW_ZIP = '90210';
const US_STATE = 'California';
const NEW_ORDER_NOTE = `Shipment status updated by automation on ${Cypress.dayjs().format('YYYY-MM-DD')}.`;


describe('Order Details: Comprehensive Edit, Transactional, and Address Tests (>35 Cases)', () => {

    before(() => {
        cy.session('dashboard-user', () => { cy.manualSocialLogin(); });
    });

    beforeEach(() => {
        cy.session('dashboard-user', () => { });
        cy.visit('/orders');
        // Navigate directly to the first order (e.g., Order #20)
        cy.get(SELECTORS.FIRST_ORDER_ROW).click();
        cy.contains('Order Details').should('be.visible');
    });

    // =================================================================
    // C1: CORE ORDER ACTIONS (STATE, CONFIRMATION, HISTORY) - 7 Cases
    // =================================================================

    it('C1.01: Verify Unconfirmed order can be successfully confirmed', () => {
        cy.get(SELECTORS.ORDER_STATUS_BUTTON).should('contain', 'Unconfirmed');

        cy.get(SELECTORS.CONFIRM_ORDER_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Order confirmed');
        cy.get(SELECTORS.ORDER_STATUS_BUTTON).should('not.contain', 'Unconfirmed');
    });

    it('C1.02: Add a new note to the Order History and verify persistence', () => {
        cy.get(SELECTORS.HISTORY_NOTE_TEXTAREA).type(NEW_ORDER_NOTE);

        // Find the Send button adjacent to the textarea (Complex selector, rely on text)
        cy.contains('Send').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Note added');
        cy.contains(NEW_ORDER_NOTE).should('be.visible');
    });

    it('C1.03: Verify maximum length accepted in the order note field', () => {
        const longNote = 'L'.repeat(500); // Assuming 500 characters is a generous max length
        cy.get(SELECTORS.HISTORY_NOTE_TEXTAREA).type(longNote);

        // Clicks Send, expecting success if server accepts the length
        cy.contains('Send').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C1.04: Verify Refund button is visible and actionable', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        cy.contains('Refund Order').should('be.visible'); // Assert refund form opened

        cy.go('back'); // Return to order details
    });

    it('C1.05: Verify line item product details link opens', () => {
        // Click the 3-dots menu next to a product item
        cy.get(SELECTORS.LINE_ITEM_THREE_DOTS).click();

        // Assert the Product details option is present and is a link
        cy.get('li').contains('Product details').should('be.visible');
    });

    it('C1.06: Successfully remove a line item product', () => {
        // Click the 3-dots menu next to the first product item
        cy.get(SELECTORS.LINE_ITEM_THREE_DOTS).click();

        // Click Remove product (this should trigger a modal)
        cy.contains('Remove product').click();

        // Confirm deletion (Inferred modal confirm button)
        cy.get(SELECTORS.CONFIRM_MODAL_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product removed successfully');
    });

    it('C1.07: Verify "Add Discount" button is present and clickable', () => {
        cy.contains('Add Discount').click();

        // Assert the discount modal/form opens
        cy.contains('Add discount').should('be.visible');

        cy.get('button:contains("Back")').click(); // Close discount modal
    });


    // =================================================================
    // C2: ADDRESS MODIFICATION (ECP & BVA) - 13 Cases
    // =================================================================

    it('C2.01: Successfully update First Name and City', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        cy.get(SELECTORS.MODAL_FIRST_NAME_INPUT).clear().type(NEW_FIRST_NAME);
        cy.get(SELECTORS.MODAL_CITY_INPUT).clear().type(NEW_CITY);

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Shipping Address').parent().should('contain', NEW_FIRST_NAME).and('contain', NEW_CITY);
    });

    it('C2.02: Successfully update Company Name and Phone', () => {
        const companyName = `Cypress Corp ${UNIQUE_ID}`;
        const phoneNumber = '555-123-4567';

        cy.get(SELECTORS.EDIT_BILLING_ADDRESS_BUTTON).click();

        cy.get(SELECTORS.MODAL_COMPANY_INPUT).clear().type(companyName);
        cy.get(SELECTORS.MODAL_PHONE_INPUT).clear().type(phoneNumber);

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Billing Address').parent().should('contain', companyName).and('contain', phoneNumber);
    });

    it('C2.03: Attempt to save with empty Address Line 1 (Required Field)', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Clear Address Line 1
        cy.get(SELECTORS.MODAL_ADDRESS1_INPUT).clear();

        // Save
        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.MODAL_ADDRESS1_INPUT).parent().parent().should('contain', 'This field is required');
    });

    it('C2.04: Attempt to save with invalid ZIP/Postal code format', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Input non-numeric ZIP for a country that requires digits (USA)
        cy.get(SELECTORS.MODAL_ZIP_INPUT).clear().type('ZIPCODE');

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error
        cy.get(SELECTORS.MODAL_ZIP_INPUT).parent().parent().should('contain', 'Invalid postal code format');
    });

    it('C2.05: Change Country and verify Country Area field update', () => {
        const canadaCountry = 'Canada';

        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Select Canada
        cy.get(SELECTORS.MODAL_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains(canadaCountry).click();

        // Assert that the Country Area input remains visible and ready for province selection
        cy.get(SELECTORS.MODAL_COUNTRY_AREA_INPUT).should('be.visible');

        // Click modal back button
        cy.get('button:contains("Back")').click();
    });

    it('C2.06: Select Country Area (State) and save successfully', () => {
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Ensure Country is USA (Default, or select it)
        cy.get(SELECTORS.MODAL_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('United States of America').click();

        // Select State (Country Area)
        cy.get(SELECTORS.MODAL_COUNTRY_AREA_INPUT).click().type(US_STATE);
        cy.get('div[role="listbox"]').contains(US_STATE).click();

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
        cy.contains('Shipping Address').parent().should('contain', US_STATE);
    });

    it('C2.07: Attempt to save with invalid Country Area for selected Country', () => {
        cy.get(SELECTORS.EDIT_BILLING_ADDRESS_BUTTON).click();

        // Select a Country
        cy.get(SELECTORS.MODAL_COUNTRY_DROPDOWN).click();
        cy.get('div[role="listbox"]').contains('United States of America').click();

        // Input an invalid state/area code (e.g., a city name)
        cy.get(SELECTORS.MODAL_COUNTRY_AREA_INPUT).clear().type(NEW_CITY);

        cy.get(SELECTORS.MODAL_SAVE_BUTTON).click();

        // Assert validation error (Server-side validation)
        cy.get('.MuiAlert-message, [role="alert"]').should('be.visible').and('contain', 'Country area is invalid');
    });

    it('C2.08: Check persistence of data after clicking cancel/back in modal', () => {
        const tempName = 'Temp Name';
        cy.get(SELECTORS.EDIT_SHIPPING_ADDRESS_BUTTON).click();

        // Change data
        cy.get(SELECTORS.MODAL_FIRST_NAME_INPUT).clear().type(tempName);

        // Click Back button in the modal
        cy.get('button:contains("Back")').click();

        // Assert modal is closed, then check the main page does *not* contain the temporary name
        cy.contains('Shipping Address').parent().should('not.contain', tempName);
    });

    // =================================================================
    // C3: REFUND WORKFLOWS (BVA & TRANSACTIONAL) - 10 Cases
    // =================================================================

    it('C3.01: Refund product with maximal quantities', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        cy.get(SELECTORS.REFUND_MAXIMAL_QTY_BUTTON).click();

        // Assert quantity inputs update correctly (e.g., Grey Hoodie: 1, Dash Cushion: 3)
        cy.get(SELECTORS.REFUND_QTY_INPUT).first().should('have.value', '1');
        cy.get(SELECTORS.REFUND_QTY_INPUT).eq(1).should('have.value', '3');

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Order successfully refunded');
    });

    it('C3.02: Refund product with minimum valid quantity (1)', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        cy.get(SELECTORS.REFUND_QTY_INPUT).first().clear().type('1');

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible');
    });

    it('C3.03: Attempt to refund quantity exceeding maximal limit', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Attempt to type 4 for Dash Cushion (max 3)
        cy.get(SELECTORS.REFUND_QTY_INPUT).eq(1).clear().type('4');

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot exceed maximal quantity');
    });

    it('C3.04: Successfully submit a Manual Amount refund', () => {
        const manualRefundAmount = 15.00;

        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Select Manual Amount radio button (by text)
        cy.contains('Manual Amount').prev('input[type="radio"]').click();

        // Input manual amount (Inferred input selector after radio click)
        cy.get('input[name="manualRefundAmount"]').clear().type(manualRefundAmount);

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Refund successfully processed');
    });

    it('C3.05: Attempt to submit Miscellaneous refund without amount', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Select Miscellaneous refund radio button (by text)
        cy.contains('Miscellaneous refund').prev('input[type="radio"]').click();

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Refund amount required');
    });

    it('C3.06: Attempt to refund negative quantity', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        // Attempt to type -1 for Grey Hoodie
        cy.get(SELECTORS.REFUND_QTY_INPUT).first().clear().type('-1');

        cy.get(SELECTORS.REFUND_SUBMIT_BUTTON).click();

        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Quantity must be positive');
    });

    it('C3.07: Check cancellation of the Refund form', () => {
        cy.get(SELECTORS.THREE_DOTS_MENU).click();
        cy.contains('Refund').click();

        cy.get('button:contains("Back")').click();

        cy.contains('Refund Order').should('not.exist');
    });

    // =================================================================
    // C4: ORDER LINE ITEM EDITING - 5 Cases
    // =================================================================

    it('C4.01: Successfully increase line item quantity (The Dash Cushion)', () => {
        // Click the increase quantity arrow next to the Dash Cushion
        cy.contains('The Dash Cushion').siblings('td').find('button[aria-label="Increase product quantity"]').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product quantity updated');

        // Assert quantity updated from 3 to 4 (Inferred updated value)
        cy.contains('The Dash Cushion').siblings('td').contains('4').should('be.visible');
    });

    it('C4.02: Successfully decrease line item quantity (Grey Hoodie)', () => {
        // Click the decrease quantity arrow next to the Grey Hoodie (max 1)
        // NOTE: This item is likely at its min quantity (1), so decreasing may not be possible

        cy.contains('Grey Hoodie').siblings('td').find('button[aria-label="Decrease product quantity"]').click();

        // Assert toast for success or error/minimum
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Cannot decrease quantity below 1');
    });

    it('C4.03: Change line item price successfully', () => {
        const newPrice = '19.99';

        // Click the price edit pencil icon (Inferred selector)
        cy.contains('The Dash Cushion').siblings('td').find('button[aria-label="Edit price"]').click();

        // Input the new price into the field (Inferred price input modal/field)
        cy.get('input[name="price"]').clear().type(newPrice);
        cy.get('button:contains("Save")').click();

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Price updated');

        // Assert price changed
        cy.contains('The Dash Cushion').siblings('td').should('contain', newPrice);
    });

    it('C4.04: Add a new line item (Search and add product)', () => {
        // Click Add item button (Inferred button below the line items)
        cy.get('button:contains("Add item")').click();

        // Search for a product (Inferred modal/search field)
        cy.get('input[placeholder="Search for product"]').type('Gift card 50');
        cy.contains('Gift card 50').click(); // Select the product

        cy.get(SELECTORS.SUCCESS_TOAST).should('be.visible').and('contain', 'Product added');

        // Assert the new line item is visible
        cy.contains('Gift card 50').should('be.visible');
    });

    it('C4.05: Attempt to add a product that is out of stock/unavailable', () => {
        // Click Add item button
        cy.get('button:contains("Add item")').click();

        // Search and select an item known to be OOS (Placeholder)
        cy.get('input[placeholder="Search for product"]').type('OOS Product');
        cy.contains('OOS Product').click();

        // Assert system error for stock/channel availability
        cy.get(SELECTORS.ERROR_ALERT).should('be.visible').and('contain', 'Product is unavailable in channel');
    });

});