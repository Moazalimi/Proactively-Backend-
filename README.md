# Speaker Booking Platform API Documentation

## Overview
This API allows users to manage speaker bookings, user authentication, and speaker profiles. The API is built using Express.js and uses JWT for authentication.

## Base URL

http://localhost:3000/api

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

Authorization: Bearer <your_jwt_token>

## API Endpoints

### Authentication

#### 1. Sign Up
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "password": "string",
    "userType": "user" | "speaker"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "User created successfully. Please verify your email."
  }
  ```

#### 2. Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Description**: Authenticate user and receive JWT token
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string"
  }
  ```

#### 3. Verify OTP
- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Description**: Verify email using OTP
- **Request Body**:
  ```json
  {
    "email": "string",
    "otp": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

### Speakers

#### 1. Get All Speakers
- **URL**: `/speakers`
- **Method**: `GET`
- **Description**: Retrieve list of all available speakers
- **Authentication**: Not required
- **Response**:
  ```json
  [
    {
      "first_name": "string",
      "last_name": "string",
      "expertise": "string",
      "price_per_session": "number"
    }
  ]
  ```

#### 2. Create/Update Speaker Profile
- **URL**: `/speakers/profile`
- **Method**: `POST`
- **Description**: Create or update speaker profile
- **Authentication**: Required (Speaker only)
- **Request Body**:
  ```json
  {
    "expertise": "string",
    "pricePerSession": "number"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Speaker profile updated successfully"
  }
  ```

### Bookings

#### 1. Get Available Time Slots
- **URL**: `/bookings/available-slots/:speakerId/:date`
- **Method**: `GET`
- **Description**: Get available time slots for a speaker on a specific date
- **Parameters**:
  - `speakerId`: Speaker's user ID
  - `date`: Date in YYYY-MM-DD format
- **Response**:
  ```json
  [
    "9:00",
    "10:00",
    "11:00"
  ]
  ```

#### 2. Book a Session
- **URL**: `/bookings/book`
- **Method**: `POST`
- **Description**: Book a session with a speaker
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "speakerId": "number",
    "date": "YYYY-MM-DD",
    "timeSlot": "HH:mm"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Session booked successfully"
  }
  ```

## Error Responses
All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Error message",
      "param": "field_name",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

## Environment Variables
Required environment variables for the API:
```
PORT=3000
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

## Code References
This documentation is based on the following implementation files:
- Auth Routes: 
```javascript:src/routes/auth.js
startLine: 1
endLine: 105
```
- Booking Routes:
```javascript:src/routes/bookings.js
startLine: 1
endLine: 91
```
- Speaker Routes:
```javascript:src/routes/speakers.js
startLine: 1
endLine: 51
```
```

This documentation provides a comprehensive overview of all API endpoints, their usage, and expected responses. The documentation follows RESTful conventions and includes all necessary information for developers to integrate with the API.



