#!/bin/bash

# Seed leads via backend API
API_URL="https://bull-connect-crm.onrender.com"

echo "Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@bull","password":"adminPWD@Bull26"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Get campaign IDs
echo "Fetching campaigns..."
SUMMER_CAMPAIGN=$(curl -s "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[] | select(.name == "Summer Irrigation 2026") | .id' | head -1)

ORGANIC_CAMPAIGN=$(curl -s "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[] | select(.name == "Organic Fertilizer Drive") | .id' | head -1)

echo "Summer Campaign ID: $SUMMER_CAMPAIGN"
echo "Organic Campaign ID: $ORGANIC_CAMPAIGN"

if [ -z "$SUMMER_CAMPAIGN" ] || [ "$SUMMER_CAMPAIGN" = "null" ]; then
  echo "Summer Irrigation campaign not found!"
  exit 1
fi

if [ -z "$ORGANIC_CAMPAIGN" ] || [ "$ORGANIC_CAMPAIGN" = "null" ]; then
  echo "Organic Fertilizer campaign not found!"
  exit 1
fi

# Function to create a lead
create_lead() {
  local NAME=$1
  local PHONE=$2
  local VILLAGE=$3
  local TALUKA=$4
  local DISTRICT=$5
  local STATE=$6
  local CAMPAIGN_ID=$7
  
  echo "Creating lead: $NAME ($PHONE)..."
  RESPONSE=$(curl -s -X POST "$API_URL/leads" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"farmer_name\": \"$NAME\",
      \"phone_number\": \"$PHONE\",
      \"village\": \"$VILLAGE\",
      \"taluka\": \"$TALUKA\",
      \"district\": \"$DISTRICT\",
      \"state\": \"$STATE\",
      \"campaign_id\": \"$CAMPAIGN_ID\"
    }")
  
  if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "  ERROR: $(echo $RESPONSE | jq -r '.error')"
  fi
  sleep 0.5
}

echo "Creating leads for Summer Irrigation 2026..."
create_lead "Shankar Pawar" "9112345001" "Wadgaon" "Haveli" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Laxman Jadhav" "9112345002" "Shirur" "Shirur" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Narayan Bhosale" "9112345003" "Baramati" "Baramati" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Dattatray Gaikwad" "9112345004" "Indapur" "Indapur" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Vitthal Kale" "9112345005" "Daund" "Daund" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Tukaram Shinde" "9112345006" "Bhor" "Bhor" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Ramchandra Pawar" "9112345007" "Maval" "Maval" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Pandurang More" "9112345008" "Mulshi" "Mulshi" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Madhav Salunkhe" "9112345009" "Junnar" "Junnar" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Govind Deshmukh" "9112345010" "Ambegaon" "Ambegaon" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Suryakant Bhagat" "9112345011" "Jejuri" "Purandar" "Pune" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Keshav Patil" "9222345101" "Nashik Road" "Nashik" "Nashik" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Sambhaji Gawade" "9222345102" "Dindori" "Dindori" "Nashik" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Raghunath Sawant" "9222345103" "Sinnar" "Sinnar" "Nashik" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Bhaskar Mane" "9222345104" "Igatpuri" "Igatpuri" "Nashik" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Devidas Bhor" "9332345201" "Karad" "Karad" "Satara" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Maruti Ghatge" "9332345202" "Koregaon" "Koregaon" "Satara" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Balaji Shinde" "9332345203" "Phaltan" "Phaltan" "Satara" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Yashwant Jadhav" "9332345204" "Wai" "Wai" "Satara" "Maharashtra" "$SUMMER_CAMPAIGN"
create_lead "Chandrakant Patil" "9332345205" "Satara" "Satara" "Satara" "Maharashtra" "$SUMMER_CAMPAIGN"

echo "Creating leads for Organic Fertilizer Drive..."
create_lead "Anant Kulkarni" "9442345301" "Solapur" "Solapur" "Solapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Dnyaneshwar Jadhav" "9442345302" "Pandharpur" "Pandharpur" "Solapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Ramdas Pawar" "9442345303" "Barshi" "Barshi" "Solapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Sanjay Shinde" "9442345304" "Akkalkot" "Akkalkot" "Solapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Mahadev Bhosale" "9552345401" "Kolhapur" "Kolhapur" "Kolhapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Prakash Patil" "9552345402" "Ichalkaranji" "Hatkanangale" "Kolhapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Appasaheb More" "9552345403" "Kagal" "Kagal" "Kolhapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Bhaurao Desai" "9552345404" "Panhala" "Panhala" "Kolhapur" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Sadashiv Gaikwad" "9662345501" "Sangli" "Sangli" "Sangli" "Maharashtra" "$ORGANIC_CAMPAIGN"
create_lead "Vishwanath Kale" "9662345502" "Miraj" "Miraj" "Sangli" "Maharashtra" "$ORGANIC_CAMPAIGN"

echo "Done! Verifying lead count..."
LEAD_COUNT=$(curl -s "$API_URL/leads" -H "Authorization: Bearer $TOKEN" | jq 'length')
echo "$LEAD_COUNT leads created successfully!"
