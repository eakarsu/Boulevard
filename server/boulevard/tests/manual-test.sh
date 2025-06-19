#!/bin/bash

# Boulevard API Manual Test Suite
# Run this script to test all endpoints manually

BASE_URL="http://localhost:8000/api/boulevard"

echo "🧪 Boulevard API Test Suite"
echo "=========================="
echo ""

# Test 1: Get Locations
echo "📍 Test 1: Get Business Locations"
echo "curl -X GET $BASE_URL/business/locations"
LOCATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/business/locations")
echo "Response: $LOCATIONS_RESPONSE"
echo ""

# Test 2: Create Cart
echo "🛒 Test 2: Create Cart"
echo "curl -X POST $BASE_URL/cart/create -H 'Content-Type: application/json' -d '{\"locationId\": 1}'"
CART_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/create" -H "Content-Type: application/json" -d '{"locationId": 1}')
echo "Response: $CART_RESPONSE"

# Extract cart ID for subsequent tests
CART_ID=$(echo $CART_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Cart ID: $CART_ID"
echo ""

# Test 3: Get Service Details
echo "🔍 Test 3: Get Service Details"
SERVICE_ID="urn:blvd:Service:1"
echo "curl -X GET $BASE_URL/cart/$CART_ID/item/$SERVICE_ID"
SERVICE_RESPONSE=$(curl -s -X GET "$BASE_URL/cart/$CART_ID/item/$SERVICE_ID")
echo "Response: $SERVICE_RESPONSE"
echo ""

# Test 4: Add Item to Cart
echo "➕ Test 4: Add Bookable Item to Cart"
echo "curl -X POST $BASE_URL/cart/add-bookable-item -H 'Content-Type: application/json' -d '{\"id\": \"$CART_ID\", \"itemId\": \"$SERVICE_ID\", \"itemStaffVariantId\": 1}'"
ADD_ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/add-bookable-item" -H "Content-Type: application/json" -d "{\"id\": \"$CART_ID\", \"itemId\": \"$SERVICE_ID\", \"itemStaffVariantId\": 1}")
echo "Response: $ADD_ITEM_RESPONSE"
echo ""

# Test 5: Update Cart with Client Info
echo "👤 Test 5: Update Cart with Client Information"
CLIENT_DATA='{"id": "'$CART_ID'", "clientInformation": {"email": "test@example.com", "firstName": "John", "lastName": "Doe", "phoneNumber": "555-1234"}}'
echo "curl -X POST $BASE_URL/cart/update -H 'Content-Type: application/json' -d '$CLIENT_DATA'"
UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/update" -H "Content-Type: application/json" -d "$CLIENT_DATA")
echo "Response: $UPDATE_RESPONSE"
echo ""

# Test 6: Create Cart Guest
echo "👥 Test 6: Create Cart Guest"
GUEST_DATA='{"id": "'$CART_ID'", "email": "guest@example.com", "firstName": "Jane", "lastName": "Smith", "phoneNumber": "555-5678"}'
echo "curl -X POST $BASE_URL/create-cart-guest -H 'Content-Type: application/json' -d '$GUEST_DATA'"
GUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/create-cart-guest" -H "Content-Type: application/json" -d "$GUEST_DATA")
echo "Response: $GUEST_RESPONSE"
echo ""

# Test 7: Add Payment Method
echo "💳 Test 7: Add Card Payment Method"
PAYMENT_DATA='{"id": "'$CART_ID'", "token": "test_token_123", "select": true}'
echo "curl -X POST $BASE_URL/add-cart-card-payment-method -H 'Content-Type: application/json' -d '$PAYMENT_DATA'"
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/add-cart-card-payment-method" -H "Content-Type: application/json" -d "$PAYMENT_DATA")
echo "Response: $PAYMENT_RESPONSE"
echo ""

# Test 8: Checkout Cart
echo "✅ Test 8: Checkout Cart"
CHECKOUT_DATA='{"id": "'$CART_ID'"}'
echo "curl -X POST $BASE_URL/checkout-cart -H 'Content-Type: application/json' -d '$CHECKOUT_DATA'"
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/checkout-cart" -H "Content-Type: application/json" -d "$CHECKOUT_DATA")
echo "Response: $CHECKOUT_RESPONSE"
echo ""

echo "🎉 All tests completed!"
echo "Check the responses above for any errors."
