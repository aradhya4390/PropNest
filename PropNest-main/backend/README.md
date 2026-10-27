# PropNest API

## Run locally

1. Copy `.env.example` to `.env` (or add the listed variables to your existing `.env`).
2. Set `MONGO_URI` and a random `JWT_SECRET` of at least 32 characters.
3. Configure the Cloudinary values to enable image uploads and the Groq values to enable the AI assistant. Do not commit `.env`.
4. From this directory, run `npm install` and `npm run dev`. The API listens on port `5000` by default.
5. Set `VITE_API_URL=http://localhost:5000/api` in the frontend environment if the API is hosted elsewhere.

Property CRUD works without Cloudinary, but image endpoints return `503` until Cloudinary is configured. The assistant similarly returns `503` until `GROQ_API_KEY` is configured. `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`; set it to a model available to your Groq account if that model changes.

## Authentication

Register or log in using the existing `/api/auth/register` and `/api/auth/login` endpoints. Pass the returned access token as `Authorization: Bearer <token>` to all owner endpoints and the assistant endpoint. Only users with the `Property Owner` role can access owner listing routes.

## Property endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/properties` | Public | Active listings |
| `GET` | `/api/properties/:id` | Public | Active listing details |
| `GET` | `/api/properties/mine` | Property Owner | Owner's listings |
| `GET` | `/api/properties/mine/:id` | Property Owner | Owner's listing details |
| `GET` | `/api/properties/dashboard` | Property Owner | Listing counts |
| `POST` | `/api/properties` | Property Owner | Create listing |
| `PUT` | `/api/properties/:id` | Property Owner | Update owned listing |
| `DELETE` | `/api/properties/:id` | Property Owner | Delete owned listing |
| `POST` | `/api/properties/:id/images` | Property Owner | Upload up to 5 images (`multipart/form-data`, field `images`) |
| `DELETE` | `/api/properties/:id/images/:imageId` | Property Owner | Delete an owned image |

JSON body for `POST /api/properties` (the same fields are accepted for `PUT`):

```json
{
  "title": "Sunny two-bedroom near the park",
  "description": "Bright apartment with a balcony, updated kitchen, and easy access to local transit.",
  "propertyType": "Apartment",
  "listingType": "Rent",
  "price": 35000,
  "location": { "city": "Pune", "state": "Maharashtra", "postalCode": "411006" },
  "address": "24 Garden Road",
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 1240,
  "amenities": ["Balcony", "Parking"],
  "status": "Active"
}
```

Successful creation returns `201`:

```json
{
  "success": true,
  "message": "Property created",
  "data": {
    "property": {
      "_id": "PROPERTY_ID",
      "title": "Sunny two-bedroom near the park",
      "owner": "OWNER_ID",
      "status": "Active",
      "images": []
    }
  }
}
```

`GET /api/properties/dashboard` returns `data` with `total`, `active`, `rentedOrSold`, `rented`, `sold`, and `pending` counts. Image records include the Cloudinary URL, public ID, format, byte count, and original filename.

## AI assistant

`POST /api/assistant/chat` requires a bearer token. It accepts 1–12 user/assistant messages, with a 4,000-character limit per message, and is limited to 10 requests per minute per IP.

```json
{
  "messages": [
    { "role": "user", "content": "Suggest a title for a sunny two-bedroom apartment in Pune." }
  ]
}
```

Successful response:

```json
{ "success": true, "data": { "reply": "Bright Pune Apartment with a Sunny Balcony" } }
```

Upstream quota and network errors are returned as clear `429`, `502`, `503`, or `504` responses; API credentials remain on the backend.
