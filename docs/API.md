# Barber Shop Management System API Documentation

## Authentication Endpoints

### Customer Registration
- **POST** `/register`
- **Body**: `{ name, email, password, phone? }`
- **Response**: Redirect to login page

### Customer Login
- **POST** `/login`
- **Body**: `{ email, password }`
- **Response**: Sets session and redirects to dashboard

### Customer Logout
- **POST** `/logout`
- **Response**: Clears session and redirects to home

### Admin Login
- **POST** `/admin/login`
- **Body**: `{ username, password }`
- **Response**: Sets admin session and redirects to admin dashboard

## Appointment Endpoints

### Book Appointment
- **POST** `/appointments/book`
- **Body**: `{ service_id, barber_id, appointment_date, notes? }`
- **Response**: Creates appointment and redirects to dashboard

### Get Available Time Slots
- **GET** `/appointments/api/available-slots?barber_id=&date=`
- **Response**: `{ success: boolean, slots: array }`

### View Appointment Details
- **GET** `/appointments/:id`
- **Response**: Renders appointment details page

### Cancel Appointment
- **PUT** `/appointments/:id/cancel`
- **Body**: `{ reason? }`
- **Response**: Updates appointment status to cancelled

### Reschedule Appointment
- **PUT** `/appointments/:id/reschedule`
- **Body**: `{ new_date }`
- **Response**: Updates appointment date

## Service Endpoints

### Get All Services
- **GET** `/services`
- **Response**: Renders services page

### Get Service Details
- **GET** `/services/:id`
- **Response**: Renders service details page

### Get Services API
- **GET** `/services/api/list`
- **Response**: `{ success: boolean, services: array }`

## Barber Endpoints

### Get All Barbers
- **GET** `/barbers`
- **Response**: Renders barbers page

### Get Barber Details
- **GET** `/barbers/:id`
- **Response**: Renders barber details page

### Get Barbers API
- **GET** `/barbers/api/list`
- **Response**: `{ success: boolean, barbers: array }`

### Get Barber Ratings
- **GET** `/barbers/api/:barber_id/ratings`
- **Response**: `{ success: boolean, ratings: array, averageRating: number, totalRatings: number }`

## Rating Endpoints

### Show Rating Form
- **GET** `/ratings/:appointment_id/rate`
- **Response**: Renders rating form

### Submit Rating
- **POST** `/ratings/:appointment_id/rate`
- **Body**: `{ rating, review? }`
- **Response**: Creates rating and redirects to dashboard

## Customer Endpoints

### Customer Dashboard
- **GET** `/customer/dashboard`
- **Response**: Renders customer dashboard

### Customer Profile
- **GET** `/customer/profile`
- **Response**: Renders profile page

### Update Profile
- **PUT** `/customer/profile`
- **Body**: `{ name, phone? }`
- **Response**: Updates customer profile

### Appointment History
- **GET** `/customer/appointments`
- **Response**: Renders appointment history

### Change Password
- **PUT** `/customer/change-password`
- **Body**: `{ current_password, new_password, confirm_password }`
- **Response**: Updates password

## Admin Endpoints

### Admin Dashboard
- **GET** `/admin/dashboard`
- **Response**: Renders admin dashboard

### Dashboard Stats API
- **GET** `/admin/api/dashboard-stats`
- **Response**: `{ success: boolean, stats: object }`

### Admin Logout
- **POST** `/admin/logout`
- **Response**: Clears admin session and redirects to admin login