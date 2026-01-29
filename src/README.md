# Mergington High School Activities

A web application that allows students to explore extracurricular activities and teachers to manage student registrations at Mergington High School.

## Features

### Student Features
- Browse extracurricular activities with detailed information (description, schedule, participant count)
- Search activities by name or description
- Filter activities by:
  - Category (Sports, Arts, Academic, Community, Technology)
  - Day of the week (Monday-Sunday)
  - Time of day (Before School, After School, Weekend)
- Toggle between Filter View and Group by Category View
- Dark mode support with theme persistence

### Teacher Features
- Secure authentication system (login/logout)
- Register students for activities
- Unregister students from activities
- View current participant lists

## Technical Stack

### Frontend
- HTML, CSS, and JavaScript
- Responsive design with dark mode support
- Dynamic filtering and search capabilities

### Backend
- FastAPI (Python web framework)
- MongoDB for data storage
- RESTful API with endpoints for:
  - Activity retrieval and filtering
  - Student registration management
  - Teacher authentication
- Argon2 password hashing for security

## For Teachers

Need to request a change, fix a bug, or update content? See our [How to Request Changes Guide](../docs/how-to-request-changes.md) to learn how to create issues without writing code.

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).
